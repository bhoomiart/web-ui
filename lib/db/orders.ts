/**
 * lib/db/orders.ts
 *
 * Server-side order query and mutation functions.
 *
 * RULE: Customers look up orders by phone + order_number only.
 *       Never expose an endpoint that returns an order by ID alone.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

// ─── Create ───────────────────────────────────────────────────────────────

export interface CreateOrderInput {
  orderNumber: string;
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
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    unitPrice: number;
    snapshot: { name: string; sku: string | null; image_url: string | null };
  }>;
}

export async function createOrder(input: CreateOrderInput) {
  const admin = createAdminClient();

  // Insert order
  const { data: order, error: orderError } = await admin
    .from('orders')
    .insert({
      order_number: input.orderNumber,
      customer_name: input.customerName,
      phone: input.phone,
      email: input.email ?? null,
      address_line1: input.addressLine1 ?? null,
      address_line2: input.addressLine2 ?? null,
      city: input.city ?? null,
      state: input.state ?? null,
      postal_code: input.postalCode ?? null,
      notes: input.notes ?? null,
      customization: input.customization ?? null,
    })
    .select()
    .single();

  if (orderError) throw new Error(`createOrder: ${orderError.message}`);

  // Insert order items
  const { error: itemsError } = await admin.from('order_items').insert(
    input.items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      variant_id: item.variantId ?? null,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      item_total: item.quantity * item.unitPrice,
      snapshot: item.snapshot,
    }))
  );

  if (itemsError) throw new Error(`createOrder items: ${itemsError.message}`);

  // Record initial status history
  await admin.from('order_status_history').insert({
    order_id: order.id,
    new_status: 'pending',
    notes: 'Order created',
  });

  return order;
}

// ─── Customer lookup (secure) ─────────────────────────────────────────────

export async function getOrderByPhoneAndNumber(phone: string, orderNumber: string) {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('orders')
    .select(
      `
      id, order_number, customer_name, phone, email,
      address_line1, city, state, postal_code, country,
      notes, customization, payment_status, status,
      created_at, updated_at,
      order_items(
        id, quantity, unit_price, item_total, snapshot,
        products(id, name, slug, product_media(url, alt_text))
      ),
      order_status_history(id, previous_status, new_status, notes, created_at)
    `
    )
    .eq('phone', phone)
    .eq('order_number', orderNumber)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`getOrderByPhoneAndNumber: ${error.message}`);
  }
  return data;
}

// ─── Admin queries ────────────────────────────────────────────────────────

export async function listOrders({
  status,
  limit = 20,
  offset = 0,
  search,
}: {
  status?: string;
  limit?: number;
  offset?: number;
  search?: string;
} = {}) {
  const admin = createAdminClient();
  let query = admin
    .from('orders')
    .select('*, order_items(id, quantity, unit_price, item_total, snapshot)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status as never);
  if (search?.trim()) {
    // Search by order number, name, or phone
    query = query.or(
      `order_number.ilike.%${search}%,customer_name.ilike.%${search}%,phone.ilike.%${search}%`
    );
  }

  const { data, error, count } = await query;
  if (error) throw new Error(`listOrders: ${error.message}`);
  return { orders: data ?? [], total: count ?? 0 };
}

export async function getOrderById(id: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('orders')
    .select(
      `
      *,
      order_items(
        id, quantity, unit_price, item_total, snapshot,
        products(id, name, slug, sku, product_media(url, alt_text))
      ),
      order_status_history(id, previous_status, new_status, notes, actor_id, created_at)
    `
    )
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`getOrderById: ${error.message}`);
  }
  return data;
}

// ─── Status update ────────────────────────────────────────────────────────

export async function updateOrderStatus({
  orderId,
  newStatus,
  actorId,
  notes,
}: {
  orderId: string;
  newStatus: string;
  actorId: string;
  notes?: string;
}) {
  const admin = createAdminClient();

  // Get current status first
  const { data: current, error: fetchError } = await admin
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .single();

  if (fetchError) throw new Error(`updateOrderStatus fetch: ${fetchError.message}`);

  // Update order
  const { error: updateError } = await admin
    .from('orders')
    .update({
      status: newStatus as
        | 'pending'
        | 'confirmed'
        | 'processing'
        | 'customization_in_progress'
        | 'ready_for_dispatch'
        | 'shipped'
        | 'delivered'
        | 'cancellation_requested'
        | 'cancelled'
        | 'return_requested'
        | 'return_approved'
        | 'return_rejected'
        | 'return_in_transit'
        | 'returned'
        | 'refund_requested'
        | 'refund_under_review'
        | 'refund_approved'
        | 'refund_processing'
        | 'partially_refunded'
        | 'refunded'
        | 'refund_rejected',
    })
    .eq('id', orderId);

  if (updateError) throw new Error(`updateOrderStatus update: ${updateError.message}`);

  // Record history
  await admin.from('order_status_history').insert({
    order_id: orderId,
    previous_status: current.status,
    new_status: newStatus,
    actor_id: actorId,
    notes: notes ?? null,
  });
}
