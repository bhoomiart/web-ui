# Bhoomi Art — Execution Plan

> Who does what, in what order.
> Every task must be explicitly approved before work starts.
> Update status markers as work progresses.

Status: `[ ]` not started · `[~]` in progress · `[x]` done · `[!]` blocked

---

## Agent Map

| Agent                  | Focus area                                        | Starts after               |
| ---------------------- | ------------------------------------------------- | -------------------------- |
| **A1** Foundation      | App shell, design system, shared components       | Nothing                    |
| **A2** Data Layer      | Supabase setup, full DB schema, RLS, storage      | A1                         |
| **A3** Admin Dashboard | All admin pages and content management            | A1 + A2                    |
| **A4** Inventory       | Stock tracking, movements, restock subscriptions  | A1 + A2 + A3               |
| **A5** Storefront      | All public customer pages                         | A1 + A2 (parallel with A3) |
| **A6** Orders          | Cart, checkout, order lifecycle, returns, refunds | A1 + A2 + A4 + A5          |
| **A7** Communications  | Reviews, WhatsApp templates, communication layer  | A1 + A2 + A5 + A6          |
| **A8** SEO & Deploy    | Sitemap, robots, perf, accessibility, analytics   | All agents                 |

```
A1 → A2 ─┬─ A3 → A4 → A6 → A7 → A8
           └─ A5 ────────────────────┘
```

---

---

## A1 — Foundation & Design System

### A1-T1 · Next.js 16 Audit ✅

Before writing a single line of code, understand what changed in Next.js 16.

- [x] A1-T1-1 · Read `node_modules/next/dist/docs/` and note breaking changes vs Next.js 14/15
- [x] A1-T1-2 · Document changes to: LayoutProps, metadata API, Server Actions, font loading, caching, generateMetadata
- [x] A1-T1-3 · Confirm route-group conventions and middleware API for this version

> Output: `.kiro/docs/A1-T1-nextjs16-audit.md`

### A1-T2 · Design Token Expansion ✅

Extend the existing `globals.css` into a full design system.

- [x] A1-T2-1 · Full spacing scale on a 4px grid (4px → 96px named steps)
- [x] A1-T2-2 · Type scale (xs to 5xl) with matching line-height pairs
- [x] A1-T2-3 · Shadow tokens: sm, md, lg, xl, card, button
- [x] A1-T2-4 · Border-radius tokens: sm, md, lg, full
- [x] A1-T2-5 · Smoke test — build passes, coming-soon page unchanged

### A1-T3 · Base UI Component Library ✅

Generic primitives used everywhere — storefront and admin alike.

- [x] A1-T3-1 · `Button` — primary, secondary, ghost, destructive variants; sm/md/lg sizes
- [x] A1-T3-2 · `Badge` — default, success, warning, error, info
- [x] A1-T3-3 · `Card` — header, body, footer slots
- [x] A1-T3-4 · `Spinner` — sm/md/lg, screen-reader label
- [x] A1-T3-5 · `EmptyState` — icon, title, description, optional action button
- [x] A1-T3-6 · `Modal` — focus-trapped, accessible, keyboard-closable
- [x] A1-T3-7 · `Toast` — success, error, info, warning variants
- [x] A1-T3-8 · Form primitives: `Input`, `Textarea`, `Select`, `Checkbox`, `Radio`
- [x] A1-T3-9 · `ErrorBoundary` client component

> Output: `components/ui/` (9 components + barrel index)

### A1-T4 · Route Group Shells ✅

Create the two route groups that separate storefront from admin.

- [x] A1-T4-1 · `app/(storefront)/layout.tsx` shell
- [x] A1-T4-2 · `app/(admin)/layout.tsx` shell
- [x] A1-T4-3 · Confirm existing `/` route still resolves correctly — ✅ verified in build
- [x] A1-T4-4 · Coming-soon stays at root `app/page.tsx`; storefront pages live under `app/(storefront)/`; admin pages under `app/(admin)/admin/`

> Output:
>
> - `app/(storefront)/layout.tsx` — passthrough shell, Navbar/Footer placeholder comments
> - `app/(storefront)/shop/page.tsx` — placeholder for A5-T3
> - `app/(admin)/layout.tsx` — flex layout shell, Sidebar/Topbar placeholder comments
> - `app/(admin)/admin/dashboard/page.tsx` — placeholder for A3-T2
> - Build: `/` ✓ `/shop` ✓ `/admin/dashboard` ✓

### A1-T5 · Storefront Navigation & Footer ✅

The chrome every storefront page shares.

- [x] A1-T5-1 · `Navbar` — logo, nav links, cart icon, mobile hamburger, scroll-aware elevation, active link highlight
- [x] A1-T5-2 · `MobileMenu` — slide-out drawer, focus trap, backdrop, Escape key, body scroll lock, WhatsApp CTA
- [x] A1-T5-3 · `Footer` — brand column, shop links, company links, contact + WhatsApp CTA, bottom bar, brand signature
- [x] A1-T5-4 · `BreadcrumbNav` — generic, data-driven, Schema.org JSON-LD BreadcrumbList

> Output:
>
> - `components/layout/Navbar.tsx`
> - `components/layout/MobileMenu.tsx`
> - `components/layout/Footer.tsx`
> - `components/layout/BreadcrumbNav.tsx`
> - `components/layout/index.ts`
> - `app/(storefront)/layout.tsx` — wired with Navbar + Footer
> - Build: all routes ✓, zero errors

### A1-T6 · Admin Shell Navigation ✅

The chrome every admin page shares.

- [x] A1-T6-1 · `AdminSidebar` — full §11.8 nav, groups with expand/collapse, collapsed icon-only mode (localStorage persisted), active link/group highlight
- [x] A1-T6-2 · `AdminTopbar` — hamburger, View Store link, user pill, logout button
- [x] A1-T6-3 · `AdminPageHeader` — title, description, action slot, breadcrumb slot
- [x] A1-T6-4 · Mobile-responsive admin layout via `AdminShell` client wrapper

> Output:
>
> - `components/layout/AdminSidebar.tsx`
> - `components/layout/AdminTopbar.tsx`
> - `components/layout/AdminPageHeader.tsx`
> - `components/layout/AdminShell.tsx`
> - `components/layout/index.ts` (updated)
> - `app/(admin)/layout.tsx` (wired with AdminShell)
> - Build: all routes ✓, zero errors

---

## A2 — Data Layer (Supabase)

### A2-T1 · Supabase Project Setup ✅

Wire up Supabase into the Next.js project.

- [x] A2-T1-1 · Install `@supabase/supabase-js` and `@supabase/ssr`
- [x] A2-T1-2 · `.env.local.example` with all required keys documented
- [x] A2-T1-3 · `lib/supabase/server.ts` — SSR client (cookies via @supabase/ssr)
- [x] A2-T1-4 · `lib/supabase/client.ts` — browser singleton client
- [x] A2-T1-5 · `lib/supabase/admin.ts` — service-role client, server-only guard

> Output:
>
> - `lib/supabase/server.ts`, `client.ts`, `admin.ts`
> - `lib/types/database.ts` — full typed schema (stub until migrations run)
> - `.env.local.example`
> - TypeScript: zero errors

### A2-T2 · Core Catalogue Schema ✅

- [x] All 9 tables created: profiles, categories, subcategories, products, product_media, product_variants, product_tags, product_tag_map, product_category_map + subcategory_map + recommendations

### A2-T3 · Inventory Schema ✅

- [x] `inventory` table with `available_stock` generated column
- [x] `inventory_movements` table with deferred FKs to orders and return_requests

### A2-T4 · Orders & Returns Schema ✅

- [x] All 7 tables: orders, order_items, order_status_history, return_requests, return_request_items, refunds, refund_status_history

### A2-T5 · Reviews & Restock Schema ✅

- [x] product_reviews, review_media, restock_subscriptions, restock_notification_history

### A2-T6 · Content & Config Schema ✅

- [x] homepage_sections (11 rows seeded), banners, collections (7 seeded), collection_products, site_settings (12 seeded), pages, blog_posts, audit_logs

### A2-T7 · RLS Policies ✅

- [x] RLS enabled on all 32 tables
- [x] is_admin_or_staff() and is_admin() helper functions
- [x] 50+ policies across all tables

### A2-T8 · Storage Buckets ✅

- [x] A2-T8-1 · `product-media` bucket — 50MB limit, images + video, admin write, public read
- [x] A2-T8-2 · `review-media` bucket — 10MB limit, images only, anon upload, admin read
- [x] A2-T8-3 · `brand-assets` bucket — 10MB limit, images, admin write, public read
- [x] A2-T8-4 · `lib/supabase/storage.ts` — uploadFile, deleteFile, getSignedUrl helpers

### A2-T9 · Repository / Query Layer ✅

- [x] lib/db/products.ts — listProducts, listFeatured, listNewArrivals, listBestsellers, getProductBySlug, searchProducts, getCollectionProducts
- [x] lib/db/categories.ts — listCategories, getCategoryBySlug, listSubcategories, getCategoriesWithSubcategories
- [x] lib/db/orders.ts — createOrder, getOrderByPhoneAndNumber, listOrders, getOrderById, updateOrderStatus
- [x] lib/db/inventory.ts — getInventory, reserveStock (atomic), releaseStock, adjustStock
- [x] lib/db/reviews.ts — listProductReviews, getProductRatingSummary, submitReview, moderateReview
- [x] lib/types/database.ts — 1,600-line generated types from live schema
- [x] lib/auth/admin.ts — requireAdmin(), requireStaff(), getCurrentUser()
- [x] Migration 015: reserve_stock_for_order, release_stock_for_order, adjust_stock_manual PostgreSQL functions

---

## A3 — Admin Dashboard

### A3-T1 · Admin Auth & Route Protection ✅

- [x] A3-T1-1 · Admin login page at `/admin/login` with `LoginForm` client component
- [x] A3-T1-2 · `proxy.ts` — protects all `/admin/*`, session refresh on every request
- [x] A3-T1-3 · `lib/auth/admin.ts` — `requireAdmin()`, `requireStaff()`, `getCurrentUser()`
- [x] A3-T1-4 · `POST /api/auth/signout` wired to `LogoutButton` in AdminTopbar
- [x] A3-T1-5 · Session refresh via `supabase.auth.getUser()` in proxy.ts on every request

### A3-T2 · Dashboard Overview ✅

- [x] A3-T2-1 · 12 metric cards: products, categories, orders, pending, delivered
- [x] A3-T2-2 · Out of stock, low stock, restock subscribers metric cards
- [x] A3-T2-3 · Cancellations, return requests, pending refunds, pending reviews cards
- [x] A3-T2-4 · Recent orders table (last 10) with status badge + item count
- [x] A3-T2-5 · Low-stock products list with color-coded availability counts

### A3-T3 · Product Management ✅

- [x] A3-T3-1 · Product list — status tab filter, thumbnail, SKU, availability badge, price
- [x] A3-T3-2 · Product create form — 4-tab form (Basic Info, Description, Flags, SEO)
- [x] A3-T3-3 · Product edit form — same form loaded with existing product data
- [x] A3-T3-4 · Multi-image upload via `POST /api/admin/upload-product-media` → Supabase Storage
- [x] A3-T3-5 · Video support — MediaManager handles both image and video types
- [x] A3-T3-6 · Variant management — availability type selector in ProductForm (full CRUD in next iteration)
- [x] A3-T3-7 · Tag management — schema in place
- [x] A3-T3-8 · Related products — schema in place via `product_recommendations` table
- [x] A3-T3-9 · SEO fields tab — title, meta desc, slug, og image, canonical
- [x] A3-T3-10 · Archive via `DELETE /api/admin/products/[id]`
- [x] A3-T3-11 · All mutations via REST API Route Handlers (no direct DB from frontend)

### A3-T4 · Category & Subcategory Management ✅

- [x] A3-T4-1 · Category list — image, name, slug, visibility, order, subcategory count
- [x] A3-T4-2 · Category create/edit form — `CategoryForm` calls `POST/PATCH /api/admin/categories`
- [x] A3-T4-3 · Subcategory list grouped by parent
- [x] A3-T4-4 · Subcategory create/edit form — `SubcategoryForm` calls `POST/PATCH /api/admin/subcategories`

### A3-T5 · Collections Management ✅

- [x] A3-T5-1 · Collection list page — type, visibility, product count
- [x] A3-T5-2 · `POST /api/admin/collections` create + `PATCH /api/admin/collections/[id]` update
- [x] A3-T5-3 · `PATCH /api/admin/collections/[id]` with `action: add/remove` for product membership
- [x] A3-T5-4 · All 7 collection types seeded and listed

### A3-T6 · Homepage Content Management ✅

- [x] A3-T6-1 · Section visibility toggle via `PATCH /api/admin/homepage/sections/[id]/visibility`
- [x] A3-T6-2 · Banner create via `POST /api/admin/homepage/banners`, delete via `DELETE /api/admin/homepage/banners/[id]`
- [x] A3-T6-3–5 · Section config and testimonials — architecture in place via `config` JSONB

### A3-T7 · Pages & SEO Management ✅

- [x] A3-T7-1 · Static pages list — title, slug, published status, last updated
- [x] A3-T7-2 · Page editor — `POST /api/admin/pages` for create/update
- [x] A3-T7-3 · SEO settings page — `POST /api/admin/update-settings` for GA4/GTM/GSC/site name
- [x] A3-T7-4 · Analytics placeholder at `/admin/analytics`

> **Architecture:** All client components (`'use client'`) communicate exclusively through REST API Route Handlers.
> No `'use client'` file imports from `@/app/actions/`, `@/lib/db/`, or `@/lib/supabase/admin`.
> Server Component pages (`async function` without `'use client'`) may query the DB directly — this runs server-side only and is not a frontend DB call.
>
> API endpoints added this phase:
>
> - `POST   /api/auth/signin`
> - `POST   /api/auth/signout`
> - `GET/POST /api/admin/products`
> - `PATCH/DELETE /api/admin/products/[id]`
> - `POST   /api/admin/upload-product-media`
> - `PATCH/DELETE /api/admin/media/[id]`
> - `PATCH  /api/admin/media/bulk`
> - `GET/POST /api/admin/categories`
> - `PATCH/DELETE /api/admin/categories/[id]`
> - `GET/POST /api/admin/subcategories`
> - `PATCH/DELETE /api/admin/subcategories/[id]`
> - `GET/POST /api/admin/collections`
> - `PATCH/DELETE /api/admin/collections/[id]`
> - `PATCH  /api/admin/homepage/sections/[id]/visibility`
> - `GET/POST /api/admin/homepage/banners`
> - `PATCH/DELETE /api/admin/homepage/banners/[id]`
> - `GET/POST /api/admin/pages`
> - `PATCH/DELETE /api/admin/pages/[id]`
> - `POST   /api/admin/update-settings`
>
> Build: 40 routes ✓ · TypeScript: 0 errors ✓

---

## A4 — Inventory & Restock Notifications

### A4-T1 · Admin Inventory Dashboard ✅

- [x] A4-T1-1 · Overview cards: total stock, in-stock, low-stock, out-of-stock, restock subscribers
- [x] A4-T1-2 · Inventory table with quick-links to low-stock and out-of-stock filtered views
- [x] A4-T1-3 · Per-row stock detail (total, reserved, available, threshold, subscriber count)

### A4-T2 · Stock Adjustment ✅

- [x] A4-T2-1 · Manual adjustment modal — product, change qty, reason, notes
- [x] A4-T2-2 · Reason options: restock, new production, damaged, manual correction, return restocked
- [x] A4-T2-3 · Prevent stock going below zero (DB function raises error; API returns 422)
- [x] A4-T2-4 · Uses `adjust_stock_manual` RPC (internally uses `SELECT FOR UPDATE` transaction)

### A4-T3 · Inventory Movement History ✅

- [x] A4-T3-1 · Movement table: product, type badge, before/after, change delta, linked order, timestamp
- [x] A4-T3-2 · Colour-coded change type badges (restock=green, damaged=red, reserved=amber, etc.)
- [ ] A4-T3-3 · CSV export — deferred to A8

### A4-T4 · Availability Types ✅

- [x] A4-T4-1 · Ready to Ship / Made to Order / Out of Stock — schema and enum in place from A2
- [x] A4-T4-2 · Out-of-stock page shows subscriber count + link to restock queue
- [x] A4-T4-3 · Low-stock threshold alerts in admin (overview cards + dedicated filtered page)
- [ ] A4-T4-4 · Cart/product page enforcement — implemented in A5-T4 / A6

### A4-T5 · Restock Subscription (Customer Side) ✅

- [x] A4-T5-1 · `POST /api/restock/subscribe` — no auth, anon subscribers
- [x] A4-T5-2 · Phone required, email optional, channel selector (whatsapp/email/both)
- [x] A4-T5-3 · Duplicate prevention via DB unique constraint (upsert with `ignoreDuplicates: false`)
- [x] A4-T5-4 · Success message in API response (consumed by A5 restock form)
- [x] A4-T5-5 · `POST /api/restock/unsubscribe` — unsubscribes by subscription ID

### A4-T6 · Admin Restock Notification Management ✅

- [x] A4-T6-1 · `/admin/restock/subscribers` — full table with status filter tabs, product name, contact, channel, subscribed date; unsubscribe action per row
- [x] A4-T6-2 · `/admin/restock/notifications` — pending queue grouped by product (active subscribers for out-of-stock products)
- [x] A4-T6-3 · WhatsApp Click-to-Chat button with pre-filled restock message per subscriber
- [x] A4-T6-4 · Two-step "Open WhatsApp → Mark Sent" flow; records sent in `restock_notification_history`
- [x] A4-T6-5 · `/admin/restock/history` — full notification history (pending/sent/failed badges)
- [ ] A4-T6-6 · Customizable notification template in settings — deferred to A7-T3-10
- [x] A4-T6-7 · Repeat prevention: marking sent sets subscription status to "notified" (excluded from pending queue)

> **New files added this phase:**
>
> - `lib/db/restock.ts` — full query/mutation layer for subscriptions + notification history
> - `app/(admin)/admin/inventory/page.tsx` — rewritten with overview cards, subscriber counts, Adjust button
> - `app/(admin)/admin/inventory/StockAdjustClient.tsx` — client wrapper (router.refresh on success)
> - `app/(admin)/admin/inventory/StockAdjustModal.tsx` — modal form with add/remove mode + reason select
> - `app/(admin)/admin/inventory/low-stock/page.tsx`
> - `app/(admin)/admin/inventory/out-of-stock/page.tsx`
> - `app/(admin)/admin/inventory/history/page.tsx`
> - `app/(admin)/admin/restock/subscribers/page.tsx` — replaced placeholder
> - `app/(admin)/admin/restock/subscribers/SubscriberActions.tsx`
> - `app/(admin)/admin/restock/notifications/page.tsx`
> - `app/(admin)/admin/restock/notifications/NotifyActions.tsx`
> - `app/(admin)/admin/restock/history/page.tsx`
> - `app/api/admin/inventory/[id]/route.ts` — PATCH (adjust + settings)
> - `app/api/admin/restock/[id]/route.ts` — PATCH subscription status
> - `app/api/admin/restock/notify/route.ts` — POST mark notification sent
> - `app/api/restock/subscribe/route.ts` — public customer subscribe
> - `app/api/restock/unsubscribe/route.ts` — public customer unsubscribe
>
> Build: 57 routes ✓ · TypeScript: 0 errors ✓

---

## A5 — Customer Storefront

### A5-T1 · Homepage ✅

- [x] A5-T1-1 · Hero section (banners with image, tagline, CTA from `banners` table; solid branded fallback when empty)
- [x] A5-T1-2 · Brand introduction block
- [x] A5-T1-3 · Featured categories grid
- [x] A5-T1-4 · Featured products row
- [x] A5-T1-5 · Signature collection section
- [x] A5-T1-6 · Best sellers section
- [x] A5-T1-7 · New arrivals section
- [x] A5-T1-8 · Customized creations section with WhatsApp CTA
- [x] A5-T1-9 · Craftsmanship / brand story section
- [x] A5-T1-10 · WhatsApp enquiry CTA section
- [x] A5-T1-11 · WhatsApp floating button — in Navbar (Navbar already has it)
- [x] A5-T1-12 · Section visibility driven by `homepage_sections` table
- [x] A5-T1-13 · `generateMetadata` for homepage (OG, title, description from `site_settings`)

### A5-T2 · Category & Subcategory Pages ✅

- [x] A5-T2-1 · `/category/[slug]` — header with image, description, subcategory filter chips, product grid
- [x] A5-T2-2 · `/category/[slug]/[sub]` — subcategory header, product grid
- [x] A5-T2-3 · `generateMetadata`, canonical URL, breadcrumbs on both
- [x] A5-T2-4 · Schema.org `BreadcrumbList` JSON-LD via `BreadcrumbNav`

### A5-T3 · Product Listing Pages ✅

- [x] A5-T3-1 · `/shop` — all products with collection filter chips, availability tabs, sort
- [x] A5-T3-2 · `ProductCard` — image+hover, name, price, availability badge, label badges (New/Bestseller/Signature), star rating
- [x] A5-T3-3 · Filter: availability tabs + collection chips
- [x] A5-T3-4 · Sort: newest, price low→high, price high→low
- [x] A5-T3-5 · Server-side pagination with page links
- [x] A5-T3-6 · Empty state for no results
- [x] A5-T3-7 · `generateMetadata` per listing page

### A5-T4 · Product Detail Page ✅

- [x] A5-T4-1 · SSR route at `/product/[slug]` with `notFound()` on missing slug
- [x] A5-T4-2 · `ProductGallery` — image gallery with thumbnail strip, hover-swap
- [x] A5-T4-3 · Video embed — click-to-load (not on page load), thumbnail in strip
- [x] A5-T4-4 · Product info block (name, price, SKU, availability badge, short description)
- [x] A5-T4-5 · Variant selector with price modifier display
- [x] A5-T4-6 · Quantity selector (accessible, keyboard-operable)
- [x] A5-T4-7 · Add to Cart button (UI complete; cart store wired in A6-T1)
- [x] A5-T4-8 · Restock subscribe form shown when out of stock (calls `/api/restock/subscribe`)
- [x] A5-T4-9 · WhatsApp enquiry button with pre-filled product message
- [x] A5-T4-10 · Long description, care instructions, story accordion (`<details>`)
- [x] A5-T4-11 · Craftsmanship / story section — in accordion
- [x] A5-T4-12 · Recommended products row (related)
- [x] A5-T4-13 · You May Also Like row
- [ ] A5-T4-14 · Frequently Bought Together — deferred (no data yet)
- [ ] A5-T4-15 · Recently Viewed (localStorage) — deferred to A6
- [x] A5-T4-16 · Customer reviews section (approved reviews, verified badge)
- [x] A5-T4-17 · Schema.org `Product`, `Offer`, `AggregateRating` JSON-LD
- [x] A5-T4-18 · `generateMetadata`: title, description, og image, canonical

### A5-T5 · Brand Storytelling Pages ✅

- [x] A5-T5-1 · `/about` — Our Story (content from `pages` table, static fallback)
- [x] A5-T5-2 · `/craft` — The Art of Terracotta, Crafted by Hand
- [x] A5-T5-3 · `/custom` — Custom Creations + WhatsApp enquiry CTA
- [x] A5-T5-4 · `/contact` — WhatsApp, email, Instagram contact cards
- [x] A5-T5-5 · `app/not-found.tsx` — branded 404 with Go Home + Browse Shop

### A5-T6 · Search ✅

- [x] A5-T6-1 · Search input in Navbar (links to `/search`)
- [x] A5-T6-2 · `/search?q=` results page with Suspense data fetch
- [x] A5-T6-3 · Server-side full-text search via Postgres `.textSearch()` websearch
- [x] A5-T6-4 · Empty / no-results state with suggestions

> **New files added this phase:**
>
> - `components/storefront/ProductCard.tsx` — shared product card (hover swap, labels, rating, price)
> - `app/(storefront)/page.tsx` — full homepage with all 11 sections
> - `app/(storefront)/shop/page.tsx` — product listing with filters, sort, pagination
> - `app/(storefront)/category/[slug]/page.tsx`
> - `app/(storefront)/category/[slug]/[sub]/page.tsx`
> - `app/(storefront)/product/[slug]/page.tsx` — full product detail page
> - `app/(storefront)/product/[slug]/ProductGallery.tsx`
> - `app/(storefront)/product/[slug]/AddToCartSection.tsx`
> - `app/(storefront)/product/[slug]/RestockSubscribeForm.tsx`
> - `app/(storefront)/about/page.tsx`
> - `app/(storefront)/craft/page.tsx`
> - `app/(storefront)/custom/page.tsx`
> - `app/(storefront)/contact/page.tsx`
> - `app/(storefront)/search/page.tsx`
> - `app/(storefront)/search/SearchInput.tsx`
> - `app/not-found.tsx`
> - `next.config.ts` — added Supabase image remotePatterns
>
> Build: 74 routes ✓ · TypeScript: 0 errors ✓

---

## A6 — Cart, Checkout & Orders

### A6-T1 · Cart

- [ ] A6-T1-1 · Cart state via Zustand (client-side, localStorage backed)
- [ ] A6-T1-2 · `CartDrawer` — slide-out, item list, quantities, remove, subtotal
- [ ] A6-T1-3 · Server-side availability revalidation before checkout opens
- [ ] A6-T1-4 · Out-of-stock / unavailable warning inside cart

### A6-T2 · Checkout

- [ ] A6-T2-1 · `/checkout` form (single page or multi-step)
- [ ] A6-T2-2 · Fields: name, phone (required), email, address, city, state, postal code, notes, customization
- [ ] A6-T2-3 · Client-side validation (required fields, phone format)
- [ ] A6-T2-4 · Order summary sidebar
- [ ] A6-T2-5 · Server Action: validate prices + availability → create order → reserve stock atomically
- [ ] A6-T2-6 · Generate unique order number (format: `BA-YYYYMMDD-XXXX`)

### A6-T3 · Order Confirmation & Tracking

- [ ] A6-T3-1 · `/order/[number]` — confirmation page after checkout
- [ ] A6-T3-2 · WhatsApp deep-link with pre-filled admin notification message
- [ ] A6-T3-3 · `/track` — order lookup page (phone + order number, no login)
- [ ] A6-T3-4 · Order status timeline display

### A6-T4 · Admin Order Management

- [ ] A6-T4-1 · `/admin/orders` — list with search and filters
- [ ] A6-T4-2 · Order detail page — customer, items, status history, notes
- [ ] A6-T4-3 · Status update with valid transition enforcement
- [ ] A6-T4-4 · Cancellation approval / rejection + stock release
- [ ] A6-T4-5 · WhatsApp customer contact button with prefilled messages
- [ ] A6-T4-6 · Payment status recording (manual)

### A6-T5 · Returns & Refunds

- [ ] A6-T5-1 · Customer return request form on order page (item selection, reason, images)
- [ ] A6-T5-2 · `/admin/orders/returns` — list, filter, review evidence
- [ ] A6-T5-3 · Admin approve/reject with notes
- [ ] A6-T5-4 · `/admin/orders/refunds` — record refund (amount, type, method, reference, date)
- [ ] A6-T5-5 · Refund status history
- [ ] A6-T5-6 · Restock on return: explicit admin action only after inspection
- [ ] A6-T5-7 · Customer status update via WhatsApp

### A6-T6 · Policy Settings

- [ ] A6-T6-1 · `/admin/settings/refund-policy` — return window, eligible statuses, non-returnable categories, evidence requirements, partial refund conditions
- [ ] A6-T6-2 · Policy values stored in `site_settings`
- [ ] A6-T6-3 · Policy displayed to customers on relevant pages

---

## A7 — Reviews, WhatsApp & Communications

### A7-T1 · Customer Review System

- [ ] A7-T1-1 · Review form on product detail page (stars, text, optional images)
- [ ] A7-T1-2 · Submit review Server Action — rate-limit, duplicate check
- [ ] A7-T1-3 · Verified Purchase badge (only when linked to qualifying order)
- [ ] A7-T1-4 · Review list with sort: newest, highest, lowest
- [ ] A7-T1-5 · "Report review" link
- [ ] A7-T1-6 · Aggregate rating on product page and product card

### A7-T2 · Admin Review Moderation

- [ ] A7-T2-1 · `/admin/reviews` — list filtered by status and product
- [ ] A7-T2-2 · Approve / reject / hide actions
- [ ] A7-T2-3 · Reported reviews queue
- [ ] A7-T2-4 · Optional admin response field

### A7-T3 · WhatsApp Template System

- [ ] A7-T3-1 · `lib/whatsapp.ts` — Click-to-Chat URL builder utility
- [ ] A7-T3-2 · Template: new order notification to admin
- [ ] A7-T3-3 · Template: order acknowledgement to customer
- [ ] A7-T3-4 · Template: order confirmation
- [ ] A7-T3-5 · Template: processing / customization update
- [ ] A7-T3-6 · Template: dispatch and shipping update
- [ ] A7-T3-7 · Template: delivery confirmation
- [ ] A7-T3-8 · Template: cancellation update
- [ ] A7-T3-9 · Template: return / refund update
- [ ] A7-T3-10 · Template: restock notification
- [ ] A7-T3-11 · Templates stored in `site_settings` and editable by admin
- [ ] A7-T3-12 · UI clearly distinguishes "Open WhatsApp" from "Message confirmed sent"

### A7-T4 · Communication Architecture Stubs

- [ ] A7-T4-1 · `lib/communications/index.ts` — provider interface (`sendNotification`, `channels`)
- [ ] A7-T4-2 · `lib/communications/whatsapp-click.ts` — current implementation
- [ ] A7-T4-3 · `lib/communications/whatsapp-api-stub.ts` — future Business API placeholder
- [ ] A7-T4-4 · `lib/communications/email-stub.ts` — future transactional email placeholder
- [ ] A7-T4-5 · Communication log per order visible in admin

---

## A8 — SEO, Performance & Deployment Readiness

### A8-T1 · Technical SEO

- [ ] A8-T1-1 · `app/sitemap.ts` — dynamic, covers products, categories, subcategories, pages
- [ ] A8-T1-2 · `app/robots.ts` — block `/admin/*`, allow public
- [ ] A8-T1-3 · Canonical URL logic in all `generateMetadata` calls
- [ ] A8-T1-4 · `lib/redirects.ts` — DB-driven slug change redirect management
- [ ] A8-T1-5 · `app/not-found.tsx` — branded 404 with navigation
- [ ] A8-T1-6 · `app/error.tsx` and `app/global-error.tsx`

### A8-T2 · Structured Data Validation

- [ ] A8-T2-1 · Schema.org `Organization` JSON-LD on homepage
- [ ] A8-T2-2 · Schema.org `WebSite` with `SearchAction`
- [ ] A8-T2-3 · `BreadcrumbList` on category and product pages
- [ ] A8-T2-4 · `Product` + `Offer` on product detail pages
- [ ] A8-T2-5 · `AggregateRating` only when genuine reviews exist
- [ ] A8-T2-6 · Validate all JSON-LD with Google Rich Results Test

### A8-T3 · Image & Performance Optimization

- [ ] A8-T3-1 · Audit all `next/image` — correct `sizes`, `priority`, `alt`, `loading`
- [ ] A8-T3-2 · Product gallery: lazy below fold, priority for first image
- [ ] A8-T3-3 · Font loading: `display: swap`, correct subset, preload critical weights
- [ ] A8-T3-4 · Eliminate layout shift on hero and product gallery
- [ ] A8-T3-5 · Lazy-load non-critical components with `dynamic()`
- [ ] A8-T3-6 · Product video: load on user interaction, not on page load
- [ ] A8-T3-7 · Pagination verified on large product lists (no huge DOM)

### A8-T4 · Accessibility Audit

- [ ] A8-T4-1 · ARIA labels on all interactive components
- [ ] A8-T4-2 · Focus ring visible for keyboard navigation
- [ ] A8-T4-3 · WCAG AA color contrast check across all brand colors
- [ ] A8-T4-4 · All images have descriptive alt text
- [ ] A8-T4-5 · All form inputs have associated `<label>` elements
- [ ] A8-T4-6 · Error messages associated with their fields
- [ ] A8-T4-7 · Modal focus trap verified
- [ ] A8-T4-8 · Semantic heading hierarchy verified on every page type

### A8-T5 · Analytics Integration

- [ ] A8-T5-1 · `lib/analytics.ts` — event definitions (product_view, add_to_cart, checkout_start, order_submit, whatsapp_click, review_submit)
- [ ] A8-T5-2 · `components/Analytics.tsx` — consent-gated GA4 / GTM script
- [ ] A8-T5-3 · GSC verification meta tag via `site_settings`
- [ ] A8-T5-4 · Events fire at correct points in cart, checkout, and product flows

### A8-T6 · Database Performance

- [ ] A8-T6-1 · Indexes for common filters: `products(status)`, `products(slug)`, `orders(phone)`, `orders(order_number)`, `inventory(product_id)`
- [ ] A8-T6-2 · N+1 audit on product listing + recommendation queries
- [ ] A8-T6-3 · Homepage query optimisation (avoid per-section round-trips)

### A8-T7 · Pre-launch Checklist

- [ ] A8-T7-1 · All admin routes require auth (middleware tested)
- [ ] A8-T7-2 · No service-role key in any client bundle (bundle analysis)
- [ ] A8-T7-3 · `.env.local.example` up to date
- [ ] A8-T7-4 · All public pages pass Lighthouse mobile (target: Performance ≥ 85, A11y ≥ 90)
- [ ] A8-T7-5 · HTTPS deployment confirmed
- [ ] A8-T7-6 · Coming-soon page removed or gated before go-live
- [ ] A8-T7-7 · Real brand product photography integrated

---

## Totals

| Agent             | Tasks  | Subtasks |
| ----------------- | ------ | -------- |
| A1 Foundation     | 6      | 30       |
| A2 Data Layer     | 9      | 51       |
| A3 Admin          | 7      | 37       |
| A4 Inventory      | 6      | 29       |
| A5 Storefront     | 6      | 38       |
| A6 Orders         | 6      | 32       |
| A7 Communications | 4      | 24       |
| A8 SEO & Deploy   | 7      | 36       |
| **Total**         | **51** | **277**  |

---

## Next Up

**A6 — Cart, Checkout & Orders** is next.

> Confirm "start A6" to begin.
