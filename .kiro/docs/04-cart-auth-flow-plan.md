# Cart, Inventory & Customer Authentication — Update Plan (A10)

> Extends the master plan. Nothing here starts without explicit approval (see [00-master-plan.md](./00-master-plan.md)).
> Tasks are tracked in [03-execution.md](./03-execution.md) under **A10**.

Status: `[ ]` not started · `[~]` in progress · `[x]` done · `[!]` blocked

---

## 1. Why a plan update is needed

The current plan does **not** cover this request, and part of it contradicts it.

| Request                                      | Current plan                                                                                                 | Gap                         |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------- |
| Login / Sign Up before checkout              | "No customer accounts — guest checkout only" (master plan, req. 01)                                          | **Conflict.** Scope change. |
| Mobile OTP + email/password + reset          | Supabase Auth is used for admin/staff only                                                                   | New customer auth flow      |
| Stock check on add / increase / checkout     | A4-T4-4 "Cart/product page enforcement" is still `[ ]`                                                       | Never done                  |
| Low-stock label, out-of-stock disabled state | Product page shows restock form only                                                                         | Partly done                 |
| Cart revalidation, stale-item notices        | `/api/checkout` validates only status + price. No quantity-vs-stock check except at the `reserve_stock` step | Missing                     |
| Shipping, discounts, recalculated total      | Checkout shows "Shipping: …" placeholder. Discount engine is out of scope (req. 01 line 215)                 | Missing                     |

**Scope decisions this plan needs from you (section 7).**

---

## 2. What exists today (audit)

| Area         | Finding                                                                                                                                                                                                                                                                                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Cart store   | `lib/store/cartStore.ts`. Zustand + localStorage. `addItem` and `updateQty` have **no stock cap**. Items carry no `maxQty`, no stock status.                                                                                                                                                                                                                       |
| Add to cart  | `AddToCartSection.tsx`. Quantity `+` is unbounded. No stock display. Button disabled only when price is null, not when out of stock. Not on listing cards (`ProductCard`).                                                                                                                                                                                         |
| Cart drawer  | `CartDrawer.tsx`. Shows image, name, variant, unit price, line total, subtotal. No stock warnings, no per-line errors. "Proceed to Checkout" is a plain `<Link>`, so it has no auth or validation step.                                                                                                                                                            |
| Checkout API | `POST /api/checkout`. Anonymous. Validates price, status, `out_of_stock`. Reserves stock via `reserve_stock_for_order` (row-locked, atomic). **Order is inserted before stock is reserved**, then deleted on failure (works, but not transactional). Uses `Math.random()` order suffix, so collisions are possible. Variant prices are fetched in a per-item loop. |
| Inventory    | `inventory.available_stock = total_stock - reserved_stock` (generated). `low_stock_threshold` default 5. `tracking_enabled` flag. Made-to-order products skip stock reservation.                                                                                                                                                                                   |
| Auth         | Supabase Auth, admin only. `/api/auth/signin` is email + password. `proxy.ts` guards `/admin/*`. `requireAdmin/requireStaff` read `profiles.role`.                                                                                                                                                                                                                 |
| **Risk**     | `handle_new_user` trigger creates a `profiles` row with default `role = 'staff'` for **every** new `auth.users` row. Enabling customer signup as-is would make every customer pass `requireStaff()`.                                                                                                                                                               |
| Orders       | `orders` has no `user_id`. Orders are identified by phone + order number (`/track`).                                                                                                                                                                                                                                                                               |

---

## 3. Target design

### 3.1 Principles

- **One source of truth for stock:** a server-side function `validateCart(items)` used by every endpoint. No duplicated checks.
- **One source of truth for auth:** Supabase Auth for customers and staff, separated by `profiles.role`.
- **Server decides, client displays.** Every client check has a server twin.
- **Reuse:** `Modal`, `Toast`, `Input`, `Button`, `Badge` from `components/ui`; `reserve_stock_for_order`; `useCartStore`.
- **Dependency order:** schema/security first, then validation service, then cart UI, then auth, then checkout wiring.

### 3.2 Cart & stock validation

```
Client (cart store)                 Server
───────────────────                 ──────────────────────────────
add / +qty ──► POST /api/cart/validate ──► validateCart()
                                              ├─ product active?
                                              ├─ variant active?
                                              ├─ current price
                                              ├─ available_stock (inventory)
                                              └─ per line: ok | adjusted | unavailable
              ◄── { lines[], subtotal, shipping, discount, total }
store applies result: caps qty, flags lines, toasts the reason
```

- `validateCart` returns per line: `status` (`ok` | `low_stock` | `adjusted` | `out_of_stock` | `unavailable`), `availableQty`, `maxQty`, `unitPrice` (fresh), `message`.
- `made_to_order` and `tracking_enabled = false` lines are not capped.
- Cart store gains: `availableQty`, `lineStatus`, `lineMessage`, a `syncWithServer()` action, `isValid()` selector.
- Product pages and listing cards receive `availableQty` from the server render. The stepper max equals `availableQty`. "Only N left in stock" shows when `availableQty < 5` (single constant, `LOW_STOCK_DISPLAY_THRESHOLD = 5`; the per-product `low_stock_threshold` stays for admin alerts).
- Out of stock: button disabled, "Out of Stock" badge, existing restock form kept.
- Cart re-syncs: on drawer open, on tab focus, after any qty change, on entering checkout, and on a 60 s poll while the drawer or checkout is open. Changes show a toast and an inline line message.
- Final authority is `/api/checkout` (re-validates, then reserves atomically). A stock failure returns per-line detail so the client can adjust and retry.

### 3.3 Customer authentication

**Provider:** Supabase Auth. Methods:

| Method                          | Supabase call                                                                                                 | Notes                                                                                                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Email OTP** (primary, launch) | `signInWithOtp({ email, options: { shouldCreateUser: true } })`, `verifyOtp({ email, token, type: 'email' })` | Free. 6-digit code emailed by Supabase (template uses `{{ .Token }}`). Sign-up and login are the same call. The code also proves the email address. |
| Mobile OTP via WhatsApp         | `signInWithOtp({ phone, options: { channel: 'whatsapp' } })`                                                  | **Deferred** (decision 2, Nov 27). Design kept in 3.3.1 so it can be switched on later without redesign.                                            |
| Email + password                | `signUp`, `signInWithPassword`                                                                                | Email confirmation setting to be decided.                                                                                                           |
| Forgot / reset password         | `resetPasswordForEmail`, `updateUser({ password })`                                                           | Reset page at `/auth/reset-password`.                                                                                                               |

**Behaviour**

- OTP: 6 digits, 60 s resend cooldown (countdown shown), expiry handling with a clear "Code expired, send a new one" state, attempt limiting by Supabase plus our own per-IP rate limit on the wrapper route.
- Phone normalised to E.164 (+91 default) in one shared helper; the same helper is reused by checkout's phone validation.
- Auth goes through thin route handlers or Server Actions (`/api/auth/customer/*`) so we can rate-limit, normalise, and return uniform error messages that do not reveal whether an account exists.
- Session via the existing `@supabase/ssr` cookies. `getCurrentCustomer()` helper added next to `lib/auth/admin.ts`.

**Launch scope (decided):** email OTP + email/password. No SMS, no WhatsApp, no Meta account needed. Email/password sign-up confirms with a 6-digit code typed into the modal (`verifyOtp({ type: 'signup' })`), so the user never leaves the checkout context. Supabase's built-in mailer has a very low send limit, so a **custom SMTP** (Resend or Brevo free tier) must be configured before launch (task A10-T5-1).

#### 3.3.1 WhatsApp OTP delivery — DEFERRED, not part of launch

- Supabase Auth → **Send SMS hook** (HTTPS) → `POST /api/hooks/send-otp` → Meta WhatsApp Cloud API (`/{phone-number-id}/messages`) with an approved **Authentication template** (includes the code and a copy-code button).
- The hook route verifies the Standard Webhooks signature using `SEND_SMS_HOOK_SECRET`, so only Supabase can call it. It returns a generic error on failure so the client can show "Couldn't send code, try again or use email".
- **Requirements from you (cannot be skipped):** a Meta Business account, a WhatsApp Business phone number registered to the Cloud API (not the same number running the WhatsApp Business app for Click-to-Chat), an approved Authentication template, and a permanent access token. Meta bills per authentication message; the price in India is low but not zero.
- New env vars: `WHATSAPP_CLOUD_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_OTP_TEMPLATE`, `SEND_SMS_HOOK_SECRET`. Added to `.env.local.example`.
- Until Meta approval, development uses Supabase test phone numbers with fixed OTPs.
- Fallback if WhatsApp delivery fails or the user has no WhatsApp: the modal offers "Use email instead".
- This is a **second** use of the Cloud API in the codebase. It does not change the Click-to-Chat flow for order messages (`lib/communications`); the master-plan line "no Business API" is narrowed to "no Business API for order notifications".

**Role separation (blocker fix, migrations 018 + 019)**

- Add `'customer'` to `user_role`. Change the `handle_new_user` default so new users are `customer`, never `staff`. Staff and admin are only ever promoted by an admin.
- Also copy `phone` from `auth.users` into `profiles` (add `phone` column).
- Verify `requireAdmin` / `requireStaff` / `proxy.ts` reject `customer`. Add `/admin/login` check that a customer session cannot enter admin.
- Link orders: add `orders.user_id UUID NULL REFERENCES auth.users`. RLS: customers can `SELECT` only their own orders. Existing guest orders and `/track` stay working.
- Audit existing `profiles` rows before migrating: any non-staff row accidentally created stays as is, and the default change only affects new rows.

### 3.4 Auth modal and checkout handoff

```
Cart drawer: Proceed to Checkout
  1. syncWithServer()  ── invalid? ──► stay in cart, show line issues, button blocked
  2. session? ── yes ──► /checkout
              └─ no ──► open AuthModal(reason="Sign in to continue with your checkout",
                                        redirectTo="/checkout")
                         cart is in localStorage, so it is untouched
                         success ─► close modal ─► router.push('/checkout')
```

- `AuthModal` is mounted once in the storefront layout and controlled by a small `useAuthModal` store (`open({ reason, redirectTo })`). It reuses `components/ui/Modal` (focus trap, Escape).
- Views: `Sign in` / `Create account` tabs, method switch (Mobile OTP | Email), OTP entry, forgot-password. Mobile first; full-height sheet under 640 px.
- `/checkout` also checks auth server-side (redirects to `/shop?auth=required&next=/checkout` if no session), so a direct URL visit cannot bypass the modal. The client opens the modal when it sees that param.
- Checkout pre-fills name, phone, email, and last address from the profile.
- Cart persistence: see 3.6. Guest cart is in localStorage and is merged into the server cart right after login, so nothing is lost when the modal closes.
- Email sign-up requires confirmation: the modal shows "Check your inbox" and the user cannot sign in or check out until the link is clicked (Supabase "Confirm email" enabled). `/auth/callback` confirms and returns the user to `next` (default `/checkout`). Checkout also verifies `email_confirmed_at` or `phone_confirmed_at` server-side.
- Header gets an account button (Sign in / account menu with My orders, Sign out).

### 3.5 Checkout readiness and pricing

`POST /api/checkout` (changed) will:

1. Require an authenticated customer (`401` → client opens modal).
2. Run `validateCart` (same function as the cart). Reject with `422` and per-line detail if any line is not `ok`/`low_stock`.
3. Recompute prices from the DB. Ignore all client prices.
4. Compute totals in one place, `lib/pricing.ts`: `subtotal`, `shippingFee`, `discount`, `total`. The cart, checkout summary, and API all call it.
5. Create the order and reserve stock **in one Postgres function** (`create_order_with_stock`) so there is no create-then-delete gap. Order number comes from a DB sequence or a collision-checked generator.
6. Return `201` with the order number; the client clears the cart only after success.

**Shipping (per-state rates, decided).** New table `shipping_rates(state TEXT UNIQUE, fee NUMERIC, free_above NUMERIC NULL, is_active BOOL)` plus one default row used for states without a rate. Fee depends on the delivery state, so the cart shows "Shipping calculated at checkout" until a state is chosen, then the real fee. Admin page `/admin/settings/shipping` edits the rates (all 36 states/UTs listed, bulk fill). `lib/pricing.ts` reads rates server-side; the client never supplies a fee. Discount: a zero-value `discount` field is carried through pricing and stored on the order, with no engine yet.

### 3.6 Server-side cart (multi-device)

Decision: the cart lives on the server for signed-in users, so it follows them across devices.

**Tables (migration 021)**

```
carts       (id, user_id UNIQUE → auth.users, updated_at)
cart_items  (id, cart_id → carts ON DELETE CASCADE, product_id, variant_id NULL,
             quantity INT CHECK (quantity > 0), updated_at,
             UNIQUE (cart_id, product_id, variant_id))
```

- Prices are **not** stored. They are read live on every fetch, so a stale price cannot reach checkout.
- RLS: a user can read and write only the cart that has their `user_id`. Writes go through route handlers that also run `validateCart`.
- Stock is not reserved by a cart. Reservation happens only at order creation, so abandoned carts never lock inventory.

**API:** `GET /api/cart` (returns validated lines + totals), `PUT /api/cart/items` (set absolute quantity for one line, capped to stock), `DELETE /api/cart/items/:id`, `POST /api/cart/merge` (guest lines in, merged cart out), `DELETE /api/cart` (clear after order).

**Client behaviour**

| State        | Source of truth | Notes                                                                                                                                                                                        |
| ------------ | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Guest        | localStorage    | Same Zustand store as today. Validated through `POST /api/cart/validate` (no DB write).                                                                                                      |
| Signed in    | Server cart     | Store is an optimistic cache. Each change calls the API, then replaces the line with the server result.                                                                                      |
| On login     | Merge           | Guest lines are sent to `/api/cart/merge`. Same product+variant sums quantities, capped to stock. Server cart is returned, localStorage is cleared, a toast says what was merged or trimmed. |
| Other device | Refresh         | The cart is refetched on window focus, drawer open, and every 60 s while open. Quantities are set as absolute values, so two devices converge on the last write instead of double-adding.    |
| Sign out     | Clear local     | Local cache is wiped so the next person on a shared device does not see it.                                                                                                                  |

This replaces the earlier "localStorage only" assumption and adds work to T1, T2, T3 and T4 (see task list).

---

## 4. Tasks (A10)

### A10-T1 · Security & Data Foundation

- [~] A10-T1-1 · Migrations 018 + 019 written, **not yet applied**: add `customer` to `user_role`; default new profiles to `customer`; `handle_new_user` sets role explicitly; add `profiles.phone`
- [~] A10-T1-2 · Code audit done: every admin guard (`lib/auth/admin.ts`, `lib/api/auth.ts`, two admin API routes) uses an `admin`/`staff` allowlist, so `customer` is rejected. Runtime check after apply is still open
- [~] A10-T1-3 · In migration 019, not applied: `orders.user_id`, price-breakdown columns, owner-read RLS, **drops the live `orders: anon insert` and `order_items: anon insert` policies** (anyone could insert orders directly through the API). `/track` uses the service role and keeps working
- [~] A10-T1-4 · Migration 020, not applied: `create_order_with_stock` function (insert order, items, reserve stock in one transaction); collision-safe order number
- [~] A10-T1-5 · Migration 021, not applied: `carts`, `cart_items` with RLS (owner only)
- [~] A10-T1-6 · Migration 022, not applied: `shipping_rates` table, fallback row `*` and all 36 states seeded at ₹120 / free above ₹2,000 (placeholders). Order price columns are in 019
- [ ] A10-T1-7 · Regenerate `lib/types/database.ts`

### A10-T2 · Server Validation Service

- [ ] A10-T2-1 · `lib/cart/validateCart.ts` — batched queries (no per-item loop), per-line status, fresh price, `availableQty`
- [ ] A10-T2-2 · `lib/pricing.ts` — subtotal, shipping, discount, total, single implementation
- [ ] A10-T2-3 · `POST /api/cart/validate` — rate-limited, input-validated (zod or equivalent)
- [ ] A10-T2-4 · Per-state shipping rates: `lib/shipping.ts` lookup + `/admin/settings/shipping` page + `PATCH /api/admin/shipping-rates` (audit-logged)
- [ ] A10-T2-6 · Server cart API: `GET /api/cart`, `PUT /api/cart/items`, `DELETE /api/cart/items/:id`, `POST /api/cart/merge`, `DELETE /api/cart`; all via `validateCart`
- [ ] A10-T2-5 · Refactor `/api/checkout` to use `validateCart` + `pricing` + `create_order_with_stock`; return per-line errors on `422`

### A10-T3 · Cart Store & Stock-aware Product UI

- [ ] A10-T3-1 · Extend `cartStore`: `availableQty`, `lineStatus`, `lineMessage`, `syncWithServer`, `isValid`, capped `addItem`/`updateQty`; two modes (guest = localStorage, signed in = server API with optimistic update and rollback on failure)
- [ ] A10-T3-2 · `AddToCartSection`: stepper max = available stock, "Only N left in stock" (< 5), out-of-stock disabled button + badge, variant-aware stock
- [ ] A10-T3-3 · `ProductCard`: quick add-to-cart (non-variant products), out-of-stock and low-stock labels; variant products link to detail
- [ ] A10-T3-4 · Server-validated add: store calls validate before commit; shows "Added", "Only N available, added N" or error toast
- [ ] A10-T3-5 · Stock info passed from server components (product page, shop, category, search, collections) without breaking caching (`<Suspense>` for stock per Next 16 audit)

### A10-T4 · Cart Experience

- [ ] A10-T4-1 · `CartDrawer`: per-line stock messages, "Only N left", unavailable / partial badges, disabled `+` at max, disabled checkout until valid
- [ ] A10-T4-2 · Summary block: subtotal, shipping, discount, total from `lib/pricing.ts`
- [ ] A10-T4-3 · Sync triggers: drawer open, window focus, 60 s poll while open, after qty change; toast on changes
- [ ] A10-T4-4 · Optional `/cart` page reusing the same line component (extract `CartLine` from the drawer; avoid duplication)
- [ ] A10-T4-5 · Handling for price changes ("Price updated from ₹X to ₹Y")

### A10-T5 · Customer Authentication

- [ ] A10-T5-1 · Supabase config: phone auth enabled with Send SMS hook, OTP length/expiry, "Confirm email" on, email templates, redirect URLs (document in `.env.local.example`)
- [ ] A10-T5-1a · **Deferred.** `POST /api/hooks/send-otp` — WhatsApp delivery via Cloud API (build only when WhatsApp OTP is switched on)
- [ ] A10-T5-1c · Custom SMTP (Resend or Brevo) configured in Supabase; email templates for "Confirm sign-up" and "Magic link / OTP" show `{{ .Token }}`
- [ ] A10-T5-1b · Cart merge on login wired into the auth success path (calls `/api/cart/merge`)
- [ ] A10-T5-2 · `lib/auth/customer.ts` — `getCurrentCustomer()`, `requireCustomer()`; `lib/phone.ts` E.164 helper shared with checkout
- [ ] A10-T5-3 · Route handlers: OTP send, OTP verify, email sign-up, email sign-in, forgot password, sign-out; uniform errors; per-IP and per-phone rate limiting
- [ ] A10-T5-4 · `/auth/reset-password` page and `/auth/callback` route
- [ ] A10-T5-5 · `useAuthModal` store + `AuthModal` (tabs, method switch, OTP input with resend countdown and expiry state, validation, loading, errors, a11y)
- [ ] A10-T5-6 · Navbar account button + menu; session state in storefront layout
- [ ] A10-T5-7 · Orders linked to the signed-in user; optional "My orders" page

### A10-T6 · Checkout Integration

- [ ] A10-T6-1 · Cart "Proceed to Checkout" handler: sync → validate → auth check → modal or navigate
- [ ] A10-T6-2 · `/checkout` server-side auth gate; redirect with `next` param; modal opens on return
- [ ] A10-T6-3 · Checkout pre-fill from profile, live re-validation on mount, summary from `lib/pricing.ts`
- [ ] A10-T6-4 · Handle `401` (open modal, retry), `422` (apply line adjustments, show banner, block submit), network errors (retry button)
- [ ] A10-T6-5 · Clear cart only after `201`; analytics events (`auth_modal_open`, `auth_success`, `checkout_blocked`)

### A10-T7 · QA, Edge Cases & Docs

- [ ] A10-T7-1 · Concurrency: two sessions buying the last unit, one wins and the other gets a clear message
- [ ] A10-T7-2 · Stock changes during checkout, expired OTP, wrong OTP, resend spam, network drop mid-verify
- [ ] A10-T7-3 · Auth bypass: direct `/checkout` visit, direct `POST /api/checkout` without session, customer token against admin routes
- [ ] A10-T7-4 · Responsive and a11y pass: modal, drawer, checkout at 360 / 768 / 1280 px, keyboard-only, screen reader labels
- [ ] A10-T7-5 · End-to-end run: browse → add → low-stock → login via OTP → checkout → order confirmation
- [ ] A10-T7-6 · Update docs (master plan, requirements, design, execution), mark A4-T4-4 done

---

## 5. Order of work

```
T1 (security, schema)  ─►  T2 (validation + pricing)  ─►  T3 (stock-aware UI)  ─►  T4 (cart)
                                      └──────────────►  T5 (auth)  ─────────────►  T6 (checkout)  ─►  T7
```

T3/T4 and T5 can run in parallel once T2 is done. T1 comes first because it fixes the `staff` default role, which must be in place before any customer can sign up.

## 6. Files expected to change or be added

| New                                                                                                           | Changed                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `supabase/migrations/018`–`022` (customer role, profiles/orders, order function, server cart, shipping rates) | `lib/store/cartStore.ts`, `components/storefront/CartDrawer.tsx`, `components/storefront/ProductCard.tsx`                 |
| `lib/cart/validateCart.ts`, `lib/pricing.ts`, `lib/phone.ts`, `lib/auth/customer.ts`                          | `app/(storefront)/product/[slug]/AddToCartSection.tsx`, `product/[slug]/page.tsx`, shop/category/search/collections pages |
| `app/api/cart/validate/route.ts`, `app/api/auth/customer/*`, `app/auth/callback`, `app/auth/reset-password`   | `app/api/checkout/route.ts`, `app/(storefront)/checkout/*`, `components/layout/Navbar.tsx`, storefront `layout.tsx`       |
| `components/auth/AuthModal.tsx`, `lib/store/authModalStore.ts`, `components/storefront/CartLine.tsx`          | `lib/db/inventory.ts`, `lib/db/orders.ts`, `proxy.ts`, `.env.local.example`, `lib/types/database.ts`                      |

## 7. Decisions

| #   | Question               | Decision                                                                                                                                                                  |
| --- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Customer accounts      | **Yes.** In scope.                                                                                                                                                        |
| 2   | OTP channel            | **Email OTP + email/password at launch.** WhatsApp OTP deferred (3.3.1). No SMS provider.                                                                                 |
| 3   | Guest checkout         | **Removed.** Login required. `/track` stays for old guest orders.                                                                                                         |
| 4   | Shipping               | **Per-state rates** (3.5). Discount stays a zero-value field.                                                                                                             |
| 5   | Email sign-up          | **Confirmation required** before sign-in and checkout.                                                                                                                    |
| 6   | Cart storage           | **Server-side** for signed-in users, localStorage for guests, merged on login (3.6).                                                                                      |
| 7   | Low-stock label        | **Badge only**: "Only N left in stock" when fewer than 5. Quantity can never exceed available stock (stepper max, server cap).                                            |
| 8   | Made-to-order products | Quantity not capped (assumed; no objection raised).                                                                                                                       |
| 9   | OTP provider (later)   | When WhatsApp OTP is revisited: Meta Cloud API directly, not Twilio. Cost in "OTP cost" below.                                                                            |
| 10  | Starting shipping fees | Seed values chosen by us: default **₹120** per order, free above **₹2,000**. Admin edits every state at `/admin/settings/shipping`. Placeholder until you set real rates. |

### OTP cost (checked Nov 2026)

| Option                       | Cost                                                                                                                                             | Fit                                        |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| Meta Cloud API, test number  | Free, but limited recipients and short-lived token                                                                                               | Development only                           |
| Meta Cloud API, production   | About ₹0.115 per authentication message + 18% GST (≈ ₹0.136). 1,000 OTPs ≈ ₹136. No monthly fee.                                                 | **Chosen.** Cheapest paid route.           |
| Twilio WhatsApp              | Trial is free but limited: verified numbers only, about 100 messages, 30 days. Production adds Twilio's $0.005 per message on top of Meta's fee. | Not free, and costs more than Meta direct. |
| Email OTP / email + password | Free on Supabase's default mail, which is heavily rate-limited. A custom SMTP (Resend or Brevo free tier) removes the limit.                     | **Free fallback.** Already in the plan.    |

Nothing gives free WhatsApp OTP in production. If cost is a concern, launch with email/password plus email OTP (free) and enable WhatsApp OTP later; the modal and hook are built so the channel can be switched on by configuration.

### Still open

- **Custom SMTP account** (Resend or Brevo free tier) is needed before launch for email OTP volume. Not needed for T1.
- **Real per-state fees.** Replace the ₹120 / ₹2,000 placeholders when you have them.

## 8. Notes found while writing T1

- **Migration drift.** The live database tracks migrations 001-017 under different names than `supabase/migrations/` (live has `016_security_hardening`, `017_storage_buckets`; the repo has `016_performance_indexes`). New files start at 018 to avoid a clash. Apply them with the Supabase migration tool so live history stays consistent.
- **Only one profile exists live, with role `staff` (no `admin`).** Left unchanged. Confirm this is intended before relying on admin-only pages.
- **Order numbers** keep the `BA-YYYYMMDD-NNNN` format (4 random digits, collision-checked in the DB function). At more than a few hundred orders per day, widen it to 5 digits.
