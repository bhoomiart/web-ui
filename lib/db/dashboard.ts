/**
 * lib/db/dashboard.ts
 *
 * Dashboard metrics queries. Uses admin client since
 * the admin dashboard reads data across all RLS boundaries.
 */

import { createAdminClient } from '@/lib/supabase/admin';

export interface DashboardMetrics {
  products: {
    total: number;
    active: number;
    draft: number;
    archived: number;
  };
  categories: {
    total: number;
  };
  orders: {
    total: number;
    pending: number;
    confirmed: number;
    delivered: number;
    cancelled: number;
    cancellationRequested: number;
    returnRequested: number;
    refundPending: number;
  };
  inventory: {
    outOfStock: number;
    lowStock: number;
  };
  restock: {
    activeSubscribers: number;
    pendingNotifications: number;
  };
  reviews: {
    pending: number;
    approved: number;
  };
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const admin = createAdminClient();

  // Run all counts in parallel
  const [
    productCounts,
    categoryCounts,
    orderCounts,
    inventoryOutOfStock,
    inventoryLowStock,
    restockSubscribers,
    reviewCounts,
  ] = await Promise.all([
    // Products by status
    admin.from('products').select('status'),
    // Categories total
    admin.from('categories').select('id', { count: 'exact', head: true }),
    // Orders by status
    admin.from('orders').select('status'),
    // Out of stock: available_stock = 0 and tracking enabled
    admin
      .from('inventory')
      .select('id', { count: 'exact', head: true })
      .eq('tracking_enabled', true)
      .eq('available_stock', 0),
    // Low stock: 0 < available_stock <= threshold
    admin
      .from('inventory')
      .select('id, available_stock, low_stock_threshold')
      .eq('tracking_enabled', true)
      .gt('available_stock', 0),
    // Active restock subscribers
    admin
      .from('restock_subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
    // Reviews by status
    admin.from('product_reviews').select('status'),
  ]);

  // Product counts
  const products = (productCounts.data ?? []).reduce(
    (acc, p) => {
      acc.total++;
      if (p.status === 'active') acc.active++;
      if (p.status === 'draft') acc.draft++;
      if (p.status === 'archived') acc.archived++;
      return acc;
    },
    { total: 0, active: 0, draft: 0, archived: 0 }
  );

  // Order counts
  const orders = (orderCounts.data ?? []).reduce(
    (acc, o) => {
      acc.total++;
      if (o.status === 'pending') acc.pending++;
      if (o.status === 'confirmed') acc.confirmed++;
      if (o.status === 'delivered') acc.delivered++;
      if (o.status === 'cancelled') acc.cancelled++;
      if (o.status === 'cancellation_requested') acc.cancellationRequested++;
      if (o.status === 'return_requested') acc.returnRequested++;
      if (
        [
          'refund_requested',
          'refund_under_review',
          'refund_approved',
          'refund_processing',
        ].includes(o.status)
      )
        acc.refundPending++;
      return acc;
    },
    {
      total: 0,
      pending: 0,
      confirmed: 0,
      delivered: 0,
      cancelled: 0,
      cancellationRequested: 0,
      returnRequested: 0,
      refundPending: 0,
    }
  );

  // Low stock: available_stock > 0 but <= threshold
  const lowStockCount = (inventoryLowStock.data ?? []).filter(
    (r) => (r.available_stock ?? 0) <= r.low_stock_threshold
  ).length;

  // Review counts
  const reviews = (reviewCounts.data ?? []).reduce(
    (acc, r) => {
      if (r.status === 'pending') acc.pending++;
      if (r.status === 'approved') acc.approved++;
      return acc;
    },
    { pending: 0, approved: 0 }
  );

  return {
    products,
    categories: { total: categoryCounts.count ?? 0 },
    orders,
    inventory: {
      outOfStock: inventoryOutOfStock.count ?? 0,
      lowStock: lowStockCount,
    },
    restock: {
      activeSubscribers: restockSubscribers.count ?? 0,
      pendingNotifications: 0, // Computed separately when needed
    },
    reviews,
  };
}

export async function getRecentOrders(limit = 10) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('orders')
    .select(
      'id, order_number, customer_name, phone, status, payment_status, created_at, order_items(id)'
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`getRecentOrders: ${error.message}`);
  return data ?? [];
}

export async function getLowStockProducts(limit = 10) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('inventory')
    .select(
      'id, available_stock, low_stock_threshold, total_stock, reserved_stock, products(id, name, slug, sku, status)'
    )
    .eq('tracking_enabled', true)
    .gt('available_stock', 0)
    .order('available_stock', { ascending: true })
    .limit(limit);

  if (error) throw new Error(`getLowStockProducts: ${error.message}`);
  return (data ?? []).filter((r) => (r.available_stock ?? 0) <= r.low_stock_threshold);
}
