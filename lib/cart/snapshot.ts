/**
 * lib/cart/snapshot.ts
 *
 * Turns validated lines into the CartSnapshot every cart endpoint returns:
 * lines + totals (with per-state shipping) + readiness flags.
 *
 * RULE: server-only. Do not import from a 'use client' file.
 */

import { calcSubtotal, calcTotals } from '@/lib/pricing';
import { getShippingQuote } from '@/lib/shipping';
import { countsTowardTotal, isPurchasable, type CartSnapshot, type ValidatedLine } from './types';

export async function buildSnapshot(
  lines: ValidatedLine[],
  state: string | null
): Promise<CartSnapshot> {
  let shipping = null;
  if (state) {
    const quote = await getShippingQuote(state, calcSubtotal(lines));
    if (quote) shipping = { state, fee: quote.baseFee, freeAbove: quote.freeAbove };
  }

  return {
    lines,
    totals: calcTotals(lines, shipping),
    itemCount: lines.reduce((n, l) => (countsTowardTotal(l.status) ? n + l.quantity : n), 0),
    checkoutReady: lines.length > 0 && lines.every((l) => isPurchasable(l.status)),
  };
}
