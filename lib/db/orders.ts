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

// ─── Payment status ───────────────────────────────────────────────────────────

export async function updatePaymentStatus({
  orderId,
  paymentStatus,
  paymentNotes,
  actorId,
}: {
  orderId: string;
  paymentStatus: 'pending' | 'received' | 'failed';
  paymentNotes?: string;
  actorId: string;
}) {
  const admin = createAdminClient();
  const { error } = await admin
    .from('orders')
    .update({
      payment_status: paymentStatus,
      payment_notes: paymentNotes ?? null,
    })
    .eq('id', orderId);

  if (error) throw new Error(`updatePaymentStatus: ${error.message}`);

  await admin.from('audit_logs').insert({
    actor_id: actorId,
    action: 'order.payment_status',
    table_name: 'orders',
    record_id: orderId,
    diff: { payment_status: paymentStatus } as never,
  });
}

// ─── Return requests ──────────────────────────────────────────────────────────

export async function listReturnRequests({
  status,
  limit = 30,
  offset = 0,
}: {
  status?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const admin = createAdminClient();
  let query = admin
    .from('return_requests')
    .select(
      `*, orders(id, order_number, customer_name, phone),
       return_request_items(id, quantity, image_urls, order_items(id, snapshot))`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status as never);

  const { data, error, count } = await query;
  if (error) throw new Error(`listReturnRequests: ${error.message}`);
  return { returns: data ?? [], total: count ?? 0 };
}

export async function getReturnRequestById(id: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('return_requests')
    .select(
      `*, orders(*, order_items(id, quantity, unit_price, item_total, snapshot)),
       return_request_items(id, quantity, image_urls, order_items(id, snapshot))`
    )
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`getReturnRequestById: ${error.message}`);
  }
  return data;
}

export async function createReturnRequest({
  orderId,
  reason,
  description,
  items,
}: {
  orderId: string;
  reason: 'damaged' | 'wrong_item' | 'changed_mind' | 'quality_issue' | 'other';
  description?: string;
  items: Array<{ orderItemId: string; quantity: number; imageUrls?: string[] }>;
}) {
  const admin = createAdminClient();

  const { data: returnReq, error: reqError } = await admin
    .from('return_requests')
    .insert({ order_id: orderId, reason, description: description ?? null })
    .select()
    .single();

  if (reqError) throw new Error(`createReturnRequest: ${reqError.message}`);

  if (items.length > 0) {
    const { error: itemsError } = await admin.from('return_request_items').insert(
      items.map((i) => ({
        return_request_id: returnReq.id,
        order_item_id: i.orderItemId,
        quantity: i.quantity,
        image_urls: i.imageUrls ?? [],
      }))
    );
    if (itemsError) throw new Error(`createReturnRequest items: ${itemsError.message}`);
  }

  // Update order status
  await admin.from('orders').update({ status: 'return_requested' }).eq('id', orderId);

  return returnReq;
}

export async function updateReturnStatus({
  returnId,
  status,
  adminNotes,
  actorId,
}: {
  returnId: string;
  status: 'approved' | 'rejected' | 'in_transit' | 'completed';
  adminNotes?: string;
  actorId: string;
}) {
  const admin = createAdminClient();

  const { data: returnReq, error: fetchErr } = await admin
    .from('return_requests')
    .select('order_id')
    .eq('id', returnId)
    .single();

  if (fetchErr) throw new Error(`updateReturnStatus fetch: ${fetchErr.message}`);

  const { error } = await admin
    .from('return_requests')
    .update({ status, admin_notes: adminNotes ?? null })
    .eq('id', returnId);

  if (error) throw new Error(`updateReturnStatus: ${error.message}`);

  // Mirror to order status
  const orderStatusMap: Record<string, string> = {
    approved: 'return_approved',
    rejected: 'return_rejected',
    in_transit: 'return_in_transit',
    completed: 'returned',
  };

  if (orderStatusMap[status]) {
    await updateOrderStatus({
      orderId: returnReq.order_id,
      newStatus: orderStatusMap[status],
      actorId,
      notes: adminNotes,
    });
  }
}

// ─── Refunds ──────────────────────────────────────────────────────────────────

export async function listRefunds({ limit = 30, offset = 0 } = {}) {
  const admin = createAdminClient();
  const { data, error, count } = await admin
    .from('refunds')
    .select(
      `*, orders(id, order_number, customer_name, phone),
       refund_status_history(id, previous_status, new_status, notes, created_at)`,
      { count: 'exact' }
    )
    .order('processed_at', { ascending: false, nullsFirst: true })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(`listRefunds: ${error.message}`);
  return { refunds: data ?? [], total: count ?? 0 };
}

export async function createRefund({
  orderId,
  returnRequestId,
  amount,
  refundType,
  method,
  referenceId,
  processedAt,
  notes,
  actorId,
}: {
  orderId: string;
  returnRequestId?: string;
  amount: number;
  refundType: 'full' | 'partial';
  method: string;
  referenceId?: string;
  processedAt?: string;
  notes?: string;
  actorId: string;
}) {
  const admin = createAdminClient();

  const { data: refund, error } = await admin
    .from('refunds')
    .insert({
      order_id: orderId,
      return_request_id: returnRequestId ?? null,
      amount,
      refund_type: refundType,
      method,
      reference_id: referenceId ?? null,
      processed_at: processedAt ?? null,
      notes: notes ?? null,
      actor_id: actorId,
    })
    .select()
    .single();

  if (error) throw new Error(`createRefund: ${error.message}`);

  // Record initial status history
  await admin.from('refund_status_history').insert({
    refund_id: refund.id,
    new_status: processedAt ? 'processed' : 'pending',
    actor_id: actorId,
  });

  // Update order status
  const newOrderStatus = refundType === 'full' ? 'refunded' : 'partially_refunded';
  await updateOrderStatus({ orderId, newStatus: newOrderStatus, actorId, notes });

  return refund;
}
