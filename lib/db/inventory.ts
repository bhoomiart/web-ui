/**
 * lib/db/inventory.ts
 *
 * Server-side inventory query and mutation functions.
 *
 * CRITICAL: stock is reserved only by create_order_with_stock() (SELECT FOR UPDATE
 * inside one transaction). Never bypass this with plain UPDATEs.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

// ─── Read ──────────────────────────────────────────────────────────────────

export async function getInventory(productId: string, variantId?: string) {
  const supabase = await createClient();
  let query = supabase.from('inventory').select('*').eq('product_id', productId);

  if (variantId) {
    query = query.eq('variant_id', variantId);
  } else {
    query = query.is('variant_id', null);
  }

  const { data, error } = await query.single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`getInventory: ${error.message}`);
  }
  return data;
}

export async function getInventoryWithProduct() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('inventory')
    .select('*, products(id, name, slug, status, availability_type)')
    .order('available_stock', { ascending: true });

  if (error) throw new Error(`getInventoryWithProduct: ${error.message}`);
  return data ?? [];
}

// ─── Stock reservation ─────────────────────────────────────────────────────
// Reservation happens inside create_order_with_stock() (migration 023), in the same
// transaction as the order, under row locks. There is intentionally no separate
// reserve function here: reserving outside that transaction is how stock is oversold.

// ─── Manual stock adjustment ───────────────────────────────────────────────

export async function adjustStock({
  inventoryId,
  changeQty,
  changeType,
  reason,
  actorId,
}: {
  inventoryId: string;
  changeQty: number; // positive = add, negative = remove
  changeType: string;
  reason: string;
  actorId: string;
}) {
  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.rpc as any)('adjust_stock_manual', {
    p_inventory_id: inventoryId,
    p_change_qty: changeQty,
    p_change_type: changeType,
    p_reason: reason,
    p_actor_id: actorId,
  });

  if (error) throw new Error(`adjustStock: ${error.message}`);
}

// ─── Inventory movements history ──────────────────────────────────────────

export async function listInventoryMovements(inventoryId?: string, limit = 50) {
  const supabase = await createClient();
  let query = supabase
    .from('inventory_movements')
    .select('*, inventory(product_id, products(name, slug))')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (inventoryId) query = query.eq('inventory_id', inventoryId);

  const { data, error } = await query;
  if (error) throw new Error(`listInventoryMovements: ${error.message}`);
  return data ?? [];
}
