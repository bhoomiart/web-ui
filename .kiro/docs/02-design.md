# Bhoomi Art — Design

> How we're building it.
> Architecture decisions, database schema, file structure, and technical patterns.
> Update this when architecture decisions change.

---

## Application Architecture

### Route Structure

```
app/
├── (storefront)/          ← Public customer-facing pages
│   ├── layout.tsx         ← Navbar + Footer
│   ├── page.tsx           ← Homepage
│   ├── shop/              ← All products listing
│   ├── category/[slug]/   ← Category page
│   │   └── [sub]/         ← Subcategory page
│   ├── product/[slug]/    ← Product detail
│   ├── cart/              ← Cart page
│   ├── checkout/          ← Checkout form
│   ├── order/[number]/    ← Order confirmation + tracking
│   ├── track/             ← Order lookup (phone + order number)
│   ├── search/            ← Search results
│   ├── about/             ← Our Story
│   ├── craft/             ← The Art of Terracotta
│   ├── custom/            ← Custom Creations
│   └── contact/           ← Contact page
│
├── (admin)/               ← Protected admin pages
│   ├── layout.tsx         ← AdminSidebar + AdminTopbar
│   ├── login/             ← Admin login
│   ├── dashboard/         ← Overview metrics
│   ├── products/          ← Product management
│   ├── categories/        ← Category + subcategory management
│   ├── collections/       ← Collection management
│   ├── inventory/         ← Stock overview + history
│   ├── restock/           ← Restock subscribers + notifications
│   ├── orders/            ← Orders, cancellations, returns, refunds
│   ├── reviews/           ← Review moderation
│   ├── homepage/          ← Homepage section management
│   ├── pages/             ← Static page editor
│   ├── seo/               ← Global SEO settings
│   └── settings/          ← Refund policy, templates, site config
│
├── actions/               ← Server Actions (all mutations go here)
├── api/                   ← Route Handlers (webhooks, public APIs)
├── sitemap.ts
├── robots.ts
├── not-found.tsx
├── error.tsx
└── global-error.tsx

lib/
├── supabase/
│   ├── server.ts          ← SSR Supabase client
│   ├── client.ts          ← Browser Supabase client
│   └── admin.ts           ← Service-role client (server-only)
├── db/
│   ├── products.ts
│   ├── categories.ts
│   ├── orders.ts
│   ├── inventory.ts
│   └── reviews.ts
├── auth/
│   └── admin.ts           ← requireAdmin(), requireStaff()
├── whatsapp.ts            ← Click-to-Chat URL builder + templates
├── communications/
│   ├── index.ts           ← Provider interface
│   ├── whatsapp-click.ts
│   ├── whatsapp-api-stub.ts
│   └── email-stub.ts
├── seo.ts                 ← generateMetadata helpers
├── order-id.ts            ← Unique order number generator
├── analytics.ts           ← Event definitions
├── redirects.ts           ← Slug change redirect management
└── types/
    └── database.ts        ← Full typed DB schema

components/
├── ui/                    ← Generic primitives (Button, Card, Modal, etc.)
├── layout/                ← Navbar, Footer, AdminSidebar, Breadcrumb
├── storefront/            ← Storefront-specific components
└── admin/                 ← Admin-specific components
```

---

## Database Schema

### Identity & Auth

**profiles**

```
id            uuid  PK  (references auth.users)
role          enum  'admin' | 'staff'
full_name     text
email         text
created_at    timestamptz
```

---

### Catalogue

**categories**

```
id              uuid  PK
name            text  NOT NULL
slug            text  UNIQUE NOT NULL
description     text
image_url       text
display_order   int   DEFAULT 0
is_visible      bool  DEFAULT true
seo_title       text
seo_description text
created_at      timestamptz
updated_at      timestamptz
```

**subcategories**

```
id              uuid  PK
category_id     uuid  FK → categories
name            text  NOT NULL
slug            text  UNIQUE NOT NULL
description     text
image_url       text
display_order   int   DEFAULT 0
is_visible      bool  DEFAULT true
seo_title       text
seo_description text
created_at      timestamptz
updated_at      timestamptz
```

**products**

```
id                    uuid  PK
name                  text  NOT NULL
slug                  text  UNIQUE NOT NULL
short_description     text
long_description      text
specifications        jsonb
dimensions            jsonb  (height, width, depth, weight, unit)
materials             text
care_instructions     text
story_content         text
price                 numeric(10,2)
sku                   text  UNIQUE
availability_type     enum  'ready_to_ship' | 'made_to_order' | 'out_of_stock'
preparation_time      text
is_featured           bool  DEFAULT false
is_signature          bool  DEFAULT false
is_bestseller         bool  DEFAULT false
is_new_arrival        bool  DEFAULT false
status                enum  'active' | 'archived' | 'draft'
seo_title             text
seo_description       text
seo_slug              text
og_image_url          text
canonical_url         text
created_at            timestamptz
updated_at            timestamptz
```

**product_media**

```
id             uuid  PK
product_id     uuid  FK → products
url            text  NOT NULL
media_type     enum  'image' | 'video'
alt_text       text
display_order  int   DEFAULT 0
```

**product_variants**

```
id              uuid  PK
product_id      uuid  FK → products
name            text  NOT NULL  (e.g. "Ocean Blue — Medium")
sku             text
price_modifier  numeric(10,2)  DEFAULT 0
attributes      jsonb  (color, size, finish, etc.)
status          enum  'active' | 'archived'
```

**product_tags** + **product_tag_map**

```
product_tags:    id, name, slug
product_tag_map: product_id FK, tag_id FK  (composite PK)
```

**product_category_map**

```
product_id    uuid  FK → products
category_id   uuid  FK → categories
(composite PK)
```

**product_recommendations**

```
id                    uuid  PK
product_id            uuid  FK → products
recommended_id        uuid  FK → products
type                  enum  'related' | 'you_may_also_like' | 'frequently_bought_together'
display_order         int   DEFAULT 0
```

---

### Inventory

**inventory**

```
id                  uuid  PK
product_id          uuid  FK → products
variant_id          uuid  FK → product_variants  NULLABLE
total_stock         int   NOT NULL  DEFAULT 0
reserved_stock      int   NOT NULL  DEFAULT 0
low_stock_threshold int   DEFAULT 5
tracking_enabled    bool  DEFAULT true
-- available_stock = total_stock - reserved_stock (computed)
```

**inventory_movements**

```
id              uuid  PK
inventory_id    uuid  FK → inventory
previous_qty    int   NOT NULL
new_qty         int   NOT NULL
change_qty      int   NOT NULL
change_type     enum  'restock' | 'production' | 'damaged' | 'manual_correction'
                      | 'order_reserved' | 'order_released' | 'order_fulfilled'
                      | 'return_restocked'
reason          text
actor_id        uuid  FK → profiles  NULLABLE
order_id        uuid  FK → orders    NULLABLE
return_id       uuid  FK → return_requests  NULLABLE
created_at      timestamptz
```

---

### Orders

**orders**

```
id               uuid  PK
order_number     text  UNIQUE NOT NULL  (e.g. BA-20261124-0001)
customer_name    text  NOT NULL
phone            text  NOT NULL
email            text
address_line1    text
address_line2    text
city             text
state            text
postal_code      text
country          text  DEFAULT 'India'
notes            text
customization    text
payment_status   enum  'pending' | 'received' | 'failed'
payment_notes    text
status           enum  (see order statuses below)
created_at       timestamptz
updated_at       timestamptz
```

**Order status enum values:**
pending, confirmed, processing, customization_in_progress, ready_for_dispatch,
shipped, delivered, cancellation_requested, cancelled, return_requested,
return_approved, return_rejected, return_in_transit, returned,
refund_requested, refund_under_review, refund_approved, refund_processing,
partially_refunded, refunded, refund_rejected

**order_items**

```
id           uuid  PK
order_id     uuid  FK → orders
product_id   uuid  FK → products
variant_id   uuid  FK → product_variants  NULLABLE
quantity     int   NOT NULL
unit_price   numeric(10,2)
item_total   numeric(10,2)
snapshot     jsonb  (product name, sku, image at time of order)
```

**order_status_history**

```
id               uuid  PK
order_id         uuid  FK → orders
previous_status  text
new_status       text  NOT NULL
actor_id         uuid  FK → profiles  NULLABLE
notes            text
created_at       timestamptz
```

**return_requests**

```
id           uuid  PK
order_id     uuid  FK → orders
reason       enum  (damaged, wrong_item, changed_mind, quality_issue, other)
description  text
status       enum  (pending, approved, rejected, in_transit, completed)
admin_notes  text
created_at   timestamptz
updated_at   timestamptz
```

**return_request_items**

```
id                uuid  PK
return_request_id uuid  FK → return_requests
order_item_id     uuid  FK → order_items
quantity          int
image_urls        text[]
```

**refunds**

```
id                uuid  PK
order_id          uuid  FK → orders
return_request_id uuid  FK → return_requests  NULLABLE
amount            numeric(10,2)
refund_type       enum  'full' | 'partial'
method            text  (bank_transfer, cash, upi, other)
reference_id      text
processed_at      timestamptz
notes             text
actor_id          uuid  FK → profiles
```

**refund_status_history**

```
id               uuid  PK
refund_id        uuid  FK → refunds
previous_status  text
new_status       text
actor_id         uuid  FK → profiles  NULLABLE
notes            text
created_at       timestamptz
```

---

### Reviews

**product_reviews**

```
id                   uuid  PK
product_id           uuid  FK → products
order_id             uuid  FK → orders  NULLABLE
customer_name        text  NOT NULL
rating               int   CHECK (rating BETWEEN 1 AND 5)
body                 text
status               enum  'pending' | 'approved' | 'rejected' | 'hidden'
is_verified_purchase bool  DEFAULT false
admin_response       text
created_at           timestamptz
```

**review_media**

```
id         uuid  PK
review_id  uuid  FK → product_reviews
url        text  NOT NULL
alt_text   text
```

---

### Restock

**restock_subscriptions**

```
id           uuid  PK
product_id   uuid  FK → products
variant_id   uuid  FK → product_variants  NULLABLE
phone        text
email        text
channel      enum  'whatsapp' | 'email' | 'both'
status       enum  'active' | 'notified' | 'unsubscribed'
subscribed_at timestamptz
```

**restock_notification_history**

```
id              uuid  PK
subscription_id uuid  FK → restock_subscriptions
inventory_id    uuid  FK → inventory
attempt_at      timestamptz
status          enum  'pending' | 'sent' | 'failed'
provider_response text
```

---

### Content & Config

**homepage_sections**

```
id            uuid  PK
section_key   text  UNIQUE  (hero, brand_intro, featured_categories, etc.)
title         text
is_visible    bool  DEFAULT true
display_order int   DEFAULT 0
config        jsonb  (section-specific settings)
```

**banners**

```
id             uuid  PK
image_url      text  NOT NULL
title          text
subtitle       text
cta_text       text
cta_url        text
is_active      bool  DEFAULT true
display_order  int   DEFAULT 0
```

**collections**

```
id           uuid  PK
name         text  NOT NULL
slug         text  UNIQUE
description  text
image_url    text
type         enum  (signature, bestsellers, new_arrivals, featured, trending, customized, special)
is_visible   bool  DEFAULT true
```

**collection_products**

```
collection_id  uuid  FK → collections
product_id     uuid  FK → products
display_order  int   DEFAULT 0
(composite PK)
```

**site_settings**

```
key         text  PK
value       text
description text
updated_at  timestamptz
```

**pages**

```
id              uuid  PK
slug            text  UNIQUE
title           text
body            text  (markdown or rich text)
seo_title       text
seo_description text
is_published    bool  DEFAULT false
updated_at      timestamptz
```

**blog_posts** (stub — not surfaced in UI yet)

```
id              uuid  PK
slug            text  UNIQUE
title           text
body            text
status          enum  'draft' | 'published'
published_at    timestamptz
seo_title       text
seo_description text
```

**audit_logs**

```
id          uuid  PK
actor_id    uuid  FK → profiles  NULLABLE
action      text  NOT NULL  (e.g. 'product.update', 'order.status_change')
table_name  text
record_id   uuid
diff        jsonb  (before/after values)
created_at  timestamptz
```

---

## Security Design

### Row Level Security — Summary

| Table                 | Anon           | Authenticated (staff)    | Admin only                   |
| --------------------- | -------------- | ------------------------ | ---------------------------- |
| products              | SELECT active  | —                        | INSERT, UPDATE, DELETE       |
| categories            | SELECT visible | —                        | INSERT, UPDATE, DELETE       |
| orders                | INSERT         | SELECT own (phone match) | SELECT all, UPDATE           |
| order_items           | —              | —                        | SELECT all                   |
| restock_subscriptions | INSERT         | —                        | SELECT, UPDATE               |
| product_reviews       | INSERT pending | —                        | SELECT all, UPDATE           |
| profiles              | —              | SELECT own               | SELECT all, UPDATE           |
| audit_logs            | —              | —                        | SELECT (service-role INSERT) |
| site_settings         | SELECT         | —                        | UPDATE                       |
| homepage_sections     | SELECT         | —                        | UPDATE                       |

**Rule:** Never trust client-provided role claims. Always derive role from `profiles` table in server-side context.

### Order Lookup Security

Customers look up orders by supplying **both** phone number **and** order number.
No route exposes order data by ID alone.

---

## Storage Buckets

| Bucket          | Who uploads        | Who reads  | Notes                        |
| --------------- | ------------------ | ---------- | ---------------------------- |
| `product-media` | Admin only         | Public     | Product images and videos    |
| `review-media`  | Anon (with limits) | Admin only | Review evidence images       |
| `brand-assets`  | Admin only         | Public     | Logos, banners, story images |

---

## Stock Reservation Flow

```
1. Customer submits order
2. Server validates availability for each item
3. BEGIN TRANSACTION
   a. SELECT inventory WHERE product_id = ? FOR UPDATE
   b. Check available_stock >= requested_qty
   c. UPDATE inventory SET reserved_stock = reserved_stock + qty
   d. INSERT order + order_items
   e. INSERT inventory_movement (type: order_reserved)
4. COMMIT — or ROLLBACK if any step fails
5. No partial reservation remains on failure
```

---

## WhatsApp Communication Design

All WhatsApp communication uses Click-to-Chat links (`https://wa.me/{phone}?text={encoded_message}`).

A message being "opened" is **not** the same as "sent", "delivered", or "read".
The database records what message was **prepared** — not what was actually received.

Templates are stored in `site_settings` and editable by admin.
Future upgrade path: replace `whatsapp-click.ts` implementation with `whatsapp-api.ts`
using the same interface from `lib/communications/index.ts`.

---

## SEO Architecture

| Page type                  | Rendering         | Metadata                   |
| -------------------------- | ----------------- | -------------------------- |
| Homepage                   | SSR               | Static + dynamic sections  |
| Category / Subcategory     | SSR + ISR         | `generateMetadata` from DB |
| Product detail             | SSR + ISR         | `generateMetadata` from DB |
| Search results             | SSR               | Dynamic title              |
| Admin pages                | SSR (behind auth) | No index                   |
| Static pages (About, etc.) | SSG               | From `pages` table         |

Schema.org JSON-LD is rendered as `<script type="application/ld+json">` in `<head>` via each page's layout.

---

## Brand Design Tokens

```css
/* Terracotta palette */
--color-earth-50: #fdf8f3 /* Warm Ivory */ --color-earth-100: #f5ede0 --color-earth-200: #e8d5be
  /* Sand Beige */ --color-earth-300: #d4b08a --color-earth-400: #c08b5c --color-earth-500: #a8683a
  /* Terracotta mid */ --color-earth-600: #8b5230 /* Clay Brown */ --color-earth-700: #6e3f26
  --color-earth-800: #522e1c --color-earth-900: #3a1f12 /* Deep Charcoal */
  /* Forest / earthy green */ --color-forest-500: #2d7340 /* Earthy Green */
  --color-forest-600: #1f5a30 /* Typography */ --font-serif: Playfair Display (headings, editorial)
  --font-sans: Lato (body, UI);
```

Target brand colors from requirements:

- Terracotta `#B65E3C` → maps to earth-500/600 range
- Clay Brown `#80513B` → maps to earth-600
- Sand Beige `#E9DCC8` → maps to earth-200
- Warm Ivory `#FAF7F0` → maps to earth-50
- Earthy Green `#68765A` → maps to forest-500 adjusted
- Deep Charcoal `#302923` → maps to earth-900
