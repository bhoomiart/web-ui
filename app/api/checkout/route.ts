/**
 * POST /api/checkout
 *
 * Places an order for the signed-in customer.
 *
 * The order is built from the customer's SERVER cart, never from lines sent by
 * the browser, so prices, quantities and totals cannot be tampered with, and a
 * double click cannot place the same cart twice.
 *
 * Steps:
 *   1. Require a signed-in customer with a confirmed email (401 otherwise).
 *   2. Validate the form (name, phone, delivery state).
 *   3. Load the server cart and re-check every line against live stock and prices.
 *   4. Compute shipping for the delivery state and the final total (lib/pricing).
 *   5. If the total differs from what the customer saw, stop and show the new one.
 *   6. create_order_with_stock(): one transaction that takes the cart, creates the
 *      order and items, and reserves stock under row locks.
 *
 * Body: { customerName, phone, email?, addressLine1?, addressLine2?, city?,
 *         state, postalCode?, notes?, customization?, expectedTotal? }
 *
 * Responses:
 *   201 { orderNumber, orderId, totals }
 *   400 invalid form or empty cart
 *   401 { code: 'AUTH_REQUIRED' }
 *   409 { code: 'CART_CHANGED' | 'STOCK_CHANGED' | 'TOTAL_CHANGED', error, ... }
 *   422 delivery not available
 *   429 too many attempts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireCustomerApi } from '@/lib/auth/customer';
import { rateLimit } from '@/lib/api/rateLimit';
import { validateCart } from '@/lib/cart/validateCart';
import { isPurchasable, type ValidatedLine } from '@/lib/cart/types';
import { getOrCreateCartId, listCartRows } from '@/lib/db/cart';
import { calcSubtotal, calcTotals } from '@/lib/pricing';
import { getShippingQuote } from '@/lib/shipping';
import { isIndiaState } from '@/lib/india-states';
import { parseAddress } from '@/lib/addresses';
import { parsePhotoPaths } from '@/lib/uploads';

interface CheckoutBody {
  customerName?: unknown;
  phone?: unknown;
  email?: unknown;
  addressLine1?: unknown;
  addressLine2?: unknown;
  city?: unknown;
  state?: unknown;
  postalCode?: unknown;
  notes?: unknown;
  customization?: unknown;
  customizationPhotos?: unknown;
  expectedTotal?: unknown;
  saveAddress?: unknown;
}

const str = (v: unknown, max: number): string =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

function fail(status: number, error: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error, ...extra }, { status });
}

/** Postgres exception detail arrives as a JSON string. */
function parseDetail(details: unknown): Record<string, unknown> {
  if (typeof details !== 'string') return {};
  try {
    return JSON.parse(details) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function POST(request: NextRequest) {
  // 1. Who is ordering
  const customer = await requireCustomerApi();
  if (customer instanceof NextResponse) return customer;

  if (!rateLimit(`checkout:${customer.id}`, 10, 60_000)) {
    return fail(429, 'Too many attempts. Please wait a minute and try again.');
  }

  let body: CheckoutBody;
  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    return fail(400, 'Invalid request.');
  }

  // 2. Form
  const name = str(body.customerName, 120);
  const phone = str(body.phone, 20).replace(/\s/g, '');
  const email = str(body.email, 254) || customer.email || '';
  const state = str(body.state, 60);

  if (!name) return fail(400, 'Full name is required.', { field: 'customerName' });
  if (!/^\+?[0-9]{10,15}$/.test(phone)) {
    return fail(400, 'Enter a valid phone number (10 to 15 digits).', { field: 'phone' });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return fail(400, 'Enter a valid email address.', { field: 'email' });
  }
  if (!state || !isIndiaState(state)) {
    return fail(400, 'Select the state we should deliver to.', { field: 'state' });
  }

  const photos = parsePhotoPaths(body.customizationPhotos, 'customization', customer.id);
  if (!photos) return fail(400, 'Invalid reference photos. Please remove them and add them again.');

  const addressCheck = parseAddress({
    full_name: name,
    phone,
    address_line1: body.addressLine1,
    address_line2: body.addressLine2,
    city: body.city,
    state,
    postal_code: body.postalCode,
  });
  if (!addressCheck.ok) {
    const map: Record<string, string> = {
      address_line1: 'addressLine1',
      postal_code: 'postalCode',
    };
    return fail(400, addressCheck.error, { field: map[addressCheck.field] ?? addressCheck.field });
  }

  try {
    // 3. Server cart, re-checked
    const supabase = await createClient();
    const cartId = await getOrCreateCartId(supabase, customer.id);
    const rows = await listCartRows(supabase, cartId);
    if (rows.length === 0) return fail(400, 'Your cart is empty.', { code: 'CART_EMPTY' });

    const lines: ValidatedLine[] = await validateCart(
      rows.map((r) => ({ productId: r.product_id, variantId: r.variant_id, quantity: r.quantity })),
      supabase
    );

    const problems = lines.filter((l) => !isPurchasable(l.status));
    if (problems.length > 0) {
      return fail(409, 'Some items in your cart changed. Please review your cart and try again.', {
        code: 'CART_CHANGED',
        problems: problems.map((l) => ({ name: l.name, status: l.status, message: l.message })),
      });
    }

    // 4. Shipping and total
    const subtotal = calcSubtotal(lines);
    const quote = await getShippingQuote(state, subtotal);
    if (!quote) return fail(422, "We can't deliver to that state yet.", { field: 'state' });

    const totals = calcTotals(lines, { state, fee: quote.baseFee, freeAbove: quote.freeAbove });

    // 5. Is this the total the customer agreed to?
    const expected = typeof body.expectedTotal === 'number' ? body.expectedTotal : null;
    if (expected != null && Math.abs(expected - totals.total) > 0.009) {
      return fail(
        409,
        'Prices or delivery charges changed. Please check your new total and place the order again.',
        { code: 'TOTAL_CHANGED', totals }
      );
    }

    // 6. One transaction: take the cart, create the order, reserve stock.
    const admin = createAdminClient();
    const { data, error } = await admin.rpc('create_order_with_stock', {
      p_order: {
        user_id: customer.id,
        customer_name: name,
        phone,
        email,
        address_line1: str(body.addressLine1, 200),
        address_line2: str(body.addressLine2, 200),
        city: str(body.city, 100),
        state,
        postal_code: str(body.postalCode, 12),
        notes: str(body.notes, 1000),
        customization: str(body.customization, 1000),
        subtotal: totals.subtotal,
        shipping_fee: totals.shippingFee ?? 0,
        discount_amount: totals.discount,
        total: totals.total,
      },
      p_items: lines.map((l) => ({
        product_id: l.productId,
        variant_id: l.variantId,
        quantity: l.quantity,
        unit_price: l.unitPrice,
        snapshot: {
          name: l.name,
          variant_name: l.variantName,
          sku: l.sku ?? null,
          image_url: l.image,
        },
      })),
      p_clear_cart_for: customer.id,
    });

    if (error) {
      const code = error.message;
      const detail = parseDetail(error.details);

      if (code === 'INSUFFICIENT_STOCK') {
        const line = lines.find(
          (l) =>
            l.productId === detail.product_id &&
            (l.variantId ?? null) === ((detail.variant_id as string | null | undefined) ?? null)
        );
        const left = typeof detail.available === 'number' ? detail.available : 0;
        return fail(
          409,
          left > 0
            ? `Only ${left} of "${line?.name ?? 'an item'}" ${left === 1 ? 'is' : 'are'} left. Please update your cart.`
            : `"${line?.name ?? 'An item'}" just sold out. Please update your cart.`,
          { code: 'STOCK_CHANGED' }
        );
      }
      if (code === 'PRODUCT_UNAVAILABLE' || code === 'NO_INVENTORY') {
        return fail(409, 'An item in your cart is no longer available. Please update your cart.', {
          code: 'STOCK_CHANGED',
        });
      }
      if (code === 'CART_CHANGED') {
        return fail(
          409,
          'Your cart changed in another window or device. Please review it and try again.',
          { code: 'CART_CHANGED' }
        );
      }

      // Anything else is a bug or an outage. Log the code only, never customer data.
      console.error('checkout: create_order_with_stock failed', { code });
      return fail(500, 'We could not place your order. Please try again.');
    }

    const result = data as { order_id: string; order_number: string } | null;
    if (!result) return fail(500, 'We could not place your order. Please try again.');

    // Attach the reference photos. The order already exists, so a failure here is logged, not fatal.
    if (photos.length > 0) {
      const { error: photoError } = await admin
        .from('orders')
        .update({ customization_photos: photos })
        .eq('id', result.order_id)
        .eq('user_id', customer.id);
      if (photoError) console.error('checkout: saving customization photos failed');
    }

    // Remember name and phone for next time. Best effort, never blocks the order.
    try {
      await admin
        .from('profiles')
        .update({ full_name: name })
        .eq('id', customer.id)
        .is('full_name', null);
      await admin.from('profiles').update({ phone }).eq('id', customer.id).is('phone', null);
    } catch {
      /* non-critical */
    }

    // Save the delivery address to the customer's address book if they asked.
    // Best effort and never blocks the order. Skipped when incomplete or already saved.
    if (body.saveAddress === true) {
      try {
        const parsed = parseAddress({
          full_name: name,
          phone,
          address_line1: body.addressLine1,
          address_line2: body.addressLine2,
          city: body.city,
          state,
          postal_code: body.postalCode,
        });
        if (parsed.ok) {
          const v = parsed.value;
          const { data: dupe } = await admin
            .from('customer_addresses')
            .select('id')
            .eq('user_id', customer.id)
            .eq('address_line1', v.address_line1)
            .eq('postal_code', v.postal_code)
            .eq('full_name', v.full_name)
            .limit(1)
            .maybeSingle();
          if (!dupe) await admin.from('customer_addresses').insert({ ...v, user_id: customer.id });
        }
      } catch {
        /* non-critical (for example the 10-address limit) */
      }
    }

    return NextResponse.json(
      { orderNumber: result.order_number, orderId: result.order_id, totals },
      { status: 201 }
    );
  } catch (err) {
    console.error('checkout: unexpected failure', err instanceof Error ? err.message : 'unknown');
    return fail(500, 'We could not place your order. Please try again.');
  }
}
