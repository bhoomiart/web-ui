/**
 * lib/cart/validateCart.ts
 *
 * The single place that decides what a cart line is worth and whether it can
 * be bought. Used by:
 *   - POST /api/cart/validate  (guest and signed-in)
 *   - the server cart API      (GET / PUT / merge)
 *   - POST /api/checkout       (final authority, before stock is reserved)
 *
 * Reads run through the caller's Supabase client, so RLS applies: archived or
 * draft products are invisible and are reported as 'unavailable'.
 *
 * Stock is advisory here. The authoritative check is the row-locked reservation
 * inside create_order_with_stock().
 *
 * RULE: server-only. Do not import from a 'use client' file.
 */

import { createClient } from '@/lib/supabase/server';
import { LOW_STOCK_DISPLAY_THRESHOLD, MAX_LINE_QTY } from './constants';
import { cartLineKey, type CartLineInput, type LineStatus, type ValidatedLine } from './types';

type Client = Awaited<ReturnType<typeof createClient>>;

const USABLE_VARIANT = new Set(['active', 'available']);

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function blankLine(input: CartLineInput, status: LineStatus, message: string): ValidatedLine {
  return {
    key: cartLineKey(input.productId, input.variantId),
    productId: input.productId,
    variantId: input.variantId,
    name: 'Unavailable item',
    variantName: null,
    slug: '',
    image: null,
    availabilityType: 'unknown',
    unitPrice: null,
    requestedQty: input.quantity,
    quantity: input.quantity,
    availableQty: 0,
    maxQty: 0,
    status,
    message,
    lineTotal: 0,
  };
}

export async function validateCart(
  inputs: CartLineInput[],
  client?: Client
): Promise<ValidatedLine[]> {
  if (inputs.length === 0) return [];

  const supabase = client ?? (await createClient());

  const productIds = [...new Set(inputs.map((i) => i.productId))];

  // Three batched reads regardless of cart size.
  const [productsRes, variantsRes, inventoryRes] = await Promise.all([
    supabase
      .from('products')
      .select(
        'id, name, slug, sku, price, status, availability_type, product_media(url, display_order)'
      )
      .in('id', productIds),
    supabase
      .from('product_variants')
      .select('id, product_id, name, price_modifier, status')
      .in('product_id', productIds),
    supabase
      .from('inventory')
      .select('product_id, variant_id, available_stock, tracking_enabled')
      .in('product_id', productIds),
  ]);

  if (productsRes.error) throw new Error(`validateCart products: ${productsRes.error.message}`);
  if (variantsRes.error) throw new Error(`validateCart variants: ${variantsRes.error.message}`);
  if (inventoryRes.error) throw new Error(`validateCart inventory: ${inventoryRes.error.message}`);

  const products = new Map((productsRes.data ?? []).map((p) => [p.id, p]));
  const variantsByProduct = new Map<string, NonNullable<typeof variantsRes.data>>();
  for (const v of variantsRes.data ?? []) {
    const list = variantsByProduct.get(v.product_id) ?? [];
    list.push(v);
    variantsByProduct.set(v.product_id, list);
  }
  const inventory = new Map(
    (inventoryRes.data ?? []).map((i) => [cartLineKey(i.product_id, i.variant_id), i])
  );

  return inputs.map((input): ValidatedLine => {
    const product = products.get(input.productId);

    if (!product || product.status !== 'active') {
      return blankLine(input, 'unavailable', 'This item is no longer available.');
    }

    const media = [...(product.product_media ?? [])].sort(
      (a, b) => a.display_order - b.display_order
    );
    const base = {
      key: cartLineKey(input.productId, input.variantId),
      productId: input.productId,
      variantId: input.variantId,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      image: media[0]?.url ?? null,
      availabilityType: product.availability_type,
      requestedQty: input.quantity,
    };

    if (product.price == null) {
      return {
        ...base,
        variantName: null,
        unitPrice: null,
        quantity: input.quantity,
        availableQty: 0,
        maxQty: 0,
        status: 'unavailable',
        message: 'This item has no price yet.',
        lineTotal: 0,
      };
    }

    // ── Variant ────────────────────────────────────────────────────────────
    const variants = variantsByProduct.get(product.id) ?? [];
    const usableVariants = variants.filter((v) => USABLE_VARIANT.has(v.status));
    let variantName: string | null = null;
    let unitPrice = product.price;

    if (input.variantId) {
      const variant = variants.find((v) => v.id === input.variantId);
      if (!variant || !USABLE_VARIANT.has(variant.status)) {
        return {
          ...base,
          variantName: null,
          unitPrice: null,
          quantity: input.quantity,
          availableQty: 0,
          maxQty: 0,
          status: 'unavailable',
          message: 'The selected option is no longer available.',
          lineTotal: 0,
        };
      }
      variantName = variant.name;
      unitPrice += variant.price_modifier;
    } else if (usableVariants.length > 0) {
      return {
        ...base,
        variantName: null,
        unitPrice: null,
        quantity: input.quantity,
        availableQty: 0,
        maxQty: 0,
        status: 'unavailable',
        message: 'Please choose an option for this item.',
        lineTotal: 0,
      };
    }
    unitPrice = round2(unitPrice);

    const priced = { ...base, variantName, unitPrice };

    // ── Availability ───────────────────────────────────────────────────────
    if (product.availability_type === 'out_of_stock') {
      return {
        ...priced,
        quantity: input.quantity,
        availableQty: 0,
        maxQty: 0,
        status: 'out_of_stock',
        message: 'Out of stock',
        lineTotal: 0,
      };
    }

    // Made-to-order is never stock-limited.
    const stockLimited = product.availability_type === 'ready_to_ship';
    const inv = inventory.get(cartLineKey(input.productId, input.variantId));

    // A ready-to-ship product with no inventory row cannot be fulfilled
    // (the order function raises NO_INVENTORY for it too).
    if (stockLimited && !inv) {
      return {
        ...priced,
        quantity: input.quantity,
        availableQty: 0,
        maxQty: 0,
        status: 'out_of_stock',
        message: 'Out of stock',
        lineTotal: 0,
      };
    }

    const tracked = stockLimited && inv != null && inv.tracking_enabled;
    const available = tracked ? Math.max(0, inv.available_stock ?? 0) : null;
    const maxQty = available == null ? MAX_LINE_QTY : Math.min(available, MAX_LINE_QTY);

    if (available === 0) {
      return {
        ...priced,
        quantity: input.quantity,
        availableQty: 0,
        maxQty: 0,
        status: 'out_of_stock',
        message: 'Out of stock',
        lineTotal: 0,
      };
    }

    if (available != null && input.quantity > available) {
      return {
        ...priced,
        quantity: available,
        availableQty: available,
        maxQty,
        status: 'adjusted',
        message: `Only ${available} available. Quantity changed from ${input.quantity} to ${available}.`,
        lineTotal: round2(unitPrice * available),
      };
    }

    const low = available != null && available < LOW_STOCK_DISPLAY_THRESHOLD;
    return {
      ...priced,
      quantity: input.quantity,
      availableQty: available,
      maxQty,
      status: low ? 'low_stock' : 'ok',
      message: low ? `Only ${available} left in stock` : null,
      lineTotal: round2(unitPrice * input.quantity),
    };
  });
}
