export const instant = false;
/**
 * /shop — Product listing page (A5-T3)
 *
 * Server-side filtering, sorting, and pagination.
 * searchParams: collection | category | sort | page | availability
 *
 * generateMetadata per listing page.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { listProducts } from '@/lib/db/products';
import { listCategories } from '@/lib/db/categories';
import { ProductCard } from '@/components/storefront/ProductCard';
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav';
import type { Metadata } from 'next';
import type { Database } from '@/lib/types/database';

type ProductRow = Database['public']['Tables']['products']['Row'];

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 24;

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
] as const;
type SortOption = (typeof SORT_OPTIONS)[number]['value'];

const AVAILABILITY_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'ready_to_ship', label: 'Ready to Ship' },
  { value: 'made_to_order', label: 'Made to Order' },
  { value: 'out_of_stock', label: 'Out of Stock' },
];

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const collection = typeof params.collection === 'string' ? params.collection : undefined;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bhoomiart.com';

  const collectionTitles: Record<string, string> = {
    featured: 'Featured Products',
    bestsellers: 'Best Sellers',
    'new-arrivals': 'New Arrivals',
    signature: 'Signature Collection',
  };

  const title = collection
    ? `${collectionTitles[collection] ?? 'Collection'} — Bhoomi Art`
    : 'Shop All — Bhoomi Art';
  const description =
    'Browse our complete range of handcrafted terracotta pottery and earthenware.';

  return {
    title,
    description,
    openGraph: { title, description, url: `${siteUrl}/shop` },
    alternates: { canonical: `${siteUrl}/shop` },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  const sort = (typeof params.sort === 'string' ? params.sort : 'newest') as SortOption;
  const page = Math.max(1, parseInt(typeof params.page === 'string' ? params.page : '1', 10));
  const collection = typeof params.collection === 'string' ? params.collection : undefined;
  const availability = typeof params.availability === 'string' ? params.availability : 'all';

  // Sort map
  const sortMap: Record<SortOption, { orderBy: keyof ProductRow; ascending: boolean }> = {
    newest: { orderBy: 'created_at', ascending: false },
    price_asc: { orderBy: 'price', ascending: true },
    price_desc: { orderBy: 'price', ascending: false },
  };
  const { orderBy, ascending } = sortMap[sort] ?? sortMap.newest;

  const offset = (page - 1) * PAGE_SIZE;

  return (
    <div className="container-brand py-[var(--spacing-8)] md:py-[var(--spacing-12)]">
      <BreadcrumbNav
        items={[{ label: 'Home', href: '/' }, { label: 'Shop' }]}
        className="mb-[var(--spacing-6)]"
      />

      <div className="flex items-center justify-between flex-wrap gap-[var(--spacing-4)] mb-[var(--spacing-8)]">
        <h1 className="heading-2">{collection ? collectionLabel(collection) : 'Shop All'}</h1>

        {/* Sort selector */}
        <form method="GET" action="/shop" className="flex items-center gap-[var(--spacing-2)]">
          {/* Preserve other params */}
          {collection && <input type="hidden" name="collection" value={collection} />}
          {availability !== 'all' && (
            <input type="hidden" name="availability" value={availability} />
          )}
          <label
            htmlFor="sort-select"
            className="text-[var(--font-size-sm)] text-[var(--color-earth-600)]"
          >
            Sort:
          </label>
          <select
            id="sort-select"
            name="sort"
            defaultValue={sort}
            className="text-[var(--font-size-sm)] border border-[var(--color-earth-200)] rounded-[var(--radius-md)] px-[var(--spacing-3)] py-[var(--spacing-2)] bg-white text-[var(--color-earth-800)] focus:outline-none focus:border-[var(--color-brand-primary)]"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-[var(--spacing-3)] py-[var(--spacing-2)] rounded-[var(--radius-md)] bg-[var(--color-brand-primary)] text-white text-[var(--font-size-xs)] font-semibold hover:bg-[var(--color-earth-700)] transition-colors"
          >
            Apply
          </button>
        </form>
      </div>

      {/* Availability filter tabs */}
      <div className="flex gap-[var(--spacing-2)] mb-[var(--spacing-8)] overflow-x-auto pb-1">
        {AVAILABILITY_OPTIONS.map((opt) => {
          const href = buildHref({ sort, collection, availability: opt.value, page: 1 });
          const active = availability === opt.value;
          return (
            <Link
              key={opt.value}
              href={href}
              className={`shrink-0 px-[var(--spacing-4)] py-[var(--spacing-2)] rounded-[var(--radius-full)] text-[var(--font-size-sm)] font-semibold border transition-colors ${
                active
                  ? 'bg-[var(--color-brand-primary)] border-[var(--color-brand-primary)] text-white'
                  : 'border-[var(--color-earth-200)] text-[var(--color-earth-600)] hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)]'
              }`}
            >
              {opt.label}
            </Link>
          );
        })}
      </div>

      {/* Collection filter chips */}
      <div className="flex gap-[var(--spacing-2)] mb-[var(--spacing-8)] flex-wrap">
        {[
          { value: undefined, label: 'All Products' },
          { value: 'featured', label: 'Featured' },
          { value: 'bestsellers', label: 'Bestsellers' },
          { value: 'new-arrivals', label: 'New Arrivals' },
          { value: 'signature', label: 'Signature' },
        ].map((opt) => {
          const active = collection === opt.value;
          const href = buildHref({ sort, collection: opt.value, availability, page: 1 });
          return (
            <Link
              key={opt.label}
              href={href}
              className={`px-[var(--spacing-4)] py-[var(--spacing-1-5)] rounded-[var(--radius-full)] text-[var(--font-size-xs)] font-semibold border transition-colors ${
                active
                  ? 'bg-[var(--color-earth-800)] border-[var(--color-earth-800)] text-white'
                  : 'border-[var(--color-earth-200)] text-[var(--color-earth-500)] hover:border-[var(--color-earth-500)] hover:text-[var(--color-earth-800)]'
              }`}
            >
              {opt.label}
            </Link>
          );
        })}
      </div>

      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductGridContent
          sort={sort}
          orderBy={orderBy}
          ascending={ascending}
          offset={offset}
          page={page}
          collection={collection}
          availability={availability}
        />
      </Suspense>
    </div>
  );
}

// ─── Product grid content ─────────────────────────────────────────────────────

async function ProductGridContent({
  sort,
  orderBy,
  ascending,
  offset,
  page,
  collection,
  availability,
}: {
  sort: SortOption;
  orderBy: keyof ProductRow;
  ascending: boolean;
  offset: number;
  page: number;
  collection: string | undefined;
  availability: string;
}) {
  const supabase = await createClient();

  // Build query depending on collection flag
  let products: ProductRow[] = [];
  let total = 0;

  if (collection) {
    // Get collection slug → products
    const { data: collData, error: collError } = await supabase
      .from('collections')
      .select(
        `
        collection_products(
          display_order,
          products(*, product_media(url, alt_text, media_type, display_order))
        )
      `
      )
      .eq('slug', collection)
      .eq('is_visible', true)
      .single();

    if (collError || !collData) {
      // Silently fall back to all products if collection not found
    } else {
      type CPRow = {
        display_order: number;
        products:
          | (ProductRow & {
              product_media: {
                url: string;
                alt_text: string | null;
                media_type: string;
                display_order: number;
              }[];
            })
          | null;
      };
      const rows = (collData.collection_products as CPRow[]) ?? [];
      const rawProducts = rows
        .sort((a, b) => a.display_order - b.display_order)
        .map((r) => r.products)
        .filter(Boolean) as (ProductRow & {
        product_media: {
          url: string;
          alt_text: string | null;
          media_type: string;
          display_order: number;
        }[];
      })[];

      products = rawProducts.filter(
        (p) => availability === 'all' || p.availability_type === availability
      ) as ProductRow[];
      total = products.length;
      products = products.slice(offset, offset + PAGE_SIZE);
    }
  }

  // If no collection or collection query fell back
  if (!collection) {
    const avail =
      availability !== 'all'
        ? (availability as 'ready_to_ship' | 'made_to_order' | 'out_of_stock')
        : undefined;

    let query = supabase
      .from('products')
      .select('*, product_media(url, alt_text, media_type, display_order)', { count: 'exact' })
      .eq('status', 'active')
      .order(orderBy as string, { ascending })
      .range(offset, offset + PAGE_SIZE - 1);

    if (avail) query = query.eq('availability_type', avail);

    const { data, error, count: cnt } = await query;
    if (error) throw new Error(`ShopPage: ${error.message}`);
    products = (data ?? []) as ProductRow[];
    total = cnt ?? 0;
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-[var(--spacing-16)] text-center">
        <p className="text-[var(--font-size-lg)] font-semibold text-[var(--color-earth-700)] mb-[var(--spacing-2)]">
          No products found.
        </p>
        <p className="body-small mb-[var(--spacing-6)]">
          Try a different filter or browse all products.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-[var(--spacing-2)] px-[var(--spacing-6)] py-[var(--spacing-3)] rounded-[var(--radius-button)] bg-[var(--color-brand-primary)] text-white font-semibold hover:bg-[var(--color-earth-700)] transition-colors"
        >
          View All Products
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="text-[var(--font-size-xs)] text-[var(--color-earth-500)] mb-[var(--spacing-4)]">
        {total} product{total !== 1 ? 's' : ''}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[var(--spacing-4)] md:gap-[var(--spacing-6)]">
        {(
          products as (ProductRow & {
            product_media: {
              url: string;
              alt_text: string | null;
              media_type: string;
              display_order: number;
            }[];
          })[]
        ).map((p, i) => (
          <ProductCard
            key={p.id}
            product={{
              ...p,
              product_media: p.product_media ?? [],
            }}
            priority={i < 4}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          sort={sort}
          collection={collection}
          availability={availability}
        />
      )}
    </>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  sort,
  collection,
  availability,
}: {
  page: number;
  totalPages: number;
  sort: SortOption;
  collection: string | undefined;
  availability: string;
}) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visible = pages.filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2);

  return (
    <nav
      aria-label="Pagination"
      className="flex justify-center gap-[var(--spacing-2)] mt-[var(--spacing-12)]"
    >
      {page > 1 && (
        <Link
          href={buildHref({ sort, collection, availability, page: page - 1 })}
          className="px-[var(--spacing-4)] py-[var(--spacing-2)] rounded-[var(--radius-md)] border border-[var(--color-earth-200)] text-[var(--font-size-sm)] text-[var(--color-earth-700)] hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)] transition-colors"
          aria-label="Previous page"
        >
          ←
        </Link>
      )}
      {visible.map((p, i) => {
        const prev = visible[i - 1];
        const showEllipsis = prev != null && p - prev > 1;
        return (
          <span key={p} className="flex items-center gap-[var(--spacing-2)]">
            {showEllipsis && <span className="text-[var(--color-earth-400)] px-1">…</span>}
            <Link
              href={buildHref({ sort, collection, availability, page: p })}
              aria-current={p === page ? 'page' : undefined}
              className={`w-9 h-9 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--font-size-sm)] font-semibold border transition-colors ${
                p === page
                  ? 'bg-[var(--color-brand-primary)] border-[var(--color-brand-primary)] text-white'
                  : 'border-[var(--color-earth-200)] text-[var(--color-earth-700)] hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)]'
              }`}
            >
              {p}
            </Link>
          </span>
        );
      })}
      {page < totalPages && (
        <Link
          href={buildHref({ sort, collection, availability, page: page + 1 })}
          className="px-[var(--spacing-4)] py-[var(--spacing-2)] rounded-[var(--radius-md)] border border-[var(--color-earth-200)] text-[var(--font-size-sm)] text-[var(--color-earth-700)] hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)] transition-colors"
          aria-label="Next page"
        >
          →
        </Link>
      )}
    </nav>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildHref({
  sort,
  collection,
  availability,
  page,
}: {
  sort: SortOption;
  collection: string | undefined;
  availability: string;
  page: number;
}): string {
  const p = new URLSearchParams();
  if (sort !== 'newest') p.set('sort', sort);
  if (collection) p.set('collection', collection);
  if (availability !== 'all') p.set('availability', availability);
  if (page > 1) p.set('page', String(page));
  const q = p.toString();
  return q ? `/shop?${q}` : '/shop';
}

function collectionLabel(collection: string): string {
  const map: Record<string, string> = {
    featured: 'Featured Pieces',
    bestsellers: 'Best Sellers',
    'new-arrivals': 'New Arrivals',
    signature: 'Signature Collection',
  };
  return map[collection] ?? 'Collection';
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[var(--spacing-4)] md:gap-[var(--spacing-6)]">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-[var(--spacing-3)]">
          <div className="aspect-square rounded-[var(--radius-image)] bg-[var(--color-earth-100)] animate-pulse-soft" />
          <div className="h-4 bg-[var(--color-earth-100)] rounded animate-pulse-soft" />
          <div className="h-4 w-20 bg-[var(--color-earth-100)] rounded animate-pulse-soft" />
        </div>
      ))}
    </div>
  );
}
