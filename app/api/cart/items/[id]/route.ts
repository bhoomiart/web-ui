/**
 * DELETE /api/cart/items/[id]?state=Kerala
 *
 * Removes one line (cart_items.id) from the signed-in customer's cart and
 * returns the updated CartSnapshot. Removing a line that is already gone is a
 * success, so two devices removing the same item do not error.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireCustomerApi } from '@/lib/auth/customer';
import { isUuid, parseState } from '@/lib/cart/schema';
import { deleteCartRowById, getOrCreateCartId, loadServerCart } from '@/lib/db/cart';

type Params = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, { params }: Params) {
  const customer = await requireCustomerApi();
  if (customer instanceof NextResponse) return customer;

  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: 'Invalid item.' }, { status: 400 });

  try {
    const supabase = await createClient();
    const cartId = await getOrCreateCartId(supabase, customer.id);
    await deleteCartRowById(supabase, cartId, id);
    const snapshot = await loadServerCart(
      supabase,
      cartId,
      parseState(request.nextUrl.searchParams.get('state'))
    );
    return NextResponse.json({ snapshot });
  } catch {
    return NextResponse.json({ error: 'Could not remove the item.' }, { status: 500 });
  }
}
