/**
 * POST /api/cart/validate
 * Body: { items: [{ productId, variantId, quantity }], state?: string }
 *
 * Validates a cart against live stock and prices and returns a CartSnapshot.
 * Works for guests and signed-in users. Writes nothing.
 * Client-supplied prices, names and images are ignored.
 */

import { NextRequest, NextResponse } from 'next/server';
import { parseLines, parseState } from '@/lib/cart/schema';
import { validateCart } from '@/lib/cart/validateCart';
import { buildSnapshot } from '@/lib/cart/snapshot';
import { clientIp, rateLimit } from '@/lib/api/rateLimit';

export async function POST(request: NextRequest) {
  if (!rateLimit(`cart-validate:${clientIp(request)}`, 60, 60_000)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment.' },
      { status: 429 }
    );
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
    const lines = await validateCart(parsed.value);
    const snapshot = await buildSnapshot(lines, parseState(body.state));
    return NextResponse.json(snapshot);
  } catch {
    return NextResponse.json(
      { error: 'Could not check your cart. Please try again.' },
      { status: 500 }
    );
  }
}
