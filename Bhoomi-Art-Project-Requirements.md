# Bhoomi Art --- E-commerce Website & Admin Dashboard

**Brand:** Bhoomi Art\
**Tagline:** Beauty of Mother Earth\
**Brand signature:** Rooted in Earth · Shaped by Hand · Born with Love

> We are crafting something beautiful from the earth. Our website is on
> its way --- stay tuned for unique, customized terracotta pieces shaped
> with love and tradition.

---

## 1. Project Overview

Transform the existing repository into a polished, responsive e-commerce
website for **Bhoomi Art**, a handcrafted terracotta products business.

The project has two main interfaces:

1.  **Customer storefront:** Customers discover products, explore
    collections, read product details and reviews, add items to a cart,
    and place orders.
2.  **Admin dashboard:** Authorized administrators manage products,
    categories, media, inventory, orders, returns, refunds, reviews,
    homepage content, and SEO.

Use **Supabase** for PostgreSQL, authentication, and media storage,
subject to the architecture review. WhatsApp is the primary
communication channel for order-related communication.

**No online payment gateway is required for the initial release.** Keep
the architecture extensible for future payment integration.

## 2. Mandatory First Step: Repository Analysis

Before implementation:

- Inspect the repository structure, framework, language, build tools,
  dependencies, and architecture.
- Review existing pages, components, styles, assets, routes, and
  functionality.
- Identify reusable components and existing design conventions.
- Identify technical debt, gaps, risks, and constraints.
- Recommend an architecture that fits the existing project rather than
  replacing it unnecessarily.

### Do not make changes during the initial analysis

Until the first implementation task is explicitly approved:

- Do not modify files.
- Do not install or update dependencies.
- Do not create or modify database tables.
- Do not run migrations.
- Do not change configuration.
- Do not begin implementation.

The first deliverable is an analysis and task-by-task implementation
proposal.

## 3. Brand Identity and Experience

### Brand positioning

Bhoomi Art is a terracotta brand focused on handcrafted, traditional,
artistic, and customized products. The website should feel like a
premium handcrafted art and lifestyle brand, not a generic online shop.

Communicate:

- The beauty and authenticity of natural clay.
- Traditional craftsmanship and handmade artistry.
- Earth-inspired design and materials.
- Customization and personalization.
- The cultural and artistic value of terracotta.
- The individuality of handcrafted products.

### Brand language

Use the following consistently where appropriate:

- **Bhoomi Art**
- **Beauty of Mother Earth**
- **Rooted in Earth · Shaped by Hand · Born with Love**

Use the supplied brand introduction in suitable places, including the
homepage, About page, and launch/coming-soon messaging.

### Visual direction

Aim for an elegant, warm, natural, premium, artistic, and visually
engaging design.

Suggested starting palette (refine to work with existing logo and brand
assets):

Color Suggested value

---

Terracotta `#B65E3C`
Clay Brown `#80513B`
Sand Beige `#E9DCC8`
Warm Ivory `#FAF7F0`
Earthy Green `#68765A`
Deep Charcoal `#302923`

Design characteristics:

- Editorial-style layouts and strong visual hierarchy.
- Large, high-quality product photography.
- Natural textures used subtly.
- Elegant, readable typography.
- Thoughtful whitespace.
- Consistent spacing and components.
- Smooth, restrained transitions and animations.
- Excellent mobile and tablet layouts.
- Clear navigation and accessible interactions.

Avoid generic e-commerce templates, overcrowded layouts, excessive
gradients, unnecessary animations, and decorative effects that compete
with product photography.

### Brand storytelling

Include content sections such as:

- Our Story.
- The Art of Terracotta.
- Crafted by Hand.
- Inspired by Mother Earth.
- Custom Creations.
- Our Craftsmanship.

Product presentation should tell the story of the material, craft, use,
and uniqueness---not merely show a name and price.

## 4. Customer Storefront

Build a responsive, accessible customer-facing website.

### 4.1 Homepage

Potential sections:

- Hero area with strong brand imagery and clear calls to action.
- Brand introduction and tagline.
- Featured categories.
- Featured products.
- Signature collection.
- Best sellers / most-sold items.
- New arrivals.
- Popular collections.
- Customized and made-to-order creations.
- Craftsmanship and brand story.
- Customer testimonials and reviews.
- Social media gallery (optional).
- WhatsApp enquiry/contact option.
- Newsletter subscription (optional).
- Footer with contact details, policies, and navigation.

Administrators should be able to manage homepage content, visibility,
and section order through the dashboard.

### 4.2 Categories and subcategories

Customers should be able to:

- Browse active categories and subcategories.
- View category and subcategory images and descriptions.
- Navigate between parent categories, subcategories, and products.
- View products within a category.
- Search, filter, and sort product listings.
- Access clean, descriptive, SEO-friendly URLs.

### 4.3 Product listing pages

Product cards/listings may include:

- Product image and name.
- Short description.
- Price, when applicable.
- Availability label.
- Rating and review count, when genuine reviews exist.
- Featured, signature, best-seller, or new-arrival labels.
- Quick view, where appropriate.
- Add-to-cart action when orderable.
- Sorting and filtering.

### 4.4 Product detail pages

Product detail pages are a high-priority part of the storefront.

Product information should support:

- Product name and slug.
- Multiple high-resolution images.
- Product videos.
- Image gallery and zoom.
- Short and detailed descriptions.
- Product specifications.
- Dimensions and weight.
- Material and finish information.
- Available colors and variants.
- Customization options.
- Price, where applicable.
- SKU, where applicable.
- Availability and stock status.
- Estimated preparation and delivery time, where known.
- Care and maintenance instructions.
- Craftsmanship/story content.
- Add to cart and order actions when available.
- WhatsApp enquiry/customization enquiry.

Additional product page sections:

1.  **Recommended products:** Relevant products based on category, tags,
    attributes, and admin-defined relationships.
2.  **You may also like:** Related or complementary items.
3.  **Frequently bought together:** Complementary products, based on
    reliable sales data or admin curation.
4.  **Recently viewed:** Products viewed during the current browsing
    experience. Initially, this can use browser local storage without
    requiring an account.
5.  **Customer reviews and ratings:** Genuine customer feedback.
6.  **Questions and answers:** Optional future feature.
7.  **Related categories and collections.**

Do not show random or misleading recommendations. If there is
insufficient data, use relevant category/tag matches or admin-curated
products.

### 4.5 Product collections

Support configurable collections such as:

- Signature Items.
- Best Sellers / Most Sold.
- Featured Products.
- New Arrivals.
- Trending Products.
- Customized Creations.
- Special Collections.

Administrators should control collection membership and ordering.

## 5. Product Availability and Inventory

Inventory and availability must be integrated with products, variants,
cart, checkout, and order processing.

### 5.1 Availability types

Support at least these three business availability modes:

---

Availability type Expected behavior

---

Ready to Ship Track physical stock and allow
ordering within available quantity.

Made to Order Accept orders for production after
purchase; support preparation-time
information and configurable
capacity/availability rules.

Temporarily Out of Stock Keep the product visible and offer
a back-in-stock notification
subscription.
-----------------------------------------------------------------------

The admin should be able to choose the availability mode per product
and, where relevant, per variant.

### 5.2 Inventory tracking

Administrators should be able to:

- Set initial stock quantities.
- Increase or decrease stock manually.
- View current, reserved, and available stock.
- Set low-stock thresholds.
- Mark products as in stock, low stock, or out of stock based on
  configured rules.
- Enable or disable stock tracking for selected products.
- Track stock separately for variants where applicable.
- Record a reason for every manual stock adjustment.

Suggested inventory concepts:

- Total stock.
- Reserved stock.
- Available stock.
- Low-stock threshold.

For tracked inventory:

**Available stock = Total stock − Reserved stock**

Confirm the precise stock accounting model during architecture design so
that reservations, fulfilment, cancellations, and returns cannot
double-count stock.

### 5.3 Inventory dashboard

Provide an admin inventory area showing:

- Products with stock tracking enabled.
- Total stock quantity.
- In-stock products.
- Low-stock products.
- Out-of-stock products.
- Recently restocked products.
- Inventory movement history.

Allow filtering by stock status, category, subcategory, product, and
quantity.

### 5.4 Inventory movement history

Record:

- Product and variant.
- Previous and new quantity.
- Quantity added or removed.
- Change type and reason.
- Timestamp.
- Admin or system actor.
- Related order or return, where applicable.

Possible reasons include new production, restocking, damaged goods,
manual correction, order reservation/release, fulfilment, and accepted
return.

Never silently overwrite stock changes without an auditable movement
record.

### 5.5 Safe stock updates

Prevent overselling using transactional database operations and
concurrency-safe stock validation.

A proposed workflow:

1.  Customer submits an order.
2.  The system validates current availability.
3.  Stock is reserved atomically as part of order creation.
4.  If order creation fails, no partial reservation should remain.
5.  On cancellation, release the reservation according to the approved
    cancellation rules.
6.  On fulfilment, convert the reservation into a stock deduction
    according to the chosen inventory model.
7.  Accepted returned products are restocked only after inspection and
    an explicit admin action.

Do not allow tracked stock to become negative. Define reservation expiry
and abandoned checkout behavior during implementation planning.

Made-to-order products may need a separate production-capacity or
lead-time model rather than ordinary ready-stock deductions.

## 6. Back-in-Stock Notifications

Out-of-stock products must remain visible on the storefront.

### 6.1 Customer experience

When a product is unavailable:

- Display a clear "Out of Stock" label.
- Disable normal add-to-cart/order actions when ordering is not
  allowed.
- Show a "Notify Me When Available" option.
- Allow customers to subscribe without creating an account.
- Require a phone number for WhatsApp notifications.
- Allow email as an optional or separately selected channel.
- Confirm successful subscription.
- Provide a way to unsubscribe.

Suggested message:

> Currently unavailable, but don't miss out! Leave your contact details
> and we'll notify you when this beautiful creation is back in stock.

Collect only the information needed for the chosen notification channel:

- Phone number, if WhatsApp is selected.
- Email address, if email is selected.
- Product and variant, where applicable.
- Notification preference.
- Subscription status and timestamp.
- Consent/opt-in record.

Prevent duplicate active subscriptions for the same product/variant and
contact channel.

### 6.2 Restock notification workflow

When stock changes from unavailable to available:

1.  Detect the restock event.
2.  Find eligible subscribers for the product/variant.
3.  Create a notification event or queue entry.
4.  Prepare notifications for the selected channel.
5.  Send automatically only when the relevant provider integration is
    configured and authorized.
6.  Otherwise expose a manual admin notification workflow.
7.  Record attempts and provider results.
8.  Mark the subscription as notified only when the configured workflow
    has reached its defined success state.
9.  Avoid repeated notifications for the same restock event.

For the initial release, support an admin notification queue and manual
WhatsApp Click-to-Chat messages with prefilled content. Prepare for
future WhatsApp Business Cloud API and transactional email provider
integrations.

Do not claim that a WhatsApp message was delivered or read merely
because a link was opened.

Suggested message:

> Good news from Bhoomi Art!\
> The terracotta creation you were interested in is back in stock.\
> Discover our handcrafted collection, rooted in earth and shaped by
> hand.\
> View your product: \[Product Link\]
>
> Bhoomi Art -- Beauty of Mother Earth\
> Rooted in Earth · Shaped by Hand · Born with Love

Allow administrators to customize notification templates.

### 6.3 Admin restock management

Show:

- Products with subscribers.
- Number of customers waiting for each product.
- Subscriber details, visible only to authorized staff.
- Subscription date and selected channel.
- Pending, attempted, successful, and failed notification records.
- Notification history.

Allow authorized admins to trigger, retry, and review notifications.
Avoid repeated sends for the same restock event.

## 7. Customer Cart and Ordering

Customers should be able to place orders without creating an account.

### 7.1 Cart

Support:

- Add/remove products.
- Change quantities.
- Select variants.
- Validate stock and availability.
- Display item prices and totals where applicable.
- Preserve cart state during browsing.
- Revalidate availability before order submission.

### 7.2 Checkout information

Collect:

- Customer name (required).
- Phone number (required for the WhatsApp-first workflow).
- Email address (optional, but recommended).
- Delivery address when physical delivery is required.
- City, state, and postal code as applicable.
- Additional notes.
- Customization requirements, if applicable.

Require at least one usable contact channel. The initial business
workflow should require a phone number for WhatsApp communication.

### 7.3 Order workflow

1.  Customer browses products and adds items to cart.
2.  Customer reviews the cart.
3.  Customer enters contact and delivery details.
4.  Server validates product prices, availability, and quantities.
5.  The system creates the order and reserves tracked stock safely.
6.  A unique order ID is generated.
7.  Order details are stored in Supabase before opening WhatsApp.
8.  The customer is shown an order acknowledgement.
9.  Admin can receive order details through WhatsApp.
10. Customer can be contacted with relevant order updates.

Orders must never depend on a customer successfully sending a WhatsApp
message. Database order creation is the source of truth.

## 8. Order Status, Cancellation, Returns, and Refunds

Build a structured order lifecycle with validated transitions and an
audit trail.

### 8.1 Order statuses

Support the relevant statuses:

- Pending.
- Order Confirmed.
- Processing.
- Customization in Progress.
- Ready for Dispatch.
- Shipped.
- Delivered.
- Cancellation Requested.
- Cancelled.
- Return Requested.
- Return Approved.
- Return Rejected.
- Return In Transit.
- Returned.
- Refund Requested.
- Refund Under Review.
- Refund Approved.
- Refund Processing.
- Partially Refunded.
- Refunded.
- Refund Rejected.

Do not treat all of these as interchangeable order states. During
design, model order fulfilment, cancellation/return cases, and
refund/payment state separately where that creates a clearer and more
reliable workflow. Enforce valid transitions.

### 8.2 Cancellation

Support:

- Customer cancellation request.
- Cancellation reason.
- Request timestamp.
- Admin approval or rejection.
- Admin notes.
- Stock reservation release where appropriate.
- Customer notification.

Cancellation eligibility should depend on configurable business policy
and the current production/fulfilment stage.

### 8.3 Returns and refunds

Customer workflow:

- Select an order and relevant items.
- Choose a return/refund reason.
- Add a description.
- Upload supporting images when required.
- Submit the request.
- View request status.
- Receive updates through the configured communication channel.

Admin workflow:

- View and review requests.
- Inspect reasons and uploaded evidence.
- Approve or reject requests.
- Record refund amount and whether it is partial or full.
- Record refund method.
- Record transaction/reference ID when applicable.
- Record processing date.
- Add internal notes.
- Update status and communicate with the customer.

### 8.4 Configurable refund policy

Allow authorized administrators to configure business rules such as:

- Return eligibility period.
- Eligible order and fulfilment statuses.
- Non-returnable products or categories.
- Custom-made product restrictions.
- Damaged-product claim requirements.
- Required evidence/images.
- Refund processing timelines.
- Cancellation rules.
- Partial refund conditions.

These are configurable policy settings, not assumptions about Bhoomi
Art's actual policy. The business must approve the final customer-facing
policy before launch.

Maintain a complete audit trail for order, cancellation, return, and
refund actions.

### 8.5 Payment scope

No online payment gateway is required in the initial release.

- Customers can submit orders without online payment.
- Payment can be handled separately by the business.
- Support recording payment status and manually recorded payment
  details where needed.
- Support manually recording applicable refunds.
- Keep the data model extensible for future payment integration.

Potential future providers include Razorpay or another suitable
provider. Do not implement payment processing in the current scope.

## 9. WhatsApp Communication

WhatsApp is the primary communication channel for the initial release.

Support workflows for:

- New order notification to admin.
- Customer order acknowledgement.
- Order confirmation.
- Processing and customization updates.
- Dispatch and shipping updates.
- Delivery updates.
- Cancellation updates.
- Return and refund updates.
- Restock notifications.
- Customer enquiries.

For the initial release, use WhatsApp Click-to-Chat links with prefilled
messages and manual sending where necessary.

Prepare the architecture for future WhatsApp Business Cloud API
integration. Clearly distinguish a message being prepared/opened from
one actually sent, delivered, or read.

Store order and notification records in the database independently of
WhatsApp.

## 10. Customer Reviews and Ratings

Implement a product review system.

Customers should be able to:

- Rate products from 1 to 5 stars.
- Submit written reviews.
- Optionally upload review images.
- View existing reviews.
- Sort reviews by newest, highest-rated, and lowest-rated.
- Report inappropriate reviews.

Admin functionality:

- View reviews.
- Approve, reject, or hide reviews.
- Review reports.
- Optionally respond to reviews.

Security and quality:

- Prevent unauthorized review creation.
- Prevent duplicate reviews where applicable.
- Show "Verified Purchase" only when linked to a genuine qualifying
  order.
- Do not fabricate reviews, ratings, or aggregate scores.
- Define review eligibility and moderation rules.

## 11. Admin Dashboard

Build a secure, usable dashboard so authorized staff can manage the
website without editing source code.

### 11.1 Authentication and access control

- Supabase Authentication or the architecture approved after
  repository analysis.
- Protected admin routes.
- Role-based access control.
- Admin and optional staff roles.
- Server-side authorization for privileged operations.
- Secure database and storage policies.

Never rely only on hiding frontend controls to protect admin
functionality.

### 11.2 Dashboard overview

Display useful metrics:

- Total products.
- Categories and subcategories.
- Total and recent orders.
- Pending and delivered orders.
- Cancellations.
- Return requests.
- Pending refunds.
- Inventory totals.
- Low-stock and out-of-stock products.
- Restock subscribers and pending notifications.
- Review counts.
- Best-selling products.

### 11.3 Product management

Allow authorized admins to:

- Create, edit, archive, and delete products according to safe
  data-retention rules.
- Upload multiple images and videos.
- Manage descriptions and specifications.
- Manage pricing and SKU.
- Assign categories and subcategories.
- Manage tags and variants.
- Set availability type.
- Manage stock settings.
- Mark featured, signature, best-seller, and new-arrival products.
- Manage recommendations and related products.
- Edit product SEO fields.

### 11.4 Category and subcategory management

Support create, edit, archive/delete, image upload, descriptions,
display order, visibility, and SEO settings.

### 11.5 Orders, returns, and refunds

Allow admins to:

- View, search, and filter orders.
- Search by order ID, customer name, or phone number.
- View customer and order-item details.
- Update valid order statuses.
- Manage cancellations.
- Review returns.
- Process and record refunds.
- Contact customers through WhatsApp.
- View complete order history.

### 11.6 Inventory and restock management

Provide dedicated inventory and restock sections as described above.

### 11.7 Reviews and homepage/content management

Provide review moderation and controls for:

- Homepage banners.
- Featured collections.
- Signature items.
- Best sellers.
- New arrivals.
- Homepage sections and order.
- Brand story content.
- Testimonials.
- Promotional content.
- Pages and future blog content.

### 11.8 Suggested admin navigation

Refine this based on the existing project and actual scope:

- Dashboard
- Products
  - All Products
  - Add Product
  - Collections
- Categories
  - Categories
  - Subcategories
- Inventory
  - Stock Overview
  - Low Stock
  - Out of Stock
  - Inventory History
- Restock Notifications
  - Subscribers
  - Pending Notifications
  - Notification History
- Orders
  - All Orders
  - Pending Orders
  - Completed Orders
  - Cancellations
  - Returns
  - Refunds
- Reviews
- Homepage Management
- Pages & Blog
- SEO Management
- Customers
- Reports & Analytics
- Settings

## 12. SEO --- High Priority From the Beginning

SEO must be part of the architecture and content model from the
beginning, not a final add-on.

The objective is to help customers discover Bhoomi Art through searches
related to terracotta products, handcrafted home decor, traditional
pottery, customized terracotta items, and relevant product/category
searches. Do not keyword-stuff or create thin, repetitive pages.

### 12.1 Technical SEO

Implement and validate:

- Search-engine-readable rendering (SSR, SSG, or an appropriate hybrid
  based on the existing framework).
- Clean, descriptive, stable URLs.
- Unique page titles and meta descriptions.
- Correct heading hierarchy and semantic HTML.
- Canonical URLs.
- XML sitemap.
- Robots.txt.
- Indexing controls for public pages and private/admin pages.
- Open Graph metadata.
- Social sharing metadata.
- Breadcrumb navigation.
- Optimized images and descriptive alt text.
- Mobile-first responsive design.
- Fast page loading and Core Web Vitals.
- Proper 404 handling.
- Redirect management for changed URLs.
- HTTPS-ready deployment.
- Duplicate content prevention.

Avoid making important product/category content accessible only after
client-side interactions if that harms reliable indexing.

### 12.2 Product SEO

Each product should support editable:

- SEO title.
- Meta description.
- SEO-friendly slug.
- Primary and secondary search terms (editorial guidance, not keyword
  stuffing).
- Image alt text.
- Social sharing image.
- Canonical URL.
- Indexing preference where appropriate.

Use unique, useful product descriptions.

Add valid Schema.org Product structured data and Offer information only
when the underlying data is accurate. Include genuine ratings/reviews
only when available. Never fabricate price, stock, availability, SKU, or
rating data.

### 12.3 Category and subcategory SEO

Support:

- Custom SEO title and meta description.
- SEO-friendly slug.
- Useful category introduction/content.
- Image alt text.
- Canonical URL.
- Internal links to relevant products and related categories.

### 12.4 Structured data

Implement appropriate Schema.org JSON-LD where applicable:

- Organization.
- WebSite.
- BreadcrumbList.
- Product.
- Offer.
- AggregateRating and Review only when supported by genuine eligible
  reviews.

Validate structured data with Google's available testing tools before
launch. Do not promise rich-result display; search engines decide
whether to show it.

### 12.5 Local SEO

Prepare for local discovery:

- Consistent business name and contact details.
- Contact page.
- Business location information when supplied by the business.
- Local business structured data only when accurate and appropriate.
- Google Business Profile guidance.
- Useful location-specific content where relevant.

Do not invent a business address or contact details.

### 12.6 Content SEO

Prepare an extensible content structure for:

- Our Story.
- Terracotta craftsmanship.
- Benefits and uses of terracotta.
- Traditional clay art.
- Terracotta home decor.
- Product care guides.
- Customized terracotta products.
- Frequently asked questions.
- Blog / Journal.

Allow administrators to publish and manage articles in a future or
approved phase.

### 12.7 Analytics and monitoring

Prepare integration points for:

- Google Search Console.
- Google Analytics 4.
- Google Tag Manager, if needed.

Consider tracking:

- Product views.
- Search activity.
- Add to cart.
- Checkout initiation.
- Order submission.
- WhatsApp enquiries.
- Review submissions.

Respect applicable privacy, consent, and data-protection requirements.

## 13. Supabase and Data Architecture

Use Supabase for PostgreSQL, authentication, and file storage if
confirmed as the best fit after repository analysis.

Suggested logical tables (final schema must be designed after inspecting
the existing project):

1.  `profiles` --- authorized profile and role information.
2.  `categories` --- product categories.
3.  `subcategories` --- child categories.
4.  `products` --- product information and availability settings.
5.  `product_media` --- images and videos.
6.  `product_variants` --- sizes, finishes, or other variations.
7.  `product_tags` --- product tags.
8.  `product_reviews` --- customer reviews and ratings.
9.  `review_media` --- review images.
10. `inventory` --- current inventory by product/variant.
11. `inventory_movements` --- stock movement history.
12. `restock_subscriptions` --- customer subscriptions.
13. `restock_notification_history` --- notification attempts and
    outcomes.
14. `orders` --- order/customer/delivery information.
15. `order_items` --- products and quantities in each order.
16. `order_status_history` --- order status audit history.
17. `return_requests` --- return request records.
18. `return_request_items` --- items associated with a return.
19. `refunds` --- refund records.
20. `refund_status_history` --- refund audit history.
21. `homepage_sections` --- homepage layout/configuration.
22. `banners` --- promotional banners.
23. `collections` --- product collections.
24. `collection_products` --- collection membership and ordering.
25. `site_settings` --- configurable site settings.
26. `seo_metadata` --- page/product/category SEO metadata if not stored
    directly on entities.
27. `pages` --- managed static/content pages.
28. `blog_posts` --- future editorial content.
29. Optional `audit_logs` --- security-sensitive administrative
    activity.

Design normalized relationships, foreign keys, constraints, indexes, and
transactional operations. Avoid duplicating data unnecessarily.

### Security requirements

- Apply Row Level Security to exposed tables.
- Restrict admin operations to authorized roles.
- Ensure customers can access only the information they are entitled
  to access.
- Validate all untrusted inputs on the server.
- Protect customer contact details and uploaded evidence.
- Use secure storage buckets and access policies.
- Never expose Supabase service-role keys or other secrets in browser
  code.
- Keep an audit trail for sensitive administrative actions.
- Do not assume anonymous customers can safely read an order merely by
  knowing an order ID; design a secure order lookup/access mechanism.

## 14. Performance, Accessibility, and Quality

### Performance

- Optimize product images and use modern formats where supported.
- Lazy-load non-critical media.
- Avoid unnecessary JavaScript and dependencies.
- Paginate or efficiently load large product lists.
- Minimize layout shifts.
- Optimize fonts.
- Cache public content appropriately.
- Optimize database queries.
- Ensure product videos do not make pages unnecessarily slow.

### Accessibility

- Use semantic HTML.
- Support keyboard navigation.
- Provide descriptive alt text.
- Maintain sufficient color contrast.
- Label form controls.
- Provide clear validation and error messages.
- Make interactive components screen-reader friendly.

### Reliability

- Provide loading, empty, success, and error states.
- Validate forms and server-side inputs.
- Handle network and provider failures.
- Make order creation and inventory changes safe against retries and
  concurrency.
- Avoid duplicate orders and duplicate notifications.
- Test important business workflows end to end.

## 15. Future-Proofing and Out-of-Scope Items

Do not implement these unless separately approved:

- Online payment gateway processing.
- Automated WhatsApp Business Cloud API messaging.
- Automated transactional email provider integration.
- Advanced customer accounts and loyalty programs.
- Advanced discount/coupon engine.
- Shipping-provider integrations.
- Advanced production planning.
- Advanced analytics and recommendation algorithms.

However, avoid architectural decisions that make these features
unnecessarily difficult to add later.

## 16. Suggested Implementation Phases

The phases below are a planning guide. The repository analysis may
recommend a different order or split/merge tasks based on dependencies.

### Phase 1 --- Repository Analysis and Architecture

- Inspect repository and existing functionality.
- Identify reusable components and assets.
- Assess technical risks and gaps.
- Recommend application architecture.
- Propose database schema and relationships.
- Define SEO, security, and media strategy.
- Create a task-by-task implementation roadmap.

### Phase 2 --- Brand and UI Foundation

- Review existing logo and brand assets.
- Establish refined color, typography, and spacing systems.
- Build reusable UI components.
- Establish responsive storefront and admin layouts.
- Implement shared navigation and footer foundations.

### Phase 3 --- Supabase and Backend Foundation

- Configure Supabase.
- Design and approve database schema.
- Configure authentication and roles.
- Configure storage.
- Implement RLS and storage policies.
- Establish secure server-side operations.

### Phase 4 --- Admin Dashboard

- Admin authentication and authorization.
- Dashboard overview.
- Category and subcategory management.
- Product and variant management.
- Image/video uploads.
- Homepage and collection management.
- SEO controls.

### Phase 5 --- Inventory and Restock

- Inventory schema and dashboard.
- Stock adjustment and movement history.
- Ready-to-ship and made-to-order availability.
- Transaction-safe reservations and releases.
- Low-stock and out-of-stock handling.
- Restock subscriptions.
- Admin notification queue and manual WhatsApp workflow.

### Phase 6 --- Customer Storefront

- Homepage.
- Category and subcategory pages.
- Product listing and details.
- Product media gallery.
- Recommendations and related products.
- Recently viewed products.
- Search and filtering.
- Customer reviews.

### Phase 7 --- Cart and Orders

- Cart.
- Checkout.
- Customer and delivery details.
- Order creation and unique order IDs.
- Stock validation/reservation.
- Admin order management.

### Phase 8 --- WhatsApp Communication

- Admin order notifications.
- Customer acknowledgement and status messages.
- Cancellation, return, and refund communication.
- Manual WhatsApp workflows.
- Future API integration readiness.

### Phase 9 --- Returns and Refunds

- Return request workflow.
- Refund request workflow.
- Admin review and decisions.
- Manual refund records.
- Status history and customer updates.
- Configurable policy settings.

### Phase 10 --- SEO and Performance

- Technical SEO.
- Metadata management.
- Structured data.
- Sitemap and robots.txt.
- Canonical URLs and redirects.
- Image and performance optimization.
- Analytics and Search Console readiness.

### Phase 11 --- Testing and Deployment

- Functional and end-to-end testing.
- Security and authorization testing.
- Inventory concurrency testing.
- Order, cancellation, return, and refund testing.
- SEO validation.
- Responsive and accessibility testing.
- Performance testing.
- Production deployment and monitoring.

## 17. Strict Approval-Based Development Workflow

**Do not implement the entire project in one go.**

Every individual task requires explicit user confirmation before
implementation---even if the task belongs to an already approved phase.

For each proposed task, explain:

1.  Task name and objective.
2.  What will be implemented.
3.  Why it is needed.
4.  Files/components expected to change.
5.  Database changes or migrations.
6.  Dependencies and prerequisites.
7.  Security and SEO considerations.
8.  Expected outcome.
9.  Testing plan.

### Required workflow

1.  Analyze the repository.
2.  Present the analysis and complete roadmap.
3.  Break the roadmap into individual tasks.
4.  Present the next task with its scope and expected changes.
5.  Wait for explicit approval.
6.  Implement only that approved task.
7.  Test the task.
8.  Report changed files, database changes, and test results.
9.  Identify unresolved issues.
10. Present the next task and wait for approval.

Never automatically move to the next task.

For destructive operations, production changes, database migrations, or
major architectural decisions, explain the impact and obtain explicit
approval before execution. Do not treat approval of a general phase as
approval for every task within it.

## 18. First Action Required: Analysis Only

For the first response, ONLY analyze the existing repository.

Do not modify files, install dependencies, create database tables, run
migrations, or begin implementation.

Provide:

1.  Existing project architecture and technology stack.
2.  Current functionality.
3.  Reusable components and assets.
4.  Missing functionality and technical gaps.
5.  Recommended UI/UX architecture.
6.  Recommended Supabase architecture.
7.  Proposed database schema and relationships.
8.  Inventory and restock notification architecture.
9.  Order, cancellation, return, and refund workflow design.
10. WhatsApp communication approach.
11. SEO architecture and strategy.
12. Security, performance, and accessibility considerations.
13. Complete implementation roadmap.
14. Individual tasks, dependencies, and expected outcomes.
15. Potential technical challenges and recommendations.

Conclude by presenting **Task 1** with its scope, files/components
likely to be affected, dependencies, and expected outcome. Ask for
explicit confirmation.

**Wait for approval before making any changes.**

---

## 19. Product and Brand Principles

Use these principles to guide implementation decisions:

### Product storytelling

Terracotta products should be presented as handcrafted creations.
Prioritize quality photography, video, meaningful descriptions,
craftsmanship information, dimensions, care instructions, and
customization details.

### SEO from day one

Build indexable product and category pages into the initial
architecture. Avoid postponing metadata, structured data, URLs, internal
linking, and performance work until launch.

### Order and refund transparency

Maintain a reliable order history and clear customer communication for
confirmation, production, dispatch, delivery, cancellation, returns, and
refunds.

### Premium brand experience

Use the brand identity consistently:

**Bhoomi Art -- Beauty of Mother Earth**

**Rooted in Earth · Shaped by Hand · Born with Love**

Every design decision, product presentation, customer interaction, and
technical implementation should support the identity of a thoughtful,
handcrafted terracotta brand.

### Integrated availability experience

Inventory, product availability, cart validation, order processing, and
restock subscriptions must work as one coherent system. An unavailable
product should remain discoverable, and customers should have a clear
way to express interest in its return.

---

**Project outcome:** Build Bhoomi Art as a premium, SEO-friendly
terracotta e-commerce platform with a customer storefront, secure admin
dashboard, integrated inventory, restock notifications, product
storytelling, reviews, and WhatsApp-first order
communication---delivered incrementally through individually approved
tasks.
