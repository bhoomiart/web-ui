/**
 * lib/db/restock.ts
 *
 * Server-side query and mutation functions for restock subscriptions
 * and notification history.
 *
 * Uses createAdminClient() for all writes (bypasses RLS safely from server).
 * Uses createClient() for reads that benefit from RLS (staff sessions).
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SubscriptionStatus = 'active' | 'notified' | 'unsubscribed';
export type NotificationStatus = 'pending' | 'sent' | 'failed';
export type NotificationChannel = 'whatsapp' | 'email' | 'both';

export interface RestockSubscriptionRow {
  id: string;
  product_id: string;
  variant_id: string | null;
  phone: string | null;
  email: string | null;
  channel: NotificationChannel;
  status: SubscriptionStatus;
  subscribed_at: string;
  products: { id: string; name: string; slug: string; availability_type: string } | null;
}

export interface NotificationHistoryRow {
  id: string;
  subscription_id: string;
  inventory_id: string;
  attempt_at: string;
  status: NotificationStatus;
  provider_response: string | null;
  restock_subscriptions: {
    id: string;
    phone: string | null;
    email: string | null;
    channel: NotificationChannel;
    products: { id: string; name: string; slug: string } | null;
  } | null;
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function listRestockSubscriptions({
  status,
  productId,
  limit = 50,
  offset = 0,
}: {
  status?: SubscriptionStatus;
  productId?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const supabase = await createClient();

  let query = supabase
    .from('restock_subscriptions')
    .select('*, products(id, name, slug, availability_type)', { count: 'exact' })
    .order('subscribed_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);
  if (productId) query = query.eq('product_id', productId);

  const { data, error, count } = await query;
  if (error) throw new Error(`listRestockSubscriptions: ${error.message}`);
  return { subscriptions: (data ?? []) as RestockSubscriptionRow[], total: count ?? 0 };
}

export async function countActiveSubscribersPerProduct() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('restock_subscriptions')
    .select('product_id')
    .eq('status', 'active');

  if (error) throw new Error(`countActiveSubscribersPerProduct: ${error.message}`);

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.product_id] = (counts[row.product_id] ?? 0) + 1;
  }
  return counts;
}

export async function listPendingNotifications() {
  // "Pending" means: active subscribers for products that are out of stock
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('restock_subscriptions')
    .select('*, products(id, name, slug, availability_type)')
    .eq('status', 'active')
    .order('subscribed_at', { ascending: true });

  if (error) throw new Error(`listPendingNotifications: ${error.message}`);

  // Filter to those whose product is out_of_stock
  const pending = ((data ?? []) as RestockSubscriptionRow[]).filter(
    (s) => s.products?.availability_type === 'out_of_stock'
  );
  return pending;
}

export async function listNotificationHistory({
  limit = 50,
  offset = 0,
}: {
  limit?: number;
  offset?: number;
} = {}) {
  const supabase = await createClient();
  const { data, error, count } = await supabase
    .from('restock_notification_history')
    .select(
      'id, subscription_id, inventory_id, attempt_at, status, provider_response, restock_subscriptions(id, phone, email, channel, products(id, name, slug))',
      { count: 'exact' }
    )
    .order('attempt_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(`listNotificationHistory: ${error.message}`);
  return { history: (data ?? []) as NotificationHistoryRow[], total: count ?? 0 };
}

// ─── Write ────────────────────────────────────────────────────────────────────

export async function updateSubscriptionStatus(id: string, status: SubscriptionStatus) {
  const admin = createAdminClient();
  const { error } = await admin.from('restock_subscriptions').update({ status }).eq('id', id);

  if (error) throw new Error(`updateSubscriptionStatus: ${error.message}`);
}

export async function markNotificationSent(subscriptionId: string, inventoryId: string) {
  const admin = createAdminClient();

  // Insert history record
  const { error: histError } = await admin.from('restock_notification_history').insert({
    subscription_id: subscriptionId,
    inventory_id: inventoryId,
    status: 'sent',
    provider_response: 'WhatsApp Click-to-Chat opened by admin',
  });

  if (histError) throw new Error(`markNotificationSent (history): ${histError.message}`);

  // Mark subscription as notified
  const { error: subError } = await admin
    .from('restock_subscriptions')
    .update({ status: 'notified' })
    .eq('id', subscriptionId);

  if (subError) throw new Error(`markNotificationSent (subscription): ${subError.message}`);
}

// ─── Customer-facing subscribe / unsubscribe ───────────────────────────────────

export async function subscribeToRestock({
  productId,
  variantId,
  phone,
  email,
  channel,
}: {
  productId: string;
  variantId?: string;
  phone?: string;
  email?: string;
  channel: NotificationChannel;
}) {
  if (!phone && !email) throw new Error('At least one of phone or email is required.');

  const admin = createAdminClient();

  const { data, error } = await admin
    .from('restock_subscriptions')
    .upsert(
      {
        product_id: productId,
        variant_id: variantId ?? null,
        phone: phone ?? null,
        email: email ?? null,
        channel,
        status: 'active',
      },
      {
        onConflict: 'product_id,variant_id,phone,email,channel',
        ignoreDuplicates: false,
      }
    )
    .select()
    .single();

  if (error) throw new Error(`subscribeToRestock: ${error.message}`);
  return data;
}

export async function unsubscribeFromRestock(id: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from('restock_subscriptions')
    .update({ status: 'unsubscribed' })
    .eq('id', id);

  if (error) throw new Error(`unsubscribeFromRestock: ${error.message}`);
}
