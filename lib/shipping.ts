/**
 * lib/shipping.ts
 *
 * Per-state shipping lookup. The fee always comes from the `shipping_rates`
 * table on the server. Clients never send a fee.
 *
 * Matching: exact state name, then the '*' fallback row.
 * A rate is free when subtotal >= free_above.
 *
 * RULE: server-only. Do not import from a 'use client' file.
 */

import { createClient } from '@/lib/supabase/server';
import { SHIPPING_FALLBACK_STATE } from '@/lib/cart/constants';

export interface ShippingQuote {
  /** State the rate was looked up for, as supplied by the caller */
  state: string;
  /** Fee before any free-shipping rule */
  baseFee: number;
  /** Fee the customer pays for this subtotal */
  fee: number;
  freeAbove: number | null;
  isFree: boolean;
  /** True when the '*' fallback row was used */
  usedFallback: boolean;
}

export async function getShippingQuote(
  state: string,
  subtotal: number
): Promise<ShippingQuote | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('shipping_rates')
    .select('state, fee, free_above, is_active')
    .in('state', [state, SHIPPING_FALLBACK_STATE])
    .eq('is_active', true);

  if (error) throw new Error(`getShippingQuote: ${error.message}`);

  const exact = data?.find((r) => r.state === state);
  const row = exact ?? data?.find((r) => r.state === SHIPPING_FALLBACK_STATE);
  if (!row) return null;

  const freeAbove = row.free_above;
  const isFree = freeAbove != null && subtotal >= freeAbove;

  return {
    state,
    baseFee: row.fee,
    fee: isFree ? 0 : row.fee,
    freeAbove,
    isFree,
    usedFallback: !exact,
  };
}
