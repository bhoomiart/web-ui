/**
 * POST /api/returns
 *
 * Customer-facing: request a return for one or more delivered order lines.
 * Signed-in customers identify the order by order number (it must be theirs).
 * Guests identify it by phone + order number.
 *
 * Body: { order_number, phone?, reason, description?,
 *         items: [{ order_item_id, quantity }], photos?: string[] }
 * `photos` are storage paths returned by POST /api/uploads (kind 'return').
 *
 * A customer can return part of a line (for example 2 of 3). Each line has its own
 * delivered date and return window, so returning one product never touches the others.
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  getOrderByPhoneAndNumber,
  getOrderForUser,
  createReturnRequest,
  ReturnError,
} from '@/lib/db/orders';
import { getCustomer } from '@/lib/auth/customer';
import { getPolicySettings } from '@/lib/policy-settings';
import { parsePhotoPaths } from '@/lib/uploads';

type OrderLine = { id: string; status: string; quantity: number };
type HistoryRow = { order_item_id: string | null; new_status: string; created_at: string };

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Record<string, unknown>;
  const phone = (body.phone as string | undefined)?.trim();
  const orderNumber = (body.order_number as string | undefined)?.trim();
  const customer = await getCustomer();
  if (!orderNumber || (!customer && !phone)) {
    return NextResponse.json({ error: 'phone and order_number are required.' }, { status: 400 });
  }

  const reason = body.reason as string | undefined;
  const validReasons = ['damaged', 'wrong_item', 'changed_mind', 'quality_issue', 'other'];
  if (!reason || !validReasons.includes(reason)) {
    return NextResponse.json(
      { error: `reason must be one of: ${validReasons.join(', ')}.` },
      { status: 400 }
    );
  }

  const rawItems = body.items;
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return NextResponse.json({ error: 'Select at least one item to return.' }, { status: 400 });
  }
  const wanted: Array<{ itemId: string; quantity: number }> = [];
  for (const r of rawItems as Array<{ order_item_id?: unknown; quantity?: unknown }>) {
    if (
      typeof r?.order_item_id !== 'string' ||
      typeof r?.quantity !== 'number' ||
      !Number.isInteger(r.quantity) ||
      r.quantity < 1
    ) {
      return NextResponse.json({ error: 'Invalid items for this order.' }, { status: 400 });
    }
    wanted.push({ itemId: r.order_item_id, quantity: r.quantity });
  }
  if (new Set(wanted.map((w) => w.itemId)).size !== wanted.length) {
    return NextResponse.json({ error: 'The same item was selected twice.' }, { status: 400 });
  }

  const order = customer
    ? await getOrderForUser(customer.id, orderNumber.toUpperCase())
    : await getOrderByPhoneAndNumber((phone ?? '').replace(/\s/g, ''), orderNumber.toUpperCase());
  if (!order) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }

  const lines = order.order_items as OrderLine[];
  const history = (order.order_status_history ?? []) as HistoryRow[];
  const { returnWindowDays } = await getPolicySettings();
  const windowMs = returnWindowDays * 24 * 60 * 60 * 1000;

  for (const { itemId: id, quantity } of wanted) {
    const line = lines.find((l) => l.id === id);
    if (!line || quantity > line.quantity) {
      return NextResponse.json({ error: 'Invalid items for this order.' }, { status: 400 });
    }
    if (line.status !== 'delivered') {
      return NextResponse.json(
        { error: 'Returns can only be requested for delivered items.' },
        { status: 422 }
      );
    }
    const deliveredAt = history
      .filter((h) => h.order_item_id === id && h.new_status === 'delivered')
      .map((h) => new Date(h.created_at).getTime())
      .sort((a, b) => b - a)[0];
    const baseline = deliveredAt ?? new Date(order.updated_at).getTime();
    if (Date.now() - baseline > windowMs) {
      return NextResponse.json(
        { error: `The ${returnWindowDays}-day return window for an item has ended.` },
        { status: 422 }
      );
    }
  }

  const photos = parsePhotoPaths(body.photos, 'return', customer?.id ?? null);
  if (!photos) {
    return NextResponse.json(
      { error: 'Invalid photos. Please remove them and add them again.' },
      { status: 400 }
    );
  }

  try {
    const returnReq = await createReturnRequest({
      orderId: order.id,
      photos,
      reason: reason as 'damaged' | 'wrong_item' | 'changed_mind' | 'quality_issue' | 'other',
      description: (body.description as string | undefined)?.slice(0, 1000) || undefined,
      items: wanted,
    });
    return NextResponse.json({ returnRequest: returnReq }, { status: 201 });
  } catch (err) {
    if (err instanceof ReturnError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
