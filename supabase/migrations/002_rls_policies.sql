-- ============================================================
-- Bhoomi Art — Row Level Security Policies
-- Migration: 002_rls_policies.sql
-- ============================================================
-- Principles:
--   - Anon can read public data (active products, visible categories, etc.)
--   - Anon can insert orders and restock subscriptions
--   - Anon can insert reviews (pending approval)
--   - Authenticated admin/staff can manage all content
--   - Orders are NOT readable by ID alone — customer must supply phone+order_number
--   - Service role (used by admin.ts) bypasses RLS entirely
-- ============================================================

-- Enable RLS on every table
ALTER TABLE profiles                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories                ENABLE ROW LEVEL SECURITY;
ALTER TABLE products                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_media                ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants             ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tags                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tag_map              ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_category_map         ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_subcategory_map      ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_recommendations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements          ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history         ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_requests              ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_request_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_status_history        ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews              ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_media                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE restock_subscriptions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE restock_notification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_sections            ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings                ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs                   ENABLE ROW LEVEL SECURITY;

-- ─── Helper: is the current user an admin or staff? ───────────────────────────

CREATE OR REPLACE FUNCTION is_admin_or_staff()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'staff')
  );
$$;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

-- ─── Profiles ─────────────────────────────────────────────────────────────────

-- Users can read their own profile
CREATE POLICY "profiles: self read"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "profiles: admin read all"
  ON profiles FOR SELECT
  USING (is_admin());

-- Admins can update profiles
CREATE POLICY "profiles: admin update"
  ON profiles FOR UPDATE
  USING (is_admin());

-- ─── Categories ───────────────────────────────────────────────────────────────

-- Public can read visible categories
CREATE POLICY "categories: public read"
  ON categories FOR SELECT
  USING (is_visible = TRUE);

-- Admin/staff can read all (including hidden)
CREATE POLICY "categories: staff read all"
  ON categories FOR SELECT
  USING (is_admin_or_staff());

-- Admin/staff manage categories
CREATE POLICY "categories: staff write"
  ON categories FOR ALL
  USING (is_admin_or_staff());

-- ─── Subcategories ────────────────────────────────────────────────────────────

CREATE POLICY "subcategories: public read"
  ON subcategories FOR SELECT
  USING (is_visible = TRUE);

CREATE POLICY "subcategories: staff read all"
  ON subcategories FOR SELECT
  USING (is_admin_or_staff());

CREATE POLICY "subcategories: staff write"
  ON subcategories FOR ALL
  USING (is_admin_or_staff());

-- ─── Products ─────────────────────────────────────────────────────────────────

-- Public can read active products
CREATE POLICY "products: public read active"
  ON products FOR SELECT
  USING (status = 'active');

-- Staff can read all products
CREATE POLICY "products: staff read all"
  ON products FOR SELECT
  USING (is_admin_or_staff());

-- Staff can manage products
CREATE POLICY "products: staff write"
  ON products FOR ALL
  USING (is_admin_or_staff());

-- ─── Product media ────────────────────────────────────────────────────────────

CREATE POLICY "product_media: public read"
  ON product_media FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_media.product_id AND p.status = 'active'
    )
  );

CREATE POLICY "product_media: staff all"
  ON product_media FOR ALL
  USING (is_admin_or_staff());

-- ─── Product variants, tags, maps ─────────────────────────────────────────────

CREATE POLICY "product_variants: public read"
  ON product_variants FOR SELECT
  USING (
    status = 'active' AND
    EXISTS (SELECT 1 FROM products p WHERE p.id = product_variants.product_id AND p.status = 'active')
  );

CREATE POLICY "product_variants: staff all"
  ON product_variants FOR ALL
  USING (is_admin_or_staff());

CREATE POLICY "product_tags: public read"
  ON product_tags FOR SELECT USING (TRUE);

CREATE POLICY "product_tags: staff write"
  ON product_tags FOR ALL USING (is_admin_or_staff());

CREATE POLICY "product_tag_map: public read"
  ON product_tag_map FOR SELECT USING (TRUE);

CREATE POLICY "product_tag_map: staff write"
  ON product_tag_map FOR ALL USING (is_admin_or_staff());

CREATE POLICY "product_category_map: public read"
  ON product_category_map FOR SELECT USING (TRUE);

CREATE POLICY "product_category_map: staff write"
  ON product_category_map FOR ALL USING (is_admin_or_staff());

CREATE POLICY "product_subcategory_map: public read"
  ON product_subcategory_map FOR SELECT USING (TRUE);

CREATE POLICY "product_subcategory_map: staff write"
  ON product_subcategory_map FOR ALL USING (is_admin_or_staff());

CREATE POLICY "product_recommendations: public read"
  ON product_recommendations FOR SELECT USING (TRUE);

CREATE POLICY "product_recommendations: staff write"
  ON product_recommendations FOR ALL USING (is_admin_or_staff());

-- ─── Inventory ────────────────────────────────────────────────────────────────

-- Public can read inventory for active products (to show availability)
CREATE POLICY "inventory: public read"
  ON inventory FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM products p WHERE p.id = inventory.product_id AND p.status = 'active')
  );

-- Staff can manage inventory
CREATE POLICY "inventory: staff all"
  ON inventory FOR ALL
  USING (is_admin_or_staff());

-- Movements: staff only (no public read — contains internal quantity data)
CREATE POLICY "inventory_movements: staff all"
  ON inventory_movements FOR ALL
  USING (is_admin_or_staff());

-- ─── Orders ───────────────────────────────────────────────────────────────────

-- Anon CAN insert orders (guest checkout)
CREATE POLICY "orders: anon insert"
  ON orders FOR INSERT
  WITH CHECK (TRUE);

-- Public order lookup: requires BOTH phone AND order_number match
-- (Prevents enumeration — knowing just an order ID is not enough)
CREATE POLICY "orders: customer lookup by phone+number"
  ON orders FOR SELECT
  USING (
    phone = current_setting('app.current_phone', TRUE)
    AND order_number = current_setting('app.current_order_number', TRUE)
  );

-- Staff can read and manage all orders
CREATE POLICY "orders: staff all"
  ON orders FOR ALL
  USING (is_admin_or_staff());

-- Order items — same rules as orders
CREATE POLICY "order_items: staff all"
  ON order_items FOR ALL
  USING (is_admin_or_staff());

CREATE POLICY "order_items: anon insert"
  ON order_items FOR INSERT
  WITH CHECK (TRUE);

-- Status history — staff only
CREATE POLICY "order_status_history: staff all"
  ON order_status_history FOR ALL
  USING (is_admin_or_staff());

-- Returns / refunds — staff only (customers submit via Server Actions)
CREATE POLICY "return_requests: staff all"
  ON return_requests FOR ALL
  USING (is_admin_or_staff());

CREATE POLICY "return_requests: anon insert"
  ON return_requests FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "return_request_items: staff all"
  ON return_request_items FOR ALL
  USING (is_admin_or_staff());

CREATE POLICY "return_request_items: anon insert"
  ON return_request_items FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "refunds: staff all"
  ON refunds FOR ALL
  USING (is_admin_or_staff());

CREATE POLICY "refund_status_history: staff all"
  ON refund_status_history FOR ALL
  USING (is_admin_or_staff());

-- ─── Reviews ──────────────────────────────────────────────────────────────────

-- Public can read approved reviews
CREATE POLICY "product_reviews: public read approved"
  ON product_reviews FOR SELECT
  USING (status = 'approved');

-- Anon can insert reviews (pending moderation)
CREATE POLICY "product_reviews: anon insert"
  ON product_reviews FOR INSERT
  WITH CHECK (status = 'pending');

-- Staff can read and manage all reviews
CREATE POLICY "product_reviews: staff all"
  ON product_reviews FOR ALL
  USING (is_admin_or_staff());

-- Review media: same visibility as parent review
CREATE POLICY "review_media: public read"
  ON review_media FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM product_reviews r
      WHERE r.id = review_media.review_id AND r.status = 'approved'
    )
  );

CREATE POLICY "review_media: anon insert"
  ON review_media FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "review_media: staff all"
  ON review_media FOR ALL
  USING (is_admin_or_staff());

-- ─── Restock Subscriptions ────────────────────────────────────────────────────

-- Anon can subscribe (guest, no account needed)
CREATE POLICY "restock_subscriptions: anon insert"
  ON restock_subscriptions FOR INSERT
  WITH CHECK (TRUE);

-- No anon list — prevents scraping subscriber contacts
-- Staff can read and manage all subscriptions
CREATE POLICY "restock_subscriptions: staff all"
  ON restock_subscriptions FOR ALL
  USING (is_admin_or_staff());

-- Notification history — staff only
CREATE POLICY "restock_notification_history: staff all"
  ON restock_notification_history FOR ALL
  USING (is_admin_or_staff());

-- ─── Content & Config ─────────────────────────────────────────────────────────

CREATE POLICY "homepage_sections: public read"
  ON homepage_sections FOR SELECT
  USING (is_visible = TRUE);

CREATE POLICY "homepage_sections: staff all"
  ON homepage_sections FOR ALL
  USING (is_admin_or_staff());

CREATE POLICY "banners: public read"
  ON banners FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "banners: staff all"
  ON banners FOR ALL
  USING (is_admin_or_staff());

CREATE POLICY "collections: public read"
  ON collections FOR SELECT
  USING (is_visible = TRUE);

CREATE POLICY "collections: staff all"
  ON collections FOR ALL
  USING (is_admin_or_staff());

CREATE POLICY "collection_products: public read"
  ON collection_products FOR SELECT USING (TRUE);

CREATE POLICY "collection_products: staff all"
  ON collection_products FOR ALL
  USING (is_admin_or_staff());

CREATE POLICY "site_settings: public read"
  ON site_settings FOR SELECT USING (TRUE);

CREATE POLICY "site_settings: admin write"
  ON site_settings FOR ALL
  USING (is_admin());

CREATE POLICY "pages: public read published"
  ON pages FOR SELECT
  USING (is_published = TRUE);

CREATE POLICY "pages: staff all"
  ON pages FOR ALL
  USING (is_admin_or_staff());

CREATE POLICY "blog_posts: public read published"
  ON blog_posts FOR SELECT
  USING (status = 'published');

CREATE POLICY "blog_posts: staff all"
  ON blog_posts FOR ALL
  USING (is_admin_or_staff());

-- Audit logs: admin read-only; service-role inserts only
CREATE POLICY "audit_logs: admin read"
  ON audit_logs FOR SELECT
  USING (is_admin());
-- Note: INSERT is done via service role (bypasses RLS) — no INSERT policy needed
