-- ============================================================
-- Bhoomi Art — Initial Schema Migration
-- Migration: 001_initial_schema.sql
-- ============================================================
-- Run order:
--   1. Enum types
--   2. Core catalogue tables
--   3. Inventory tables
--   4. Order tables
--   5. Reviews + restock tables
--   6. Content + config tables
--   7. Indexes
-- ============================================================

-- ─── Extensions ───────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- for full-text product search

-- ─── Enums ────────────────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('admin', 'staff');

CREATE TYPE availability_type AS ENUM (
  'ready_to_ship',
  'made_to_order',
  'out_of_stock'
);

CREATE TYPE product_status AS ENUM ('active', 'archived', 'draft');

CREATE TYPE media_type AS ENUM ('image', 'video');

CREATE TYPE change_type AS ENUM (
  'restock',
  'production',
  'damaged',
  'manual_correction',
  'order_reserved',
  'order_released',
  'order_fulfilled',
  'return_restocked'
);

CREATE TYPE order_status AS ENUM (
  'pending',
  'confirmed',
  'processing',
  'customization_in_progress',
  'ready_for_dispatch',
  'shipped',
  'delivered',
  'cancellation_requested',
  'cancelled',
  'return_requested',
  'return_approved',
  'return_rejected',
  'return_in_transit',
  'returned',
  'refund_requested',
  'refund_under_review',
  'refund_approved',
  'refund_processing',
  'partially_refunded',
  'refunded',
  'refund_rejected'
);

CREATE TYPE payment_status AS ENUM ('pending', 'received', 'failed');

CREATE TYPE return_reason AS ENUM (
  'damaged',
  'wrong_item',
  'changed_mind',
  'quality_issue',
  'other'
);

CREATE TYPE return_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'in_transit',
  'completed'
);

CREATE TYPE refund_type AS ENUM ('full', 'partial');

CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected', 'hidden');

CREATE TYPE notification_channel AS ENUM ('whatsapp', 'email', 'both');

CREATE TYPE subscription_status AS ENUM ('active', 'notified', 'unsubscribed');

CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed');

CREATE TYPE collection_type AS ENUM (
  'signature',
  'bestsellers',
  'new_arrivals',
  'featured',
  'trending',
  'customized',
  'special'
);

-- ─── Profiles ─────────────────────────────────────────────────────────────────

CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role        user_role NOT NULL DEFAULT 'staff',
  full_name   TEXT,
  email       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile row when a new auth user is created
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── Categories ───────────────────────────────────────────────────────────────

CREATE TABLE categories (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  description      TEXT,
  image_url        TEXT,
  display_order    INT NOT NULL DEFAULT 0,
  is_visible       BOOLEAN NOT NULL DEFAULT TRUE,
  seo_title        TEXT,
  seo_description  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE subcategories (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id      UUID NOT NULL REFERENCES categories ON DELETE CASCADE,
  name             TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  description      TEXT,
  image_url        TEXT,
  display_order    INT NOT NULL DEFAULT 0,
  is_visible       BOOLEAN NOT NULL DEFAULT TRUE,
  seo_title        TEXT,
  seo_description  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Products ─────────────────────────────────────────────────────────────────

CREATE TABLE products (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,
  slug                TEXT NOT NULL UNIQUE,
  short_description   TEXT,
  long_description    TEXT,
  specifications      JSONB,
  dimensions          JSONB,
  materials           TEXT,
  care_instructions   TEXT,
  story_content       TEXT,
  price               NUMERIC(10,2),
  sku                 TEXT UNIQUE,
  availability_type   availability_type NOT NULL DEFAULT 'ready_to_ship',
  preparation_time    TEXT,
  is_featured         BOOLEAN NOT NULL DEFAULT FALSE,
  is_signature        BOOLEAN NOT NULL DEFAULT FALSE,
  is_bestseller       BOOLEAN NOT NULL DEFAULT FALSE,
  is_new_arrival      BOOLEAN NOT NULL DEFAULT FALSE,
  status              product_status NOT NULL DEFAULT 'draft',
  seo_title           TEXT,
  seo_description     TEXT,
  seo_slug            TEXT,
  og_image_url        TEXT,
  canonical_url       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE product_media (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id     UUID NOT NULL REFERENCES products ON DELETE CASCADE,
  url            TEXT NOT NULL,
  media_type     media_type NOT NULL DEFAULT 'image',
  alt_text       TEXT,
  display_order  INT NOT NULL DEFAULT 0
);

CREATE TABLE product_variants (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id      UUID NOT NULL REFERENCES products ON DELETE CASCADE,
  name            TEXT NOT NULL,
  sku             TEXT,
  price_modifier  NUMERIC(10,2) NOT NULL DEFAULT 0,
  attributes      JSONB,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived'))
);

CREATE TABLE product_tags (
  id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name  TEXT NOT NULL UNIQUE,
  slug  TEXT NOT NULL UNIQUE
);

CREATE TABLE product_tag_map (
  product_id  UUID NOT NULL REFERENCES products ON DELETE CASCADE,
  tag_id      UUID NOT NULL REFERENCES product_tags ON DELETE CASCADE,
  PRIMARY KEY (product_id, tag_id)
);

CREATE TABLE product_category_map (
  product_id   UUID NOT NULL REFERENCES products ON DELETE CASCADE,
  category_id  UUID NOT NULL REFERENCES categories ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);

CREATE TABLE product_subcategory_map (
  product_id      UUID NOT NULL REFERENCES products ON DELETE CASCADE,
  subcategory_id  UUID NOT NULL REFERENCES subcategories ON DELETE CASCADE,
  PRIMARY KEY (product_id, subcategory_id)
);

CREATE TABLE product_recommendations (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id        UUID NOT NULL REFERENCES products ON DELETE CASCADE,
  recommended_id    UUID NOT NULL REFERENCES products ON DELETE CASCADE,
  type              TEXT NOT NULL CHECK (type IN ('related', 'you_may_also_like', 'frequently_bought_together')),
  display_order     INT NOT NULL DEFAULT 0,
  UNIQUE (product_id, recommended_id, type)
);

-- ─── Inventory ────────────────────────────────────────────────────────────────

CREATE TABLE inventory (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id           UUID NOT NULL REFERENCES products ON DELETE CASCADE,
  variant_id           UUID REFERENCES product_variants ON DELETE CASCADE,
  total_stock          INT NOT NULL DEFAULT 0 CHECK (total_stock >= 0),
  reserved_stock       INT NOT NULL DEFAULT 0 CHECK (reserved_stock >= 0),
  low_stock_threshold  INT NOT NULL DEFAULT 5,
  tracking_enabled     BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (product_id, variant_id),
  -- available_stock must never go negative
  CONSTRAINT available_stock_non_negative
    CHECK (total_stock - reserved_stock >= 0)
);

-- Computed column via generated column (available_stock)
ALTER TABLE inventory
  ADD COLUMN available_stock INT GENERATED ALWAYS AS (total_stock - reserved_stock) STORED;

CREATE TABLE inventory_movements (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inventory_id  UUID NOT NULL REFERENCES inventory ON DELETE CASCADE,
  previous_qty  INT NOT NULL,
  new_qty       INT NOT NULL,
  change_qty    INT NOT NULL,
  change_type   change_type NOT NULL,
  reason        TEXT,
  actor_id      UUID REFERENCES profiles,
  order_id      UUID,   -- FK to orders added after orders table
  return_id     UUID,   -- FK to return_requests added after that table
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Orders ───────────────────────────────────────────────────────────────────

CREATE TABLE orders (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number     TEXT NOT NULL UNIQUE,
  customer_name    TEXT NOT NULL,
  phone            TEXT NOT NULL,
  email            TEXT,
  address_line1    TEXT,
  address_line2    TEXT,
  city             TEXT,
  state            TEXT,
  postal_code      TEXT,
  country          TEXT NOT NULL DEFAULT 'India',
  notes            TEXT,
  customization    TEXT,
  payment_status   payment_status NOT NULL DEFAULT 'pending',
  payment_notes    TEXT,
  status           order_status NOT NULL DEFAULT 'pending',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE order_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES orders ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products,
  variant_id  UUID REFERENCES product_variants,
  quantity    INT NOT NULL CHECK (quantity > 0),
  unit_price  NUMERIC(10,2) NOT NULL,
  item_total  NUMERIC(10,2) NOT NULL,
  snapshot    JSONB NOT NULL  -- { name, sku, image_url } at time of order
);

CREATE TABLE order_status_history (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id         UUID NOT NULL REFERENCES orders ON DELETE CASCADE,
  previous_status  TEXT,
  new_status       TEXT NOT NULL,
  actor_id         UUID REFERENCES profiles,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE return_requests (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id     UUID NOT NULL REFERENCES orders ON DELETE CASCADE,
  reason       return_reason NOT NULL,
  description  TEXT,
  status       return_status NOT NULL DEFAULT 'pending',
  admin_notes  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE return_request_items (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  return_request_id  UUID NOT NULL REFERENCES return_requests ON DELETE CASCADE,
  order_item_id      UUID NOT NULL REFERENCES order_items ON DELETE CASCADE,
  quantity           INT NOT NULL CHECK (quantity > 0),
  image_urls         TEXT[] NOT NULL DEFAULT '{}'
);

CREATE TABLE refunds (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id           UUID NOT NULL REFERENCES orders ON DELETE CASCADE,
  return_request_id  UUID REFERENCES return_requests,
  amount             NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  refund_type        refund_type NOT NULL,
  method             TEXT NOT NULL,
  reference_id       TEXT,
  processed_at       TIMESTAMPTZ,
  notes              TEXT,
  actor_id           UUID NOT NULL REFERENCES profiles
);

CREATE TABLE refund_status_history (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  refund_id        UUID NOT NULL REFERENCES refunds ON DELETE CASCADE,
  previous_status  TEXT,
  new_status       TEXT NOT NULL,
  actor_id         UUID REFERENCES profiles,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add deferred FKs for inventory_movements after orders table exists
ALTER TABLE inventory_movements
  ADD CONSTRAINT fk_inventory_movements_order
    FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE SET NULL;

ALTER TABLE inventory_movements
  ADD CONSTRAINT fk_inventory_movements_return
    FOREIGN KEY (return_id) REFERENCES return_requests (id) ON DELETE SET NULL;

-- ─── Reviews ──────────────────────────────────────────────────────────────────

CREATE TABLE product_reviews (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id            UUID NOT NULL REFERENCES products ON DELETE CASCADE,
  order_id              UUID REFERENCES orders ON DELETE SET NULL,
  customer_name         TEXT NOT NULL,
  rating                INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body                  TEXT,
  status                review_status NOT NULL DEFAULT 'pending',
  is_verified_purchase  BOOLEAN NOT NULL DEFAULT FALSE,
  admin_response        TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE review_media (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id  UUID NOT NULL REFERENCES product_reviews ON DELETE CASCADE,
  url        TEXT NOT NULL,
  alt_text   TEXT
);

-- ─── Restock Notifications ────────────────────────────────────────────────────

CREATE TABLE restock_subscriptions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id     UUID NOT NULL REFERENCES products ON DELETE CASCADE,
  variant_id     UUID REFERENCES product_variants ON DELETE CASCADE,
  phone          TEXT,
  email          TEXT,
  channel        notification_channel NOT NULL DEFAULT 'whatsapp',
  status         subscription_status NOT NULL DEFAULT 'active',
  subscribed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Prevent duplicate active subscriptions for same product+contact+channel
  CONSTRAINT unique_active_subscription
    UNIQUE NULLS NOT DISTINCT (product_id, variant_id, phone, email, channel),
  CONSTRAINT contact_required
    CHECK (phone IS NOT NULL OR email IS NOT NULL)
);

CREATE TABLE restock_notification_history (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id   UUID NOT NULL REFERENCES restock_subscriptions ON DELETE CASCADE,
  inventory_id      UUID NOT NULL REFERENCES inventory ON DELETE CASCADE,
  attempt_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status            notification_status NOT NULL DEFAULT 'pending',
  provider_response TEXT
);

-- ─── Content & Config ─────────────────────────────────────────────────────────

CREATE TABLE homepage_sections (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_key    TEXT NOT NULL UNIQUE,
  title          TEXT,
  is_visible     BOOLEAN NOT NULL DEFAULT TRUE,
  display_order  INT NOT NULL DEFAULT 0,
  config         JSONB
);

CREATE TABLE banners (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_url      TEXT NOT NULL,
  title          TEXT,
  subtitle       TEXT,
  cta_text       TEXT,
  cta_url        TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  display_order  INT NOT NULL DEFAULT 0
);

CREATE TABLE collections (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  description  TEXT,
  image_url    TEXT,
  type         collection_type NOT NULL,
  is_visible   BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE collection_products (
  collection_id  UUID NOT NULL REFERENCES collections ON DELETE CASCADE,
  product_id     UUID NOT NULL REFERENCES products ON DELETE CASCADE,
  display_order  INT NOT NULL DEFAULT 0,
  PRIMARY KEY (collection_id, product_id)
);

CREATE TABLE site_settings (
  key          TEXT PRIMARY KEY,
  value        TEXT NOT NULL DEFAULT '',
  description  TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pages (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug             TEXT NOT NULL UNIQUE,
  title            TEXT NOT NULL,
  body             TEXT,
  seo_title        TEXT,
  seo_description  TEXT,
  is_published     BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE blog_posts (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug             TEXT NOT NULL UNIQUE,
  title            TEXT NOT NULL,
  body             TEXT,
  status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at     TIMESTAMPTZ,
  seo_title        TEXT,
  seo_description  TEXT
);

CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id    UUID REFERENCES profiles,
  action      TEXT NOT NULL,
  table_name  TEXT,
  record_id   UUID,
  diff        JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── updated_at trigger ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_categories_updated_at         BEFORE UPDATE ON categories         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_subcategories_updated_at      BEFORE UPDATE ON subcategories      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_products_updated_at           BEFORE UPDATE ON products           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_orders_updated_at             BEFORE UPDATE ON orders             FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_return_requests_updated_at    BEFORE UPDATE ON return_requests    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_pages_updated_at              BEFORE UPDATE ON pages              FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_site_settings_updated_at      BEFORE UPDATE ON site_settings      FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Indexes ──────────────────────────────────────────────────────────────────

-- Products
CREATE INDEX idx_products_status          ON products (status);
CREATE INDEX idx_products_slug            ON products (slug);
CREATE INDEX idx_products_availability    ON products (availability_type);
CREATE INDEX idx_products_featured        ON products (is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_products_signature       ON products (is_signature) WHERE is_signature = TRUE;
CREATE INDEX idx_products_bestseller      ON products (is_bestseller) WHERE is_bestseller = TRUE;
CREATE INDEX idx_products_new_arrival     ON products (is_new_arrival) WHERE is_new_arrival = TRUE;
CREATE INDEX idx_products_created_at      ON products (created_at DESC);
-- Full-text search
CREATE INDEX idx_products_search ON products
  USING gin(to_tsvector('english', COALESCE(name,'') || ' ' || COALESCE(short_description,'')));

-- Categories / subcategories
CREATE INDEX idx_categories_slug          ON categories (slug);
CREATE INDEX idx_categories_visible       ON categories (is_visible) WHERE is_visible = TRUE;
CREATE INDEX idx_subcategories_category   ON subcategories (category_id);
CREATE INDEX idx_subcategories_slug       ON subcategories (slug);

-- Product media
CREATE INDEX idx_product_media_product    ON product_media (product_id, display_order);

-- Inventory
CREATE INDEX idx_inventory_product        ON inventory (product_id);
CREATE INDEX idx_inventory_variant        ON inventory (variant_id) WHERE variant_id IS NOT NULL;
CREATE INDEX idx_inventory_low_stock      ON inventory (available_stock, low_stock_threshold);

-- Orders
CREATE INDEX idx_orders_phone             ON orders (phone);
CREATE INDEX idx_orders_order_number      ON orders (order_number);
CREATE INDEX idx_orders_status            ON orders (status);
CREATE INDEX idx_orders_created_at        ON orders (created_at DESC);

-- Order items
CREATE INDEX idx_order_items_order        ON order_items (order_id);
CREATE INDEX idx_order_items_product      ON order_items (product_id);

-- Reviews
CREATE INDEX idx_reviews_product          ON product_reviews (product_id, status);
CREATE INDEX idx_reviews_status           ON product_reviews (status);

-- Restock
CREATE INDEX idx_restock_subs_product     ON restock_subscriptions (product_id, status);

-- Audit
CREATE INDEX idx_audit_logs_actor         ON audit_logs (actor_id);
CREATE INDEX idx_audit_logs_table_record  ON audit_logs (table_name, record_id);
CREATE INDEX idx_audit_logs_created_at    ON audit_logs (created_at DESC);
