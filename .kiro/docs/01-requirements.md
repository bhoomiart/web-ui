# Bhoomi Art — Requirements

> What the product must do.
> Source: `Bhoomi-Art-Project-Requirements.md` (project root).
> This doc distils the requirements into a checklist format for tracking.

---

## Storefront — What customers can do

### Browse & Discover
- [ ] View homepage with hero, brand intro, featured categories, featured products, collections, bestsellers, new arrivals, craftsmanship story, testimonials
- [ ] Browse categories and subcategories with images and descriptions
- [ ] Filter and sort product listings by category, price, availability, tags
- [ ] Search products
- [ ] View SEO-friendly, clean URLs for all pages

### Product Detail
- [ ] See multiple high-resolution images with gallery and zoom
- [ ] Watch product videos
- [ ] Read short description, long description, specifications, dimensions, materials, care instructions
- [ ] Choose variants (color, size, finish)
- [ ] See availability status (Ready to Ship / Made to Order / Out of Stock)
- [ ] See price, SKU, estimated preparation time where applicable
- [ ] Read craftsmanship / story section per product
- [ ] See recommended products, "you may also like", frequently bought together
- [ ] See recently viewed products (browser session, no account needed)
- [ ] Read and sort customer reviews
- [ ] Send a WhatsApp enquiry directly from the product page

### Cart & Checkout
- [ ] Add/remove products, change quantities, select variants
- [ ] Cart persists during browsing
- [ ] Stock revalidated before order submission
- [ ] Checkout without creating an account
- [ ] Provide name, phone (required), email (optional), address, notes, customization details
- [ ] Receive a unique order ID after placing an order
- [ ] See an order acknowledgement page with a WhatsApp link to notify admin

### Order Tracking
- [ ] Look up order status using phone number + order number (no login required)
- [ ] See order status timeline

### Out-of-Stock Products
- [ ] Product remains visible when out of stock
- [ ] "Notify Me When Available" subscription form (phone required, email optional)
- [ ] Receive WhatsApp notification when product is back in stock
- [ ] Unsubscribe option

### Returns & Refunds
- [ ] Submit return request from order page (item selection, reason, images)
- [ ] Check return/refund status

### Reviews
- [ ] Submit a 1–5 star review with text and optional images
- [ ] See "Verified Purchase" badge on eligible reviews
- [ ] Sort reviews (newest, highest, lowest rated)
- [ ] Report an inappropriate review

---

## Admin Dashboard — What staff can do

### Auth & Access
- [ ] Log in securely (Supabase Auth)
- [ ] All admin routes protected — unauthorized users redirected
- [ ] Role-based access: Admin vs Staff
- [ ] Server-side authorization on all privileged operations

### Dashboard Overview
- [ ] See totals: products, categories, orders, inventory health, reviews, restock subscribers
- [ ] See pending items: orders, cancellations, return requests, refunds, notifications

### Product Management
- [ ] Create, edit, archive, delete products
- [ ] Upload multiple images and videos per product
- [ ] Manage variants, tags, specifications, dimensions, materials
- [ ] Set availability type (Ready to Ship / Made to Order / Out of Stock)
- [ ] Mark as featured, signature, bestseller, new arrival
- [ ] Set related / recommended products
- [ ] Edit SEO fields per product (title, meta desc, slug, og image, canonical)

### Category Management
- [ ] Create, edit, archive categories and subcategories
- [ ] Upload category images
- [ ] Set display order and visibility
- [ ] Edit SEO fields per category

### Collections & Homepage
- [ ] Create and manage collections (Signature, Bestsellers, New Arrivals, Featured, Trending, Customized, Special)
- [ ] Control homepage section visibility and order
- [ ] Manage banners, testimonials, brand story content

### Inventory
- [ ] View stock overview: total, in-stock, low-stock, out-of-stock, recently restocked
- [ ] Adjust stock manually with mandatory reason
- [ ] View full inventory movement history
- [ ] Set low-stock thresholds
- [ ] Configure tracking on/off per product

### Restock Notifications
- [ ] View products with subscribers and subscriber counts
- [ ] Trigger manual WhatsApp Click-to-Chat notifications
- [ ] View notification history (pending, attempted, success, failed)
- [ ] Customize notification message templates

### Orders
- [ ] List and search orders (by order ID, name, phone)
- [ ] View full order detail (customer info, items, status history)
- [ ] Update order status (valid transitions only)
- [ ] Approve or reject cancellation requests
- [ ] Contact customer via WhatsApp with prefilled messages
- [ ] Record payment status manually

### Returns & Refunds
- [ ] Review return requests with uploaded evidence
- [ ] Approve or reject returns with notes
- [ ] Record refund details (amount, full/partial, method, reference, date)
- [ ] View refund status history
- [ ] Restock returned products (manual, after inspection)

### Reviews
- [ ] View and moderate reviews (approve, reject, hide)
- [ ] Review reported content
- [ ] Optionally respond to reviews

### SEO & Content
- [ ] Edit static pages (About, Craft, FAQs, Contact, Policies)
- [ ] Manage global SEO settings (site name, default OG image, GA4 ID)
- [ ] View blog post stubs (future phase)

### Settings
- [ ] Configure refund/return policy rules
- [ ] Edit WhatsApp notification templates
- [ ] Google Search Console verification tag

---

## Non-Functional Requirements

### SEO
- [ ] SSR or SSG on all public pages (not client-side only)
- [ ] Unique title + meta description per page
- [ ] Canonical URLs on every page
- [ ] Open Graph metadata
- [ ] XML sitemap (dynamic, auto-updated)
- [ ] robots.txt (block /admin/*, allow public)
- [ ] Schema.org JSON-LD: Organization, WebSite, BreadcrumbList, Product, Offer, AggregateRating (only with real data)
- [ ] Descriptive image alt text everywhere
- [ ] Breadcrumb navigation on categories and product pages

### Performance
- [ ] Optimized images (next/image, modern formats, correct sizes)
- [ ] Lazy loading for below-fold content
- [ ] No layout shift on hero and product gallery
- [ ] Paginated product lists
- [ ] Product videos load on interaction only
- [ ] Database queries indexed for common filters

### Accessibility
- [ ] Semantic HTML throughout
- [ ] ARIA labels on interactive components
- [ ] Keyboard navigation works everywhere
- [ ] WCAG AA color contrast
- [ ] All form inputs labeled
- [ ] Error messages associated with their fields

### Security
- [ ] RLS on all Supabase tables
- [ ] No service-role key in client bundle
- [ ] Admin routes protected by middleware (not just hidden UI)
- [ ] Order lookup requires phone + order number (not just order ID)
- [ ] All untrusted inputs validated server-side
- [ ] Audit log for sensitive admin actions

### Reliability
- [ ] Stock reservation is atomic (no overselling)
- [ ] Order creation does not depend on WhatsApp message being sent
- [ ] No duplicate orders, no duplicate restock notifications
- [ ] Loading, empty, error, and success states on all UI

---

## Out of Scope (This Release)

- Online payment processing
- Automated WhatsApp Business Cloud API messaging
- Automated transactional email
- Customer accounts and loyalty programs
- Discount / coupon engine
- Shipping provider integrations
- Advanced recommendation algorithms

These must remain possible to add later — no architecture decisions that block them.
