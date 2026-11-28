/**
 * GET    /api/cart?state=Kerala   → CartSnapshot for the signed-in customer's server cart
 * DELETE /api/cart                → empties the server cart
 *
 * Requires a signed-in customer.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireCustomerApi } from '@/lib/auth/customer';
import { parseState } from '@/lib/cart/schema';
import { clearCartRows, getOrCreateCartId, loadServerCart } from '@/lib/db/cart';
import { rateLimit } from '@/lib/api/rateLimit';

export async function GET(request: NextRequest) {
  const customer = await requireCustomerApi();
  if (customer instanceof NextResponse) return customer;

  if (!rateLimit(`cart-get:${customer.id}`, 120, 60_000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  try {
    const supabase = await createClient();
    const cartId = await getOrCreateCartId(supabase, customer.id);
    const snapshot = await loadServerCart(
      supabase,
      cartId,
      parseState(request.nextUrl.searchParams.get('state'))
    );
    return NextResponse.json(snapshot);
  } catch {
    return NextResponse.json({ error: 'Could not load your cart.' }, { status: 500 });
  }
}

export async function DELETE() {
  const customer = await requireCustomerApi();
  if (customer instanceof NextResponse) return customer;

  try {
    const supabase = await createClient();
    const cartId = await getOrCreateCartId(supabase, customer.id);
    await clearCartRows(supabase, cartId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Could not clear your cart.' }, { status: 500 });
  }
}
