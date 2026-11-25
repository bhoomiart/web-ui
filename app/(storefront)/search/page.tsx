export const instant = false;
/**
 * /search?q= — Search results page (A5-T6)
 *
 * Server-side full-text search via Postgres websearch.
 * Shows query, result count, product grid, or empty state.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { searchProducts } from '@/lib/db/products';
import { ProductCard } from '@/components/storefront/ProductCard';
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav';
import { SearchInput } from './SearchInput';
import type { Metadata } from 'next';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q : '';
  return {
    title: q ? `"${q}" — Search — Bhoomi Art` : 'Search — Bhoomi Art',
    robots: { index: false }, // Don't index search pages
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const query = typeof params.q === 'string' ? params.q.trim() : '';

  return (
    <div className="container-brand py-[var(--spacing-8)] md:py-[var(--spacing-12)]">
      <BreadcrumbNav
        items={[{ label: 'Home', href: '/' }, { label: 'Search' }]}
        className="mb-[var(--spacing-6)]"
      />

      <h1 className="heading-2 mb-[var(--spacing-6)]">
        {query ? <>Search results for &ldquo;{query}&rdquo;</> : 'Search'}
      </h1>

      {/* Search input */}
      <div className="max-w-xl mb-[var(--spacing-8)]">
        <SearchInput initialQuery={query} />
      </div>

      {query ? (
        <Suspense
          fallback={
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[var(--spacing-4)] md:gap-[var(--spacing-6)]">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-[var(--spacing-3)]">
                  <div className="aspect-square rounded-[var(--radius-image)] bg-[var(--color-earth-100)] animate-pulse-soft" />
                  <div className="h-4 bg-[var(--color-earth-100)] rounded animate-pulse-soft" />
                </div>
              ))}
            </div>
          }
        >
          <SearchResults query={query} />
        </Suspense>
      ) : (
        <div className="text-center py-[var(--spacing-16)]">
          <p className="body-large text-[var(--color-earth-500)] mb-[var(--spacing-6)]">
            Enter a product name, style, or material to search our collection.
          </p>
          <div className="flex flex-wrap justify-center gap-[var(--spacing-2)]">
            {['Planter', 'Vase', 'Wall art', 'Terracotta pot', 'Garden décor'].map((suggestion) => (
              <Link
                key={suggestion}
                href={`/search?q=${encodeURIComponent(suggestion)}`}
                className="px-[var(--spacing-4)] py-[var(--spacing-2)] rounded-[var(--radius-full)] border border-[var(--color-earth-200)] text-[var(--font-size-sm)] text-[var(--color-earth-600)] hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)] transition-colors"
              >
                {suggestion}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

async function SearchResults({ query }: { query: string }) {
  const results = await searchProducts(query, 24);

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-[var(--spacing-16)] text-center">
        <svg
          aria-hidden="true"
          className="w-12 h-12 text-[var(--color-earth-300)] mb-[var(--spacing-4)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1"
        >
          <circle cx="11" cy="11" r="7" />
          <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
        </svg>
        <p className="text-[var(--font-size-lg)] font-semibold text-[var(--color-earth-700)] mb-[var(--spacing-2)]">
          No results for &ldquo;{query}&rdquo;
        </p>
        <p className="body-small mb-[var(--spacing-6)]">
          Try a different spelling, or browse our shop instead.
        </p>
        <div className="flex flex-wrap justify-center gap-[var(--spacing-4)]">
          <Link
            href="/shop"
            className="inline-flex items-center gap-[var(--spacing-2)] px-[var(--spacing-6)] py-[var(--spacing-3)] rounded-[var(--radius-button)] bg-[var(--color-brand-primary)] text-white font-semibold hover:bg-[var(--color-earth-700)] transition-colors"
          >
            Browse All Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <p className="text-[var(--font-size-xs)] text-[var(--color-earth-500)] mb-[var(--spacing-4)]">
        {results.length} result{results.length !== 1 ? 's' : ''}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[var(--spacing-4)] md:gap-[var(--spacing-6)]">
        {results.map((p, i) => (
          <ProductCard
            key={p.id}
            product={{
              id: p.id,
              name: p.name,
              slug: p.slug,
              price: p.price,
              availability_type: p.availability_type,
              product_media: (p.product_media ?? []) as Array<{
                url: string;
                alt_text: string | null;
              }>,
            }}
            priority={i < 4}
          />
        ))}
      </div>
    </>
  );
}
