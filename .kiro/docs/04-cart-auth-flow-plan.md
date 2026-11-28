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

- [x] A10-T1-1 · Migrations 018 + 019 **applied Nov 27**: add `customer` to `user_role`; default new profiles to `customer`; `handle_new_user` sets role explicitly; add `profiles.phone`
- [x] A10-T1-2 · Code audit done: every admin guard (`lib/auth/admin.ts`, `lib/api/auth.ts`, two admin API routes) uses an `admin`/`staff` allowlist, so `customer` is rejected. Live DB confirmed: default role `customer`, anon order policies removed, existing staff row untouched. A real customer-session-against-admin test happens in T7
- [x] A10-T1-3 · Migration 019 applied: `orders.user_id`, price-breakdown columns, owner-read RLS, **drops the live `orders: anon insert` and `order_items: anon insert` policies** (anyone could insert orders directly through the API). `/track` uses the service role and keeps working
- [x] A10-T1-4 · Migration 020 applied. Tested in a rolled-back transaction (happy path reserves 0→1, oversell, total mismatch, missing user all behave; nothing persisted): `create_order_with_stock` function (insert order, items, reserve stock in one transaction); collision-safe order number
- [x] A10-T1-5 · Migration 021 applied: `carts`, `cart_items` with RLS (owner only)
- [x] A10-T1-6 · Migration 022 applied: `shipping_rates` table, fallback row `*` and all 36 states seeded at ₹120 / free above ₹2,000 (placeholders). Order price columns are in 019
- [x] A10-T1-7 · Regenerated `lib/types/database.ts` (+139 lines, `tsc` clean)

### A10-T2 · Server Validation Service

- [x] A10-T2-1 · `lib/cart/validateCart.ts` — batched queries (no per-item loop), per-line status, fresh price, `availableQty`
- [x] A10-T2-2 · `lib/pricing.ts` — subtotal, shipping, discount, total, single implementation
- [x] A10-T2-3 · `POST /api/cart/validate` — rate-limited, input-validated (zod or equivalent)
- [x] A10-T2-4 · Per-state shipping rates: `lib/shipping.ts` lookup + `/admin/settings/shipping` page + `PATCH /api/admin/shipping-rates` (audit-logged)
- [x] A10-T2-6 · Server cart API: `GET /api/cart`, `PUT /api/cart/items`, `DELETE /api/cart/items/:id`, `POST /api/cart/merge`, `DELETE /api/cart`; all via `validateCart`
- [x] A10-T2-5 · `/api/checkout` rewritten in T6 (see section 12)

### A10-T3 · Cart Store & Stock-aware Product UI

- [x] A10-T3-1 · Extend `cartStore`: `availableQty`, `lineStatus`, `lineMessage`, `syncWithServer`, `isValid`, capped `addItem`/`updateQty`; two modes (guest = localStorage, signed in = server API with optimistic update and rollback on failure)
- [x] A10-T3-2 · `AddToCartSection`: stepper max = available stock, "Only N left in stock" (< 5), out-of-stock disabled button + badge, variant-aware stock
- [x] A10-T3-3 · `ProductCard`: quick add-to-cart (non-variant products), out-of-stock and low-stock labels; variant products link to detail
- [x] A10-T3-4 · Server-validated add: store calls validate before commit; shows "Added", "Only N available, added N" or error toast
- [x] A10-T3-5 · Live stock via batched `/api/stock` + server-rendered initial value on the product page (instead of threading stock through ~10 listing queries; keeps cached pages correct). (product page, shop, category, search, collections) without breaking caching (`<Suspense>` for stock per Next 16 audit)

### A10-T4 · Cart Experience

- [x] A10-T4-1 · `CartDrawer`: per-line stock messages, "Only N left", unavailable / partial badges, disabled `+` at max, disabled checkout until valid
- [~] A10-T4-2 · Summary block (subtotal, shipping, estimated total shown; shipping amount appears once a delivery state is known, which is set in checkout in T6): subtotal, shipping, discount, total from `lib/pricing.ts`
- [x] A10-T4-3 · Sync triggers: drawer open, window focus, 60 s poll while open, after qty change; toast on changes
- [~] A10-T4-4 · `CartLine` extracted for reuse; the optional `/cart` page itself is not built reusing the same line component (extract `CartLine` from the drawer; avoid duplication)
- [x] A10-T4-5 · Handling for price changes ("Price updated from ₹X to ₹Y")

### A10-T5 · Customer Authentication

- [~] A10-T5-1 · Supabase dashboard setup is **yours to do** and is written up step by step in [05-auth-setup.md](./05-auth-setup.md): email templates must contain `{{ .Token }}`, Confirm email on, OTP expiry 600 s, leaked-password protection, Site URL. Phone auth / Send SMS hook not needed (WhatsApp deferred)
- [ ] A10-T5-1a · **Deferred.** `POST /api/hooks/send-otp` — WhatsApp delivery via Cloud API (build only when WhatsApp OTP is switched on)
- [ ] A10-T5-1c · **Yours to do before launch:** custom SMTP (Resend or Brevo). The built-in mailer returned HTTP 429 (rate limit) during testing, so real customers would not get codes. Steps in 05-auth-setup.md
- [x] A10-T5-1b · Cart merge on login: `<CartSync>` merges the guest cart on SIGNED_IN (built in T3, verified end to end in T5)
- [x] A10-T5-2 · `lib/auth/customer.ts` (done in T2); `lib/auth/validation.ts` (email, password, code, shopper-facing error wording). `lib/phone.ts` not needed while phone sign-in is deferred
- [x] A10-T5-3 · **Changed approach:** the modal calls Supabase Auth directly from the browser instead of going through our own route handlers. Supabase is the security boundary and enforces its own rate limits; wrapper routes would add an in-memory limiter that does not work on serverless and would stop the browser client from emitting SIGNED_IN (which drives the cart merge). Error wording is uniform and never reveals whether an email is registered
- [x] A10-T5-4 · **Changed approach:** no `/auth/callback` or `/auth/reset-password` pages. Password reset uses a code typed in the modal, then a "choose new password" step, so shoppers never leave their checkout. Requires the Reset Password email template to show `{{ .Token }}`
- [x] A10-T5-5 · `useAuthModalStore` + `AuthModal`: Sign in / Create account tabs, Email code / Password switch, forgot password, show/hide password, 60 s resend countdown, "code may have expired" hint, loading and error states, focus moved into the form, labelled fields, `role="alert"` errors
- [x] A10-T5-6 · Navbar `AccountButton` (Sign in button, or initial + menu with Track an order and Sign out); `authStore` filled by `<CartSync>`
- [x] A10-T5-7 · Orders are linked to the signed-in user (`orders.user_id`) by `create_order_with_stock`. A "My orders" page is not built (the account menu links to /track)

### A10-T6 · Checkout Integration

- [x] A10-T6-1 · Cart drawer "Proceed to Checkout": re-validate, then if signed out open the sign-in modal ("Sign in to continue with your checkout", redirect to /checkout), else go to /checkout
- [x] A10-T6-2 · `/checkout` server gate: signed-out visitors get a sign-in prompt (modal opens once, prompt card stays, cart summary visible) instead of the form; `POST /api/checkout` returns 401 for anyone not signed in with a confirmed email
- [x] A10-T6-3 · Pre-fill name, phone, email and address from the profile and last order; stock, prices and shipping refreshed on arrival and on every state change; no empty-cart flash
- [x] A10-T6-4 · Handled: 401 (open modal), CART_CHANGED / STOCK_CHANGED (message, re-sync, "Review your cart"), TOTAL_CHANGED (new total shown, customer re-confirms), 429, network failure (cart kept, retry), field errors (focus first invalid field)
- [x] A10-T6-5 · Cart is emptied by the server inside the order transaction, so it can only be cleared by a successful order. Analytics: checkout_start and order_submit kept; the `auth_*` events were not added

### A10-T7 · QA, Edge Cases & Docs

- [x] A10-T7-1 · Concurrency: two customers, one unit left: exactly one order, the other told it sold out, available stock 0 and never negative, loser's cart line flagged. Double submit by one customer: one order, stock reserved once
- [x] A10-T7-2 · Stock change during checkout, wrong code, network drop while verifying a code (recovers with the same code), network failure at checkout (cart and form kept), session ended. Real code expiry (about 1 hour by default) was not waited out
- [x] A10-T7-3 · Auth bypass: 280 probes of every admin API route as customer and as anonymous, none exposed anything. Direct database writes with the public key and a customer token changed nothing. Found and fixed a redirect loop and global sign-out (section 13)
- [x] A10-T7-4 · axe-core (WCAG 2.0/2.1/2.2 A and AA) on checkout, drawer, product page, shop cards and every sign-in screen; layout at 360 / 768 / 1280 px; keyboard-only use of the modal. Remaining findings are the brand colours (section 13)
- [x] A10-T7-5 · End to end repeated after the final changes: guest adds, Proceed to Checkout, sign in, state and shipping, order placed, cart emptied
- [x] A10-T7-6 · Docs updated: master plan, requirements, design, execution, this plan; `05-auth-setup.md` added; A4-T4-4 closed

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
- **Applied out of order.** 021 and 022 were applied just before 020, so live migration history lists them in that order. No dependency between them; files stay numbered 018-022.
- **Security advisor (pre-existing, not from A10):** `handle_new_user` and `rls_auto_enable` are executable via the REST API by anon/authenticated. `is_admin` / `is_admin_or_staff` must stay executable because RLS policies call them. Leaked-password protection is off; enable it in Supabase Auth settings before email/password sign-up goes live (A10-T5-1).

## 9. T2 delivery notes (Nov 27)

**Built:** `lib/cart/{constants,types,schema,validateCart,snapshot}.ts`, `lib/pricing.ts`, `lib/shipping.ts`, `lib/db/cart.ts`, `lib/auth/customer.ts`, `lib/api/rateLimit.ts`; routes `POST /api/cart/validate`, `GET|DELETE /api/cart`, `PUT /api/cart/items`, `DELETE /api/cart/items/[id]`, `POST /api/cart/merge`, `PATCH /api/admin/shipping-rates`; admin page `/admin/settings/shipping`.

**Verified against the live database** (guest and a temporary confirmed user, deleted afterwards): oversell is capped and flagged, made-to-order is uncapped, unknown products are `unavailable`, client prices are ignored, duplicate lines merge, bad input returns 400, every signed-in route returns 401 without a session. With a session: add/set/merge/remove work, stock dropping under a cart reduces the quantity and tells the user, stock hitting 0 keeps the line flagged `out_of_stock` and blocks adding, and a second user sees none of the first user's cart. A new sign-up got role `customer` from the trigger. A customer cannot update products or read inventory movements.

**Behaviour to know**

- Lines status: `ok`, `low_stock` (< 5 left), `adjusted` (quantity reduced to stock), `out_of_stock`, `unavailable`. `checkoutReady` is true only when every line is `ok` or `low_stock` at the requested quantity. An `adjusted` line shows at its reduced quantity in the subtotal but blocks checkout until the customer sees the change (the server cart saves the reduced quantity, so the next load is `ok`).
- Shipping is `null` (pending) until a delivery state is passed. Unknown state names use the default `*` rate.
- Merge report `requested` is guest quantity + quantity already in the server cart.
- `lib/api/rateLimit.ts` is per-server-instance memory. It blunts abuse but is not a hard limit on serverless. Swap in a shared store (for example Upstash) before launch.
- Not tested: the `low_stock` label path (all seeded products have 12 or made-to-order), and variant products (none exist in the database).

**Why A10-T2-5 moved to T6.** `create_order_with_stock` requires a signed-in user, so switching `/api/checkout` now would stop checkout working for everyone until the login modal exists (T5). It is done in T6 together with the checkout gate. `/api/checkout` is unchanged and still accepts guests until then.

## 10. T3 + T4 delivery notes (Nov 27)

**Built:** `lib/cart/stock.ts`, `GET /api/stock`, `lib/cart/stockClient.ts` (batched, cached 15 s), rewritten `lib/store/cartStore.ts` (guest + server modes, serialized queue, notices), `components/storefront/{CartSync,CartLine,CartDrawer,ProductCardActions}.tsx`, stock-aware `AddToCartSection`, product page (initial stock, "notify me" form when sold out by stock), `ProductCard` quick add, hydration-safe cart badge in `Navbar`.

**Verified in a real browser against the live database** (stock temporarily changed, restored afterwards to 12/12/12):

- Product page: "Only 3 left in stock" badge, stepper stops at 3 with tooltip, button becomes "All available units in cart", "3 in your cart".
- Cards on /shop: "Only 2 left in stock", disabled "Out of Stock", "Max in cart", made-to-order stays buyable.
- Drawer: stock dropping 3 to 1 while the item was in the cart reduced it on open, with a banner and a line note. Stock dropping to 0 flagged the line, excluded it from the subtotal and disabled checkout ("Remove unavailable items to continue"). Removing it re-enabled checkout. Proceed to Checkout re-validates and navigated to /checkout.
- Guest cart survives a full page reload. No hydration errors.

**Bugs found and fixed during testing:** (1) the guest cart was wiped on every page load because "no session" ran the sign-out handler. It now clears only a cart that belonged to a signed-in customer. (2) Hydration mismatch on the cart badge (saved cart vs server HTML). (3) Cart button label "1 items".

**Not tested:** the signed-in path of the new store (server mode, merge on login, sign-out wipe) because customer login does not exist until T5. The API behind it was tested in T2. A phone-width layout check (screenshots from the test tool were stale, so only DOM state was verified). Variant products (none in the database).

**Known gaps for later tasks:** `/checkout` still reads the cart without stock info and accepts guests (T6). The checkout page can show a one-frame empty state before the saved cart loads (same localStorage cause as the badge; fix in T6).

## 11. T5 delivery notes (Nov 27)

**Built:** `components/auth/{AuthModal,AccountButton}.tsx`, `lib/store/{authStore,authModalStore}.ts`, `lib/auth/validation.ts`, `.kiro/docs/05-auth-setup.md` (dashboard setup and email templates), `NEXT_PUBLIC_AUTH_OTP_LENGTH` in `.env.local.example`.

**Verified in a real browser against your Supabase project** (a confirmed test user, real codes fetched with the admin API, deleted afterwards). The only fake was the "email sent" response, because the built-in mailer is rate limited (HTTP 429):

- Email code: invalid email rejected inline; code step with resend countdown; wrong code gives "incorrect or has expired" and clears the field; the real code signs in, closes the modal, shows the account initial.
- Guest cart (1 item) merged into the server cart on sign-in. Sign-out cleared the local cart. Signing in again restored it from the server.
- Password: empty and wrong password messages, show/hide, forgot password with a real recovery code, weak-password message, new password saved (old password stopped working, new one works).
- Create account: both tabs, password rules, confirmation-code step with the "sign in instead" hint.
- Phone width 360 px: modal fits, no horizontal scroll.

**Finding:** your project's "Email OTP Length" is **8**, not 6. The modal now accepts 6 to 10 digits. Auto-submit on the last digit only happens if `NEXT_PUBLIC_AUTH_OTP_LENGTH` is set. Either leave the dashboard at 8 or set it to 6; keep the env value in step with it.

**Not tested:** real email delivery (needs custom SMTP and the three templates edited), account-already-exists behaviour with Confirm email on, the modal on a real phone, screen reader use.

**Still open before launch (dashboard, see 05-auth-setup.md):** email templates, custom SMTP, Confirm email, leaked-password protection, Site URL.

## 12. T6 delivery notes (Nov 27)

**Design change from section 3.5.** `/api/checkout` builds the order from the customer's **server cart**, not from lines sent by the browser. The request carries only the form and the total the customer saw (`expectedTotal`). Prices, quantities, shipping and the total are all computed on the server.

**Built:** migration `023_order_consumes_cart.sql` (order function takes the cart in the same transaction), `app/api/checkout/route.ts`, `lib/india-states.ts`, `lib/store/cartUiStore.ts`, rewritten `/checkout` page and client, drawer sign-in gate, `AuthModal` refreshes server data after sign-in.

**Verified against the live database (temporary users, all deleted afterwards; stock back to 12/12/12, 0 orders):**

- API: no session gives 401; empty cart, missing name, bad phone, unknown and missing state give 400 with the field name; a stale total gives 409 with the server's total; stock below the cart gives 409 listing the line; client-sent items and prices are ignored; the order row, items (with SKU snapshot), stock reservation, status history and profile name/phone are all correct.
- **Double submit:** two simultaneous checkouts created exactly one order and reserved stock once. A cart with an extra line is refused. Clearing another user's cart is rejected.
- Shipping: ₹120 for a ₹890 order to Goa, free for ₹5,630 to Kerala. Rate limit: 429 after 10 attempts per minute.
- Browser: guest adds item, Proceed to Checkout opens the modal with its reason and the drawer closes, sign-in lands on /checkout with the cart intact, state choice shows shipping and total, empty form shows inline errors and focuses the first, order placed, confirmation page, cart empty.
- Direct visit to /checkout signed out: modal opens by itself, prompt card and summary shown; signing in there fills the form from the last order.
- Stock dropping while on the page: the order is refused with a clear message, lines re-checked (3 reduced to 1), total recalculated, retry succeeds.

**Bugs found and fixed in testing:** after signing in on /checkout the form stayed empty because the server page was not re-fetched. `AuthModal` now calls `router.refresh()` on success.

**Behaviour to know:** merging adds the guest quantity to what is already saved (capped to stock), so adding the same item as a guest and again after signing in gives the sum. Delivery state is required (shipping depends on it); the rest of the address stays optional as before.

**Not tested:** real email delivery (Supabase dashboard setup pending), a real phone, screen readers, variant products, the `/track` page for orders placed by signed-in customers.

## 13. T7 results and go-live checklist (Nov 27)

**Bugs found by attacking the system, all fixed and retested**

1. **Redirect loop.** A signed-in customer opening `/admin/login` was sent to the dashboard by the proxy, and the dashboard sent them back. The proxy now moves only admin and staff on. A customer sees the login page.
2. **Customers could sign in through the admin login.** `/api/auth/signin` now requires admin or staff and answers 403 otherwise.
3. **Global sign-out.** The 403 path used `signOut()`, whose default scope logs the user out of every device. Both it and the account-menu "Sign out" now use `scope: 'local'`.
4. **Internal functions were callable through the public API.** Migration 024 limits the stock functions, `handle_new_user` and `rls_auto_enable` to the service role. Sign-ups still create a profile and checkout still works (retested).
5. **Dead code removed:** `createOrder` and `reserveStock` could create an order or reserve stock outside the safe transaction.
6. **Accessibility:** focus returns to the Sign in button when the modal closes; the card image link and the quick-add button names now contain their visible text; small informational text uses a darker shade; link and button targets raised to 24 px; the selected method pill meets 4.5:1.

**Accessibility results.** Checkout form, cart drawer, sign-in code step, create account, password sign-up and forgot password: no WCAG A/AA violations. Layout: no horizontal scroll at 360, 768 or 1280 px; drawer and modal fit the viewport.

**Colour contrast (decided and applied, Nov 27).** axe found contrast failures on the whole storefront from the brand and status colours. The tokens in `app/globals.css` were darkened by the smallest step that reaches 4.5:1 for small text: terracotta `#b65e3c` to `#a55536`, earth-500 `#a8683a` to `#975d34`, success `#059669` to `#047d58`, info `#2563eb` to `#1c5cea`, error `#dc2626` to `#ca2121`. `themeColor` and the global error page use the same values. Four home-page elements also lost their intended colour to the global `.heading-4` / `.body-small` / `.label-uppercase` classes (a white headline rendered dark brown on green at 2:1); they now use the important modifier. To go back to the original look, restore the five token values and the four classes noted in `app/(storefront)/page.tsx`. Result: 13 public pages and every sign-in, cart and checkout screen scan clean (WCAG 2.0 to 2.2 A and AA), at 1280 and 360 px. Admin pages were not scanned; they share the tokens, so their badges changed slightly. The admin "Pending" badge (amber on light amber) was not changed and likely still fails.

**Not tested:** real email delivery, real code expiry, a physical phone, a screen reader, variant products (none exist), more than a handful of simultaneous shoppers, the Lighthouse score.

**Go-live checklist**

- [ ] Supabase: three email templates show `{{ .Token }}`, custom SMTP, Confirm email on, OTP expiry 600 s, leaked-password protection on, Site URL set (05-auth-setup.md)
- [ ] Send a real sign-up and a real checkout from a non-team email address and confirm the code arrives
- [ ] Replace the placeholder shipping fees (Rs 120, free above Rs 2,000) at `/admin/settings/shipping`
- [ ] Check the single existing profile has the role you expect (it is `staff`; admin-only pages need `admin`)
- [x] Brand-colour contrast change applied (see above)
- [ ] Swap the in-memory rate limiter (`lib/api/rateLimit.ts`) for a shared store such as Upstash before relying on it on serverless hosting
- [ ] Set `NEXT_PUBLIC_AUTH_OTP_LENGTH` to match the dashboard if you want codes to submit on the last digit
- [ ] HTTPS at the host, Lighthouse audit with real photography (existing A8 items)

## 14. Live test with real email (Nov 27)

With custom SMTP (Resend) and the three edited email templates in place, a real customer journey was run in the browser against the live project, using the owner's own address:

1. Guest adds an item, opens the cart, Proceed to Checkout. The sign-in modal opens with its reason.
2. A real sign-up code was emailed (Supabase logged `user_confirmation_requested`, 2.6 s, status 200) and typed in. **The project's code length is 8 digits.**
3. Signed in, redirected to `/checkout`, guest cart moved to the server cart, state chosen (Kerala), shipping Rs 120, total Rs 1,610.
4. Order placed. Database check: order linked to the account, correct totals, item name and SKU saved, stock reserved, server cart emptied, profile name and phone saved, one status-history row.
5. Staff side: the order shows in `/admin/orders` and its detail page; cancelling it through the admin API released the reserved stock. The test order and the test account were then deleted.

**Test mistake worth remembering:** an earlier browser test registered a request interceptor that faked the "code sent" reply. It stayed active on the same browser page, so one later "code sent" screen was fake and no email left. Cleared with `unrouteAll`. The Supabase logs (`auth_logs`, `auth_audit_logs`) are the reliable way to confirm a real send.

**Role check:** the only account (`ba4bhoomiart@gmail.com`) is still `staff`. Its login works for orders, dashboard and most admin pages, but `/admin/settings/shipping` (admin only) redirects to the login page. To make it admin: `update profiles set role = 'admin' where email = 'ba4bhoomiart@gmail.com'`.

**Email templates not edited, and not needed:** Invite User, Change Email Address and Reauthentication are never triggered by this app.

**Still open before launch:** sender domain verified in Resend and the sender switched from the test address (the Resend test sender delivers only to the account owner), Confirm email, leaked-password protection and Site URL checked in the dashboard, real shipping fees.

## 15. Staff and admin sign-in (Nov 27)

**Behaviour.** Signing in through the storefront modal (email code, password, new account or password reset) now reads the account's role. `admin` and `staff` go to `/admin/dashboard`; customers go where the opener asked (for example `/checkout`) or stay on the page. The account menu shows "Admin dashboard" or "Staff dashboard" for those roles. The admin login page (`/admin/login`) already went to the dashboard.

**There are no separate staff pages.** Staff and admins share `/admin`. Staff can open 21 pages (dashboard, orders, returns, inventory, restock, reviews, products list, categories list, collections list, pages list, homepage, customers, analytics, settings overview). 14 pages are admin only: create and edit for products, categories, subcategories, collections and pages, refunds, SEO, and the shipping, refund-policy and WhatsApp settings.

**Accounts.** `kj.ritto@gmail.com` is `admin` and `ba4bhoomiart@gmail.com` is `staff`. The admin account was created without a password; it can sign in with an email code, or set a password through "Forgot password".

**Verified in the browser with real codes** (only the "email sent" reply was faked): admin lands on the dashboard and can open `/admin/settings/shipping`; staff lands on the dashboard, and the same shipping URL sends them back to the dashboard; a customer stays on the shop.

**Known rough edge, not changed.** The admin sidebar shows the same links to staff and admins. A staff member who clicks an admin-only link is sent to the dashboard with no message. Hiding those links for staff, or showing a "You need admin access" message, is a small follow-up.

## 16. Email delivery limit found in use (Nov 27)

A staff sign-in code to `ba4bhoomiart@gmail.com` never arrived. Supabase auth log: `gomail: could not send email 1: 550 You can only send testing emails to your own email address (kj.ritto@gmail.com)... verify a domain at resend.com/domains`. This is Resend's test-sender rule, not an app or Supabase fault. **Until a sending domain is verified in Resend, email codes work only for `kj.ritto@gmail.com`.** Other accounts can use their password.

Code change: a server error (5xx) from sign-in is now reported as "We're having trouble on our side right now, so the email may not have been sent... or sign in with your password instead." Before, it was shown as a connection problem (the auth library labels 5xx as a retryable fetch error). Real connection failures keep the old message.
