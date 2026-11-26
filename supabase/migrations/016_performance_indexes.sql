-- ─────────────────────────────────────────────────────────────────────────────
-- 016_performance_indexes.sql (A8-T6-1)
--
-- Indexes for the most common query patterns in the application.
-- All are CONCURRENTLY to avoid locking in production.
-- Run with: supabase db push  (or apply directly in the Supabase SQL editor)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Products ─────────────────────────────────────────────────────────────────

-- Primary filter: active products (listing pages, homepage)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_status
  ON products (status);

-- Slug lookup (product detail page)
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_products_slug
  ON products (slug);

-- Featured / flag filters (homepage sections)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_is_featured
  ON products (is_featured) WHERE is_featured = TRUE;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_is_bestseller
  ON products (is_bestseller) WHERE is_bestseller = TRUE;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_is_new_arrival
  ON products (is_new_arrival) WHERE is_new_arrival = TRUE;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_is_signature
  ON products (is_signature) WHERE is_signature = TRUE;

-- Full-text search on product names
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_name_fts
  ON products USING GIN (to_tsvector('english', name));

-- ── Categories ────────────────────────────────────────────────────────────────

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_slug
  ON categories (slug);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_visible_order
  ON categories (is_visible, display_order);

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_subcategories_slug
  ON subcategories (slug);

-- ── Orders ────────────────────────────────────────────────────────────────────

-- Customer order lookup (track page — phone + order_number)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_phone
  ON orders (phone);

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_order_number
  ON orders (order_number);

-- Admin order list (status filter tab)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status
  ON orders (status);

-- Admin order list (most recent first)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_created_at
  ON orders (created_at DESC);

-- ── Inventory ─────────────────────────────────────────────────────────────────

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_product_variant
  ON inventory (product_id, variant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_available_stock
  ON inventory (available_stock);

-- ── Reviews ───────────────────────────────────────────────────────────────────

-- Public review listing (approved reviews per product)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_product_status
  ON product_reviews (product_id, status);

-- Admin review moderation (by status)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_status
  ON product_reviews (status);

-- ── Restock subscriptions ─────────────────────────────────────────────────────

-- Active subscribers per product (pending notifications queue)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_restock_subscriptions_product_status
  ON restock_subscriptions (product_id, status);

-- ── Inventory movements ───────────────────────────────────────────────────────

-- History lookup per inventory row
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_movements_inventory_id
  ON inventory_movements (inventory_id, created_at DESC);

-- Order-linked movements
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_movements_order_id
  ON inventory_movements (order_id) WHERE order_id IS NOT NULL;

-- ── Collections ───────────────────────────────────────────────────────────────

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_collections_slug
  ON collections (slug);
