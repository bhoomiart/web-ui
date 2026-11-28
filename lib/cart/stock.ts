/**
 * lib/cart/stock.ts
 *
 * Live availability per product for display (product page, listing cards).
 * Uses the same rules as validateCart:
 *   - out_of_stock                        -> 0
 *   - made_to_order                       -> not limited (null)
 *   - ready_to_ship, tracking on          -> inventory.available_stock (0 if no row)
 *   - ready_to_ship, tracking off         -> not limited (null)
 *
 * RULE: server-only. Do not import from a 'use client' file.
 */

import { createClient } from '@/lib/supabase/server';
import type { StockInfo } from './types';

const USABLE_VARIANT = new Set(['active', 'available']);

export async function getStockForProducts(
  productIds: string[]
): Promise<Record<string, StockInfo>> {
  const ids = [...new Set(productIds)];
  if (ids.length === 0) return {};

  const supabase = await createClient();
  const [products, variants, inventory] = await Promise.all([
    supabase.from('products').select('id, status, availability_type').in('id', ids),
    supabase.from('product_variants').select('id, product_id, status').in('product_id', ids),
    supabase
      .from('inventory')
      .select('product_id, variant_id, available_stock, tracking_enabled')
      .in('product_id', ids),
  ]);

  if (products.error) throw new Error(`getStockForProducts: ${products.error.message}`);
  if (variants.error) throw new Error(`getStockForProducts: ${variants.error.message}`);
  if (inventory.error) throw new Error(`getStockForProducts: ${inventory.error.message}`);

  const result: Record<string, StockInfo> = {};

  for (const p of products.data ?? []) {
    if (p.status !== 'active') continue;

    const limited = p.availability_type === 'ready_to_ship';
    const soldOut = p.availability_type === 'out_of_stock';
    const rows = (inventory.data ?? []).filter((i) => i.product_id === p.id);

    const qtyFor = (variantId: string | null): number | null => {
      if (soldOut) return 0;
      if (!limited) return null;
      const row = rows.find((r) => r.variant_id === variantId);
      if (!row) return 0;
      return row.tracking_enabled ? Math.max(0, row.available_stock ?? 0) : null;
    };

    const usable = (variants.data ?? []).filter(
      (v) => v.product_id === p.id && USABLE_VARIANT.has(v.status)
    );

    result[p.id] = {
      productId: p.id,
      availabilityType: p.availability_type,
      hasVariants: usable.length > 0,
      availableQty: qtyFor(null),
      variants: Object.fromEntries(usable.map((v) => [v.id, qtyFor(v.id)])),
    };
  }

  return result;
}
