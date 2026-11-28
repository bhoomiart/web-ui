/**
 * GET /api/track?phone=...&order=...
 *
 * Public order lookup. Returns order data only when both
 * phone AND order_number match — no ID-based lookup.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrderByPhoneAndNumber } from '@/lib/db/orders';
import { createAdminClient } from '@/lib/supabase/admin';
import { withReturnInfo } from '@/lib/orders/returns';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone')?.trim();
  const orderNumber = searchParams.get('order')?.trim();

  if (!phone || !orderNumber) {
    return NextResponse.json(
      { error: 'phone and order parameters are required.' },
      { status: 400 }
    );
  }

  const found = await getOrderByPhoneAndNumber(phone.replace(/\s/g, ''), orderNumber.toUpperCase());

  if (!found) {
    return NextResponse.json({ error: 'No order found with those details.' }, { status: 404 });
  }

  const {
    orders: [order],
  } = await withReturnInfo([found]);

  // Which products in this order already have a (pending/approved) review
  let reviewedProductIds: string[] = [];
  if (order.order_items.some((i) => i.status === 'delivered')) {
    const admin = createAdminClient();
    const { data } = await admin
      .from('product_reviews')
      .select('product_id')
      .eq('order_id', order.id)
      .in('status', ['pending', 'approved']);
    reviewedProductIds = (data ?? []).map((r) => r.product_id);
  }

  return NextResponse.json({ order, reviewedProductIds });
}
