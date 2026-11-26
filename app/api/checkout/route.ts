/**
 * POST /api/checkout
 *
 * Creates an order atomically:
 *   1. Validates all items still exist and prices match the DB
 *   2. Creates the order record + items
 *   3. Reserves stock (SELECT FOR UPDATE via RPC)
 *   4. Returns the order number for the confirmation page
 *
 * No auth required — orders are anonymous, identified by phone.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createOrder } from '@/lib/db/orders';
import { reserveStock } from '@/lib/db/inventory';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateOrderNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `BA-${date}-${rand}`;
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface CartItemPayload {
  productId: string;
  variantId: string | null;
  name: string;
  price: number; // client-side price — will be validated
  quantity: number;
  image: string | null;
  slug: string;
}

interface CheckoutBody {
  customerName: string;
  phone: string;
  email?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  notes?: string;
  customization?: string;
  items: CartItemPayload[];
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CheckoutBody;

  // ── Basic input validation ────────────────────────────────────────────────
  const name = body.customerName?.trim();
  const phone = body.phone?.trim();

  if (!name) return NextResponse.json({ error: 'Customer name is required.' }, { status: 400 });
  if (!phone) return NextResponse.json({ error: 'Phone number is required.' }, { status: 400 });
  if (!/^\+?[0-9]{10,15}$/.test(phone.replace(/\s/g, '')))
    return NextResponse.json({ error: 'Invalid phone number format.' }, { status: 400 });
  if (!body.items || body.items.length === 0)
    return NextResponse.json({ error: 'Your cart is empty.' }, { status: 400 });

  // ── Validate prices + availability against DB ─────────────────────────────
  const supabase = await createClient();

  const productIds = [...new Set(body.items.map((i) => i.productId))];
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('id, name, sku, price, availability_type, status, product_media(url, alt_text)')
    .in('id', productIds);

  if (prodError)
    return NextResponse.json({ error: 'Failed to validate products.' }, { status: 500 });

  const productMap = new Map((products ?? []).map((p) => [p.id, p]));

  // Build validated order items
  const validatedItems: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    unitPrice: number;
    snapshot: { name: string; sku: string | null; image_url: string | null };
  }> = [];

  const unavailable: string[] = [];

  for (const cartItem of body.items) {
    const product = productMap.get(cartItem.productId);
    if (!product) {
      unavailable.push(cartItem.name);
      continue;
    }
    if (product.status !== 'active') {
      unavailable.push(product.name);
      continue;
    }
    if (product.availability_type === 'out_of_stock') {
      unavailable.push(product.name);
      continue;
    }

    // Determine server-side unit price
    let unitPrice = product.price ?? 0;
    if (cartItem.variantId) {
      const { data: variant } = await supabase
        .from('product_variants')
        .select('price_modifier, status')
        .eq('id', cartItem.variantId)
        .eq('product_id', cartItem.productId)
        .single();

      if (!variant || variant.status === 'archived') {
        unavailable.push(`${product.name} (selected variant)`);
        continue;
      }
      unitPrice += variant.price_modifier;
    }

    const media =
      (product.product_media as Array<{ url: string; alt_text: string | null }> | null) ?? [];
    const thumb = media[0] ?? null;

    validatedItems.push({
      productId: cartItem.productId,
      variantId: cartItem.variantId ?? undefined,
      quantity: Math.max(1, Math.floor(cartItem.quantity)),
      unitPrice,
      snapshot: {
        name: product.name,
        sku: product.sku,
        image_url: thumb?.url ?? null,
      },
    });
  }

  if (unavailable.length > 0) {
    return NextResponse.json(
      {
        error: `Some items are no longer available: ${unavailable.join(', ')}. Please update your cart.`,
        unavailableItems: unavailable,
      },
      { status: 422 }
    );
  }

  // ── Create order ──────────────────────────────────────────────────────────
  const orderNumber = generateOrderNumber();

  let order: { id: string; order_number: string };
  try {
    order = await createOrder({
      orderNumber,
      customerName: name,
      phone: phone.replace(/\s/g, ''),
      email: body.email?.trim() || undefined,
      addressLine1: body.addressLine1?.trim() || undefined,
      addressLine2: body.addressLine2?.trim() || undefined,
      city: body.city?.trim() || undefined,
      state: body.state?.trim() || undefined,
      postalCode: body.postalCode?.trim() || undefined,
      notes: body.notes?.trim() || undefined,
      customization: body.customization?.trim() || undefined,
      items: validatedItems,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Failed to create order: ${msg}` }, { status: 500 });
  }

  // ── Reserve stock (atomic, FOR UPDATE) ───────────────────────────────────
  // Only attempt reservation for ready_to_ship products that have tracking enabled.
  // Made-to-order products are allowed regardless of stock level.
  const stockItems = validatedItems
    .map((item) => {
      const product = productMap.get(item.productId);
      if (!product || product.availability_type !== 'ready_to_ship') return null;
      return {
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        orderId: order.id,
      };
    })
    .filter(Boolean) as Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    orderId: string;
  }>;

  if (stockItems.length > 0) {
    try {
      await reserveStock(stockItems);
    } catch (err) {
      // Stock reservation failed — delete the order we just created to avoid orphans
      const { createAdminClient } = await import('@/lib/supabase/admin');
      const admin = createAdminClient();
      await admin.from('orders').delete().eq('id', order.id);

      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: `Stock no longer available: ${msg}` }, { status: 422 });
    }
  }

  return NextResponse.json({ orderNumber: order.order_number, orderId: order.id }, { status: 201 });
}
