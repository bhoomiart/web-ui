/**
 * GET /api/my-orders
 *
 * Order history for the signed-in customer. No phone or order number needed:
 * the session decides whose orders are returned. Every line carries its own
 * status and return eligibility.
 */
import { NextResponse } from 'next/server';
import { requireCustomerApi } from '@/lib/auth/customer';
import { listOrdersForUser } from '@/lib/db/orders';
import { withReturnInfo } from '@/lib/orders/returns';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const customer = await requireCustomerApi();
  if (customer instanceof NextResponse) return customer;

  const { orders, returnWindowDays } = await withReturnInfo(await listOrdersForUser(customer.id));

  const reviewed = new Map<string, string[]>();
  const ids = orders.map((o) => o.id);
  if (ids.length > 0) {
    const { data } = await createAdminClient()
      .from('product_reviews')
      .select('order_id, product_id')
      .in('order_id', ids)
      .in('status', ['pending', 'approved']);
    for (const r of data ?? []) {
      if (!r.order_id) continue;
      reviewed.set(r.order_id, [...(reviewed.get(r.order_id) ?? []), r.product_id]);
    }
  }

  return NextResponse.json({
    orders: orders.map((o) => ({ ...o, reviewedProductIds: reviewed.get(o.id) ?? [] })),
    returnWindowDays,
  });
}
