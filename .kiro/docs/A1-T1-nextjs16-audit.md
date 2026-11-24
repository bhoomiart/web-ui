# A1-T1 · Next.js 16 API Audit

> Internal reference document. Read before writing any Next.js code for Bhoomi Art.
> Source: `node_modules/next/dist/docs/`

---

## 1. The Single Biggest Change — `middleware.ts` is DEAD

**`middleware.ts` has been renamed to `proxy.ts` in Next.js 16.**

The exported function name also changes from `middleware` to `proxy`.

```ts
// ❌ Old — will not work in Next.js 16
// middleware.ts
export function middleware(request: NextRequest) { ... }

// ✅ New — Next.js 16
// proxy.ts
export function proxy(request: NextRequest) { ... }
```

The config export with `matcher` is identical. Everything else works the same.

**Impact on Bhoomi Art:** Our admin route protection file must be `proxy.ts`, not `middleware.ts`.
The existing project has no middleware file yet, so there is nothing to migrate — just write `proxy.ts` from the start.

Auto-migration command (if ever needed):

```bash
npx @next/codemod@canary middleware-to-proxy .
```

A new type `NextProxy` is also available for concise typing:

```ts
import type { NextProxy } from 'next/server'
export const proxy: NextProxy = (request, event) => { ... }
```

---

## 2. `params` and `searchParams` are Promises

Both `params` and `searchParams` props in layouts and pages are now **async Promises**, not plain objects.

```ts
// ❌ Old (Next.js 14 / common training data)
export default function Page({ params }: { params: { slug: string } }) {
  const { slug } = params; // synchronous access
}

// ✅ New (Next.js 16)
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; // must await
}
```

For **Client Components** that cannot be async, use React's `use()`:

```ts
'use client';
import { use } from 'react';

export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
}
```

**Impact on Bhoomi Art:** Every page and layout with dynamic segments (`[slug]`, `[id]`, etc.) must `await params`. This applies to:

- `/category/[slug]/page.tsx`
- `/category/[slug]/[sub]/page.tsx`
- `/product/[slug]/page.tsx`
- `/order/[number]/page.tsx`
- `/admin/products/[id]/page.tsx`
- All `generateMetadata` functions that read params

---

## 3. `LayoutProps` and `PageProps` Global Helpers

New globally available typed helpers — **no import needed after `next dev` or `next build` runs `next typegen`**.

```ts
// LayoutProps — for layout files
export default function Layout(props: LayoutProps<'/dashboard'>) {
  // props.children is typed
  // props.params is Promise<{ ... }> inferred from path
}

// PageProps — for page files
export default async function Page(props: PageProps<'/product/[slug]'>) {
  const { slug } = await props.params;
  const filters = await props.searchParams;
}
```

The route literal string (e.g. `'/product/[slug]'`) enables autocomplete and strict typing for params keys.

**Impact on Bhoomi Art:** Use `PageProps<'/route'>` and `LayoutProps<'/route'>` everywhere instead of manually typing `params: Promise<{ slug: string }>`. Cleaner and type-safe.

---

## 4. Caching — Brand New Model (`use cache` directive)

The project already has `cacheComponents: true` and `partialPrefetching: true` in `next.config.ts`. This enables the **new Cache Components model** (Partial Prerendering / PPR).

### How caching works now

The old `fetch` cache options (`{ next: { revalidate: 60 } }`) are **replaced** by the `'use cache'` directive:

```ts
// Cache a data-fetching function
import { cacheLife } from 'next/cache'

export async function getProducts() {
  'use cache'
  cacheLife('hours')  // revalidate every hour
  return db.query('SELECT * FROM products WHERE status = $1', ['active'])
}

// Cache an entire page or component
export default async function ProductPage() {
  'use cache'
  cacheLife('minutes')
  const products = await getProducts()
  return <ProductList products={products} />
}
```

### Runtime / dynamic data must use `<Suspense>`

Data that changes per request (cookies, user-specific, real-time stock) is NOT wrapped in `use cache`. Wrap it in `<Suspense>` instead:

```tsx
export default function Page() {
  return (
    <>
      <StaticHero /> {/* included in static shell */}
      <Suspense fallback={<Spinner />}>
        <LiveStockStatus /> {/* streams at request time */}
      </Suspense>
    </>
  );
}
```

### Key rule for Bhoomi Art

| Data type                          | Strategy                                  |
| ---------------------------------- | ----------------------------------------- |
| Product catalogue (changes rarely) | `'use cache'` + `cacheLife('hours')`      |
| Category/homepage sections         | `'use cache'` + `cacheLife('hours')`      |
| Order status (per-user)            | `<Suspense>` — no cache                   |
| Cart contents                      | Client-side only (Zustand + localStorage) |
| Stock counts on product page       | `<Suspense>` — streams fresh              |
| Admin dashboard metrics            | `<Suspense>` — streams fresh              |

### Cache invalidation after mutations

After an admin updates a product, call `revalidateTag` or `revalidatePath` from the Server Action:

```ts
'use server';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function updateProduct(id: string, data: FormData) {
  // ... update DB
  revalidatePath(`/product/${slug}`);
  revalidateTag('products');
}
```

Or use `refresh()` from `next/cache` to refresh the current route without full cache busting.

---

## 5. Server Actions (called "Server Functions" in the docs)

The `'use server'` directive is unchanged, but the docs now call them **Server Functions** (broader term). "Server Action" refers specifically to those used for form submissions.

```ts
// app/actions/products.ts
'use server';

export async function createProduct(formData: FormData) {
  // Always verify auth inside — do NOT rely on proxy alone
  const session = await getSession();
  if (!session?.user) throw new Error('Unauthorized');

  // mutate DB
  revalidatePath('/admin/products');
  redirect('/admin/products');
}
```

**Critical warning from the docs:**

> Server Functions are reachable via direct POST requests, not just through your application's UI. Always verify authentication and authorization inside every Server Function.

**Impact on Bhoomi Art:** Every Server Action in `app/actions/` must call `requireAdmin()` or `requireStaff()` at the top — never rely on proxy/middleware alone.

---

## 6. `generateMetadata` — Works the Same, with One Nuance

`generateMetadata` is unchanged in API, but with Cache Components enabled, if you use `'use cache'` inside it, the returned `Metadata` object must be **serializable** (no `URL` instances — use strings):

```ts
// ❌ Will fail with use cache
return { metadataBase: new URL('https://bhoomiart.com') };

// ✅ Correct with use cache
return { metadataBase: 'https://bhoomiart.com' };
```

Params in `generateMetadata` are also Promises now — must be awaited:

```ts
export async function generateMetadata({
  params,
}: PageProps<'/product/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  return {
    title: `${product.name} | Bhoomi Art`,
    description: product.seo_description,
  };
}
```

---

## 7. Font Loading — Unchanged API, Variable Fonts Preferred

`next/font/google` works the same. The existing setup in `app/layout.tsx` is correct.

Docs recommend **variable fonts** for best performance. Neither Playfair Display nor Lato are variable fonts, so the explicit `weight` arrays we're already passing are correct.

No changes needed to font configuration.

---

## 8. Route Groups — Unchanged

Route groups `(storefront)` and `(admin)` work exactly as in Next.js 13+. No changes needed.

One note from the docs: navigating **across** multiple root layouts (e.g. from a storefront page to an admin page) causes a **full page load**, not a client-side transition. This is expected and fine for our use case — admin and storefront are intentionally separate experiences.

---

## 9. `proxy.ts` for Admin Route Protection — Pattern

Here is the correct pattern for protecting admin routes in Next.js 16:

```ts
// proxy.ts  (at project root)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const session = request.cookies.get('sb-access-token');
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
```

Note: proxy only checks for the cookie's existence. Full role verification must still happen inside each Server Action via `requireAdmin()`.

---

## 10. `cookies()` and `headers()` — Must Be Awaited

```ts
// ❌ Old
const cookieStore = cookies();
const token = cookieStore.get('token');

// ✅ Next.js 16
const cookieStore = await cookies();
const token = cookieStore.get('token');
```

Same for `headers()`. This was introduced in Next.js 15 — still required in 16.

---

## Summary Checklist for All Agents

| Thing to remember         | Rule                                                                 |
| ------------------------- | -------------------------------------------------------------------- |
| Middleware file           | Use `proxy.ts`, export `proxy()` function                            |
| Dynamic route params      | Always `await params` — it's a Promise                               |
| Search params             | Always `await searchParams` — it's a Promise                         |
| Page/Layout typing        | Use `PageProps<'/route'>` and `LayoutProps<'/route'>`                |
| Caching                   | Use `'use cache'` + `cacheLife()`, not `fetch` cache options         |
| Dynamic data              | Wrap in `<Suspense>` — do not use `'use cache'` for per-request data |
| Cache invalidation        | Call `revalidatePath()` or `revalidateTag()` in Server Actions       |
| Server Actions            | Always verify auth inside — never trust proxy alone                  |
| `generateMetadata`        | Await params; return serializable object when using `use cache`      |
| `cookies()` / `headers()` | Must be awaited                                                      |
| Font loading              | Existing setup is correct — no changes needed                        |
| Route groups              | Work as expected — cross-root-layout nav causes full page reload     |
