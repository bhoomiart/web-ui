/**
 * POST /api/returns
 *
 * Customer-facing: submit a return request.
 * No auth required — customer identifies by phone + order number.
 *
 * Body: {
 *   phone, order_number,
 *   reason, description?,
 *   items: [{ order_item_id, quantity }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrderByPhoneAndNumber, createReturnRequest } from '@/lib/db/orders';

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Record<string, unknown>;

  const phone = (body.phone as string | undefined)?.trim();
  const orderNumber = (body.order_number as string | undefined)?.trim();

  if (!phone || !orderNumber) {
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

  const items = body.items as Array<{ order_item_id: string; quantity: number }> | undefined;
  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'At least one item is required.' }, { status: 400 });
  }

  // Verify the order belongs to this customer
  const order = await getOrderByPhoneAndNumber(phone.replace(/\s/g, ''), orderNumber.toUpperCase());
  if (!order) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }

  // Only delivered orders can be returned
  if (order.status !== 'delivered') {
    return NextResponse.json(
      { error: 'Returns can only be requested for delivered orders.' },
      { status: 422 }
    );
  }

  try {
    const returnReq = await createReturnRequest({
      orderId: order.id,
      reason: reason as 'damaged' | 'wrong_item' | 'changed_mind' | 'quality_issue' | 'other',
      description: (body.description as string | undefined) || undefined,
      items: items.map((i) => ({
        orderItemId: i.order_item_id,
        quantity: i.quantity,
      })),
    });

    return NextResponse.json({ returnRequest: returnReq }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
