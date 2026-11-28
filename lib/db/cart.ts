/**
 * lib/db/cart.ts
 *
 * Server cart persistence (tables `carts`, `cart_items`).
 *
 * Every function takes the caller's Supabase client, which is the signed-in
 * user's SSR client. RLS limits it to that user's own cart, so even a bug here
 * cannot read or write another customer's cart.
 *
 * Quantities are stored, prices are not. Prices come from validateCart().
 *
 * RULE: server-only. Do not import from a 'use client' file.
 */

import type { createClient } from '@/lib/supabase/server';
import { validateCart } from '@/lib/cart/validateCart';
import { buildSnapshot } from '@/lib/cart/snapshot';
import { cartLineKey, type CartLineInput, type CartSnapshot } from '@/lib/cart/types';

type Client = Awaited<ReturnType<typeof createClient>>;

export interface CartRow {
  id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
}

export async function getOrCreateCartId(supabase: Client, userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('carts')
    .upsert({ user_id: userId }, { onConflict: 'user_id' })
    .select('id')
    .single();

  if (error || !data) throw new Error(`getOrCreateCartId: ${error?.message ?? 'no row'}`);
  return data.id;
}

export async function listCartRows(supabase: Client, cartId: string): Promise<CartRow[]> {
  const { data, error } = await supabase
    .from('cart_items')
    .select('id, product_id, variant_id, quantity')
    .eq('cart_id', cartId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`listCartRows: ${error.message}`);
  return data ?? [];
}

export async function upsertCartRows(
  supabase: Client,
  cartId: string,
  lines: CartLineInput[]
): Promise<void> {
  if (lines.length === 0) return;
  const { error } = await supabase.from('cart_items').upsert(
    lines.map((l) => ({
      cart_id: cartId,
      product_id: l.productId,
      variant_id: l.variantId,
      quantity: l.quantity,
    })),
    { onConflict: 'cart_id,product_id,variant_key' }
  );
  if (error) throw new Error(`upsertCartRows: ${error.message}`);
}

export async function deleteCartRowByLine(
  supabase: Client,
  cartId: string,
  productId: string,
  variantId: string | null
): Promise<void> {
  let q = supabase.from('cart_items').delete().eq('cart_id', cartId).eq('product_id', productId);
  q = variantId ? q.eq('variant_id', variantId) : q.is('variant_id', null);
  const { error } = await q;
  if (error) throw new Error(`deleteCartRowByLine: ${error.message}`);
}

export async function deleteCartRowById(
  supabase: Client,
  cartId: string,
  itemId: string
): Promise<void> {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('cart_id', cartId)
    .eq('id', itemId);
  if (error) throw new Error(`deleteCartRowById: ${error.message}`);
}

export async function clearCartRows(supabase: Client, cartId: string): Promise<void> {
  const { error } = await supabase.from('cart_items').delete().eq('cart_id', cartId);
  if (error) throw new Error(`clearCartRows: ${error.message}`);
}

/**
 * Loads the cart, validates it against live stock and prices, and builds the
 * snapshot. Quantities above stock are reduced and saved, so a cart never keeps
 * a quantity that cannot be bought. Out-of-stock and unavailable lines are kept
 * (and flagged) so the customer can see and remove them.
 */
export async function loadServerCart(
  supabase: Client,
  cartId: string,
  state: string | null
): Promise<CartSnapshot> {
  const rows = await listCartRows(supabase, cartId);

  const lines = await validateCart(
    rows.map((r) => ({
      productId: r.product_id,
      variantId: r.variant_id,
      quantity: r.quantity,
    })),
    supabase
  );

  const idByKey = new Map(rows.map((r) => [cartLineKey(r.product_id, r.variant_id), r.id]));
  for (const line of lines) line.itemId = idByKey.get(line.key);

  const clamped = lines.filter((l) => l.status === 'adjusted');
  if (clamped.length > 0) {
    await upsertCartRows(
      supabase,
      cartId,
      clamped.map((l) => ({
        productId: l.productId,
        variantId: l.variantId,
        quantity: l.quantity,
      }))
    );
  }

  return buildSnapshot(lines, state);
}
