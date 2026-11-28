/**
 * Per-line return eligibility for the customer pages.
 * Server-only (uses the service-role client).
 */
import { createAdminClient } from '@/lib/supabase/admin';
import { getPolicySettings } from '@/lib/policy-settings';
import { signPhotoPaths } from '@/lib/uploads';

type Line = { id: string; status: string };
type History = { order_item_id: string | null; new_status: string; created_at: string };
type OrderLike<L extends Line> = {
  updated_at: string;
  order_items: L[];
  order_status_history?: History[] | null;
};

export type ReturnSummary = {
  id: string;
  status: string;
  reason: string;
  description: string | null;
  createdAt: string;
  /** Signed, short-lived photo URLs */
  photos: string[];
};
type ActiveReturn = { returnId: string; returnStatus: string; summary: ReturnSummary };

/**
 * For each line, its current return request (cancelled ones are ignored).
 * A line is in at most one active return; a rejected one still counts, so the same
 * line cannot be returned twice.
 */
async function activeReturnsByLine(orderIds: string[]): Promise<Map<string, ActiveReturn>> {
  const map = new Map<string, ActiveReturn>();
  if (orderIds.length === 0) return map;
  const admin = createAdminClient();
  const { data } = await admin
    .from('return_request_items')
    .select(
      'order_item_id, return_requests!inner(id, status, order_id, reason, description, photos, created_at)'
    )
    .in('return_requests.order_id', orderIds)
    .neq('return_requests.status', 'cancelled');
  for (const r of data ?? []) {
    const rr = r.return_requests as unknown as {
      id: string;
      status: string;
      reason: string;
      description: string | null;
      photos: string[] | null;
      created_at: string;
    };
    map.set(r.order_item_id, {
      returnId: rr.id,
      returnStatus: rr.status,
      summary: {
        id: rr.id,
        status: rr.status,
        reason: rr.reason,
        description: rr.description,
        createdAt: rr.created_at,
        photos: rr.photos ?? [],
      },
    });
  }
  // Photos are stored as private paths. Sign each distinct return once.
  const summaries = new Map<string, ReturnSummary>();
  for (const a of map.values()) summaries.set(a.summary.id, a.summary);
  await Promise.all(
    [...summaries.values()].map(async (sum) => {
      sum.photos = await signPhotoPaths(sum.photos);
    })
  );
  return map;
}

/**
 * Adds `returned`, `returnId`, `returnStatus`, `returnInfo`, `canReturn`, `canCancelReturn` and
 * `returnDeadline` to every line of each order.
 * The window runs from the line's own delivered date.
 */
export async function withReturnInfo<L extends Line, O extends OrderLike<L> & { id: string }>(
  orders: O[]
) {
  const [active, { returnWindowDays }] = await Promise.all([
    activeReturnsByLine(orders.map((o) => o.id)),
    getPolicySettings(),
  ]);
  const result = orders.map((o) => ({
    ...o,
    order_items: o.order_items.map((i) => {
      const deliveredAt = (o.order_status_history ?? [])
        .filter((h) => h.order_item_id === i.id && h.new_status === 'delivered')
        .map((h) => new Date(h.created_at).getTime())
        .sort((a, b) => b - a)[0];
      const baseline = deliveredAt ?? new Date(o.updated_at).getTime();
      const returnDeadline = new Date(baseline + returnWindowDays * 86_400_000).toISOString();
      const ret = active.get(i.id);
      return {
        ...i,
        returned: !!ret,
        returnId: ret?.returnId ?? null,
        returnStatus: ret?.returnStatus ?? null,
        returnInfo: ret?.summary ?? null,
        canReturn: i.status === 'delivered' && !ret && Date.now() <= Date.parse(returnDeadline),
        canCancelReturn: ret?.returnStatus === 'pending' && i.status === 'return_requested',
        returnDeadline,
      };
    }),
  }));
  return { orders: result, returnWindowDays };
}
