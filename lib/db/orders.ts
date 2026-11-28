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
// Orders are created ONLY by POST /api/checkout, through the create_order_with_stock()
// database function (one transaction: take the cart, create the order, reserve stock).
// Do not add another way to insert orders: it would skip stock reservation and the
// link to the customer's account.

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
        id, quantity, unit_price, item_total, snapshot, status,
        products(id, name, slug, product_media(url, alt_text))
      ),
      order_status_history(id, order_item_id, previous_status, new_status, notes, created_at)
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

const CUSTOMER_ORDER_SELECT = `
      id, order_number, customer_name, phone, email,
      address_line1, city, state, postal_code, country,
      notes, customization, payment_status, status,
      created_at, updated_at,
      order_items(
        id, quantity, unit_price, item_total, snapshot, status,
        products(id, name, slug, product_media(url, alt_text))
      ),
      order_status_history(id, order_item_id, previous_status, new_status, notes, created_at)
    `;

/** All orders placed by a signed-in customer, newest first. Caller must have verified the user. */
export async function listOrdersForUser(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('orders')
    .select(CUSTOMER_ORDER_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw new Error(`listOrdersForUser: ${error.message}`);
  return data ?? [];
}

/** One order by number, only if it belongs to this user. */
export async function getOrderForUser(userId: string, orderNumber: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('orders')
    .select(CUSTOMER_ORDER_SELECT)
    .eq('user_id', userId)
    .eq('order_number', orderNumber)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`getOrderForUser: ${error.message}`);
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
    .select('*, order_items(id, quantity, unit_price, item_total, snapshot, status)', {
      count: 'exact',
    })
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
        id, quantity, unit_price, item_total, snapshot, status,
        products(id, name, slug, sku, product_media(url, alt_text))
      ),
      order_status_history(id, order_item_id, previous_status, new_status, notes, actor_id, created_at)
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
// Status lives on each order line (order_items.status). The order's own status is
// derived from its lines inside the database (derive_order_status), so there is no
// function here that sets orders.status directly.

/**
 * Change the status of the given order lines in one transaction: history rows,
 * stock release on cancel, and the order's derived status. Returns lines changed.
 */
export async function updateItemStatuses({
  orderId,
  itemIds,
  newStatus,
  actorId,
  notes,
}: {
  orderId: string;
  itemIds: string[];
  newStatus: string;
  actorId: string | null;
  notes?: string;
}): Promise<number> {
  if (itemIds.length === 0) return 0;
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin.rpc as any)('apply_item_status', {
    p_order_id: orderId,
    p_item_ids: itemIds,
    p_new_status: newStatus,
    p_actor_id: actorId,
    p_notes: notes ?? null,
  });
  if (error) throw new Error(`updateItemStatuses: ${error.message}`);
  return (data as number) ?? 0;
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

export class ReturnError extends Error {}

const RETURN_ERRORS: Record<string, string> = {
  ITEM_NOT_RETURNABLE: 'Only delivered items can be returned.',
  ITEM_ALREADY_RETURNED: 'A return was already requested for one of these items.',
  ITEM_NOT_IN_ORDER: 'One of the items is not part of this order.',
  NO_ITEMS: 'At least one item is required.',
  INVALID_QUANTITY: 'Choose a quantity between 1 and the number you received.',
  ITEM_DUPLICATE: 'The same item was selected twice.',
  RETURN_NOT_FOUND: 'Return request not found.',
  RETURN_NOT_CANCELLABLE:
    'This return can no longer be cancelled because it has already been reviewed.',
  ORDER_NOT_FOUND: 'Order not found.',
};

/**
 * Creates a return for delivered order lines. A quantity smaller than the line splits
 * the line: the returned units become their own line, the rest stay as they were.
 */
export async function createReturnRequest({
  orderId,
  reason,
  description,
  items,
  photos = [],
}: {
  orderId: string;
  reason: 'damaged' | 'wrong_item' | 'changed_mind' | 'quality_issue' | 'other';
  description?: string;
  /** Storage paths of customer photos, already validated by the caller. */
  photos?: string[];
  items: Array<{ itemId: string; quantity: number }>;
}) {
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin.rpc as any)('create_return_request', {
    p_order_id: orderId,
    p_reason: reason,
    p_description: description ?? null,
    p_items: items.map((i) => ({ item_id: i.itemId, quantity: i.quantity })),
  });
  if (error) {
    const code = Object.keys(RETURN_ERRORS).find((c) => error.message.includes(c));
    if (code) throw new ReturnError(RETURN_ERRORS[code]);
    throw new Error(`createReturnRequest: ${error.message}`);
  }
  const id = data as string;
  if (photos.length > 0) {
    // The return exists already, so a failure here is logged and does not fail the request.
    const { error: photoError } = await admin
      .from('return_requests')
      .update({ photos })
      .eq('id', id);
    if (photoError) console.error('createReturnRequest: saving photos failed');
  }
  return { id };
}

/** Cancel a return that has not been reviewed yet. Its items go back to delivered. */
export async function cancelReturnRequest({
  orderId,
  returnId,
}: {
  orderId: string;
  returnId: string;
}) {
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.rpc as any)('cancel_return_request', {
    p_order_id: orderId,
    p_return_id: returnId,
  });
  if (error) {
    const code = Object.keys(RETURN_ERRORS).find((c) => error.message.includes(c));
    if (code) throw new ReturnError(RETURN_ERRORS[code]);
    throw new Error(`cancelReturnRequest: ${error.message}`);
  }
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

  // Move the returned lines (not the whole order) to the matching status.
  // A rejected return puts the lines back to delivered.
  const itemStatusMap: Record<string, string> = {
    approved: 'return_approved',
    rejected: 'delivered',
    in_transit: 'return_in_transit',
    completed: 'returned',
  };
  const { data: rows, error: itemsErr } = await admin
    .from('return_request_items')
    .select('order_item_id')
    .eq('return_request_id', returnId);
  if (itemsErr) throw new Error(`updateReturnStatus items: ${itemsErr.message}`);

  await updateItemStatuses({
    orderId: returnReq.order_id,
    itemIds: (rows ?? []).map((r) => r.order_item_id),
    newStatus: itemStatusMap[status],
    actorId,
    notes: adminNotes
      ? `Return ${status.replace('_', ' ')}: ${adminNotes}`
      : `Return ${status.replace('_', ' ')}`,
  });
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

  // Mark the refunded lines. A refund tied to a return covers that return's lines.
  // A full refund with no return covers every line still on the order.
  // A partial refund with no return changes no line (it is only recorded).
  let itemIds: string[] = [];
  if (returnRequestId) {
    const { data } = await admin
      .from('return_request_items')
      .select('order_item_id')
      .eq('return_request_id', returnRequestId);
    itemIds = (data ?? []).map((r) => r.order_item_id);
  } else if (refundType === 'full') {
    const { data } = await admin
      .from('order_items')
      .select('id')
      .eq('order_id', orderId)
      .neq('status', 'cancelled');
    itemIds = (data ?? []).map((r) => r.id);
  }
  await updateItemStatuses({
    orderId,
    itemIds,
    newStatus: processedAt ? 'refunded' : 'refund_processing',
    actorId,
    notes: notes ?? `Refund of ₹${amount} (${refundType})`,
  });

  return refund;
}
