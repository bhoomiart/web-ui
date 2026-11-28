/**
 * POST /api/returns/[id]/cancel
 *
 * Customer cancels their own return request while it is still pending (not yet
 * approved or rejected). The returned items go back to "delivered".
 *
 * Body: { order_number, phone? }   (signed-in customers do not need phone)
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  cancelReturnRequest,
  getOrderByPhoneAndNumber,
  getOrderForUser,
  ReturnError,
} from '@/lib/db/orders';
import { getCustomer } from '@/lib/auth/customer';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const phone = (body.phone as string | undefined)?.trim();
  const orderNumber = (body.order_number as string | undefined)?.trim();
  const customer = await getCustomer();
  if (!orderNumber || (!customer && !phone)) {
    return NextResponse.json({ error: 'phone and order_number are required.' }, { status: 400 });
  }

  // The order must belong to this customer. The database also checks that the
  // return belongs to that order.
  const order = customer
    ? await getOrderForUser(customer.id, orderNumber.toUpperCase())
    : await getOrderByPhoneAndNumber((phone ?? '').replace(/\s/g, ''), orderNumber.toUpperCase());
  if (!order) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }

  try {
    await cancelReturnRequest({ orderId: order.id, returnId: id });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof ReturnError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
