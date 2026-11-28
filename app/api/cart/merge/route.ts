/**
 * POST /api/cart/merge
 * Body: { items: [{ productId, variantId, quantity }], state?: string }
 *
 * Called once right after login with the guest (localStorage) cart.
 * For each guest line: quantity = server quantity + guest quantity, capped to
 * live stock. Lines that cannot be bought are skipped and reported.
 *
 * Response: { snapshot, report: MergeReport }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireCustomerApi } from '@/lib/auth/customer';
import { parseLines, parseState } from '@/lib/cart/schema';
import { MAX_LINE_QTY } from '@/lib/cart/constants';
import { validateCart } from '@/lib/cart/validateCart';
import { cartLineKey, isPurchasable, type MergeReport } from '@/lib/cart/types';
import { getOrCreateCartId, listCartRows, loadServerCart, upsertCartRows } from '@/lib/db/cart';
import { rateLimit } from '@/lib/api/rateLimit';

export async function POST(request: NextRequest) {
  const customer = await requireCustomerApi();
  if (customer instanceof NextResponse) return customer;

  if (!rateLimit(`cart-merge:${customer.id}`, 20, 60_000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  let body: { items?: unknown; state?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const parsed = parseLines(body.items);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const supabase = await createClient();
    const cartId = await getOrCreateCartId(supabase, customer.id);
    const existing = new Map(
      (await listCartRows(supabase, cartId)).map((r) => [
        cartLineKey(r.product_id, r.variant_id),
        r.quantity,
      ])
    );

    const combined = parsed.value.map((g) => ({
      ...g,
      quantity: Math.min(
        MAX_LINE_QTY,
        g.quantity + (existing.get(cartLineKey(g.productId, g.variantId)) ?? 0)
      ),
    }));

    const checked = await validateCart(combined, supabase);

    const report: MergeReport = { added: 0, trimmed: [], skipped: [] };
    const toWrite = [];

    for (let i = 0; i < checked.length; i++) {
      const line = checked[i];
      const wanted = combined[i].quantity;

      if (isPurchasable(line.status) || line.status === 'adjusted') {
        toWrite.push({
          productId: line.productId,
          variantId: line.variantId,
          quantity: line.quantity,
        });
        report.added += 1;
        if (line.status === 'adjusted') {
          report.trimmed.push({ name: line.name, requested: wanted, kept: line.quantity });
        }
      } else {
        report.skipped.push({
          name: line.name,
          reason: line.message ?? 'No longer available',
        });
      }
    }

    await upsertCartRows(supabase, cartId, toWrite);

    const snapshot = await loadServerCart(supabase, cartId, parseState(body.state));
    return NextResponse.json({ snapshot, report });
  } catch {
    return NextResponse.json({ error: 'Could not merge your cart.' }, { status: 500 });
  }
}
