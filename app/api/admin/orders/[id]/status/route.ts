/**
 * PATCH /api/admin/orders/[id]/status
 *
 * Change the status of order lines.
 * Body: { status, notes?, item_ids? }
 *   item_ids given   -> exactly those lines (every one must be allowed to make the move)
 *   item_ids omitted -> every line that is allowed to make the move; the rest are skipped
 *
 * The order's own status is derived from its lines in the database.
 * Return and refund statuses are handled by the returns and refunds endpoints.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireStaffApi } from '@/lib/api/auth';
import { updateItemStatuses } from '@/lib/db/orders';
import { createAdminClient } from '@/lib/supabase/admin';
import { nextStatuses } from '@/lib/orders/itemStatus';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireStaffApi(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = (await request.json()) as { status?: string; notes?: string; item_ids?: string[] };
  if (!body.status) {
    return NextResponse.json({ error: 'status is required.' }, { status: 400 });
  }
  const explicit = Array.isArray(body.item_ids) ? body.item_ids : null;
  if (explicit && explicit.length === 0) {
    return NextResponse.json({ error: 'item_ids cannot be empty.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: items, error: fetchErr } = await admin
    .from('order_items')
    .select('id, status')
    .eq('order_id', id);
  if (fetchErr || !items || items.length === 0) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }

  const targets = explicit ? items.filter((i) => explicit.includes(i.id)) : items;
  if (explicit && targets.length !== new Set(explicit).size) {
    return NextResponse.json({ error: 'Some items are not part of this order.' }, { status: 400 });
  }

  const eligible = targets.filter((i) => nextStatuses(i.status).includes(body.status!));
  if (explicit && eligible.length !== targets.length) {
    const bad = targets.find((i) => !nextStatuses(i.status).includes(body.status!))!;
    return NextResponse.json(
      {
        error: `Cannot move an item from '${bad.status}' to '${body.status}'. Allowed: ${nextStatuses(bad.status).join(', ') || 'none'}.`,
      },
      { status: 422 }
    );
  }
  if (eligible.length === 0) {
    return NextResponse.json(
      { error: `No item can move to '${body.status}' from its current status.` },
      { status: 422 }
    );
  }

  try {
    const updated = await updateItemStatuses({
      orderId: id,
      itemIds: eligible.map((i) => i.id),
      newStatus: body.status,
      actorId: auth.user.id,
      notes: body.notes,
    });
    return NextResponse.json({ success: true, updated, skipped: targets.length - eligible.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
