/**
 * lib/pricing.ts
 *
 * The one place totals are computed. The cart API, the checkout summary and
 * POST /api/checkout all call calcTotals(), so the number the customer sees is
 * the number that is charged.
 *
 * Pure functions, no I/O. Safe to import from client code for display, but the
 * server result is the only one that counts.
 */

import type { CartTotals, ValidatedLine } from '@/lib/cart/types';
import { countsTowardTotal } from '@/lib/cart/types';

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export interface ShippingInput {
  state: string;
  fee: number;
  freeAbove: number | null;
}

/** Sum of lines that have a quantity and price. Unavailable and out-of-stock lines count for nothing. */
export function calcSubtotal(lines: ValidatedLine[]): number {
  return round2(
    lines.reduce(
      (sum, l) => (countsTowardTotal(l.status) ? sum + (l.unitPrice ?? 0) * l.quantity : sum),
      0
    )
  );
}

/**
 * @param shipping null when no delivery state is known yet. The total then
 *                 excludes shipping and shippingPending is true.
 * @param discount zero until a discount engine exists. The field is carried
 *                 through so orders already store it.
 */
export function calcTotals(
  lines: ValidatedLine[],
  shipping: ShippingInput | null,
  discount = 0
): CartTotals {
  const subtotal = calcSubtotal(lines);
  const safeDiscount = Math.min(Math.max(0, round2(discount)), subtotal);

  if (!shipping) {
    return {
      subtotal,
      shippingFee: null,
      discount: safeDiscount,
      total: round2(subtotal - safeDiscount),
      shippingPending: true,
      freeShippingRemaining: null,
      shippingState: null,
    };
  }

  const free = shipping.freeAbove != null && subtotal >= shipping.freeAbove;
  const fee = subtotal === 0 || free ? 0 : round2(shipping.fee);

  return {
    subtotal,
    shippingFee: fee,
    discount: safeDiscount,
    total: round2(subtotal - safeDiscount + fee),
    shippingPending: false,
    freeShippingRemaining:
      shipping.freeAbove != null && !free && subtotal > 0
        ? round2(shipping.freeAbove - subtotal)
        : null,
    shippingState: shipping.state,
  };
}
