/**
 * PUT /api/cart/items
 * Body: { productId, variantId, quantity, mode?: 'set' | 'add', state?: string }
 *
 *   mode 'set' (default): quantity is the new absolute quantity. 0 removes the line.
 *   mode 'add':           quantity is added to what is already in the cart.
 *
 * Stock is checked on every write. A quantity above stock is reduced to the
 * most available and the response carries a `notice`. A line that cannot be
 * bought at all (out of stock, unavailable) is refused with 409.
 *
 * Response: { snapshot, notice?: { type, message } }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireCustomerApi } from '@/lib/auth/customer';
import { isUuid, parseState } from '@/lib/cart/schema';
import { MAX_LINE_QTY } from '@/lib/cart/constants';
import { validateCart } from '@/lib/cart/validateCart';
import {
  deleteCartRowByLine,
  getOrCreateCartId,
  listCartRows,
  loadServerCart,
  upsertCartRows,
} from '@/lib/db/cart';
import { rateLimit } from '@/lib/api/rateLimit';

export async function PUT(request: NextRequest) {
  const customer = await requireCustomerApi();
  if (customer instanceof NextResponse) return customer;

  if (!rateLimit(`cart-write:${customer.id}`, 120, 60_000)) {
    return NextResponse.json({ error: 'Too many changes. Please slow down.' }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  if (!isUuid(body.productId)) {
    return NextResponse.json({ error: 'Invalid product.' }, { status: 400 });
  }
  if (body.variantId != null && !isUuid(body.variantId)) {
    return NextResponse.json({ error: 'Invalid variant.' }, { status: 400 });
  }
  const mode = body.mode === 'add' ? 'add' : 'set';
  const q = body.quantity;
  if (typeof q !== 'number' || !Number.isInteger(q) || q < 0 || q > MAX_LINE_QTY) {
    return NextResponse.json(
      { error: `Quantity must be a whole number from 0 to ${MAX_LINE_QTY}.` },
      { status: 400 }
    );
  }
  if (mode === 'add' && q < 1) {
    return NextResponse.json({ error: 'Quantity to add must be at least 1.' }, { status: 400 });
  }

  const productId = body.productId;
  const variantId = (body.variantId as string | null | undefined) ?? null;
  const state = parseState(body.state);

  try {
    const supabase = await createClient();
    const cartId = await getOrCreateCartId(supabase, customer.id);

    // Remove
    if (mode === 'set' && q === 0) {
      await deleteCartRowByLine(supabase, cartId, productId, variantId);
      return NextResponse.json({ snapshot: await loadServerCart(supabase, cartId, state) });
    }

    const rows = await listCartRows(supabase, cartId);
    const existing = rows.find((r) => r.product_id === productId && r.variant_id === variantId);
    const requested = Math.min(MAX_LINE_QTY, mode === 'add' ? (existing?.quantity ?? 0) + q : q);

    const [line] = await validateCart([{ productId, variantId, quantity: requested }], supabase);

    if (line.status === 'out_of_stock' || line.status === 'unavailable') {
      return NextResponse.json(
        {
          error: line.message ?? 'This item cannot be added.',
          code: line.status === 'out_of_stock' ? 'OUT_OF_STOCK' : 'UNAVAILABLE',
          snapshot: await loadServerCart(supabase, cartId, state),
        },
        { status: 409 }
      );
    }

    await upsertCartRows(supabase, cartId, [{ productId, variantId, quantity: line.quantity }]);

    const snapshot = await loadServerCart(supabase, cartId, state);

    let notice: { type: 'adjusted' | 'low_stock'; message: string } | undefined;
    if (line.status === 'adjusted') {
      notice = {
        type: 'adjusted',
        message:
          mode === 'add' && existing
            ? `Only ${line.availableQty} available in total. Your cart now has ${line.quantity}.`
            : `Only ${line.availableQty} available. Quantity set to ${line.quantity}.`,
      };
    } else if (line.status === 'low_stock' && line.message) {
      notice = { type: 'low_stock', message: line.message };
    }

    return NextResponse.json({ snapshot, notice });
  } catch {
    return NextResponse.json({ error: 'Could not update your cart.' }, { status: 500 });
  }
}
