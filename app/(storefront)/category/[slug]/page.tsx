export const instant = false;
/**
 * /category/[slug] — Category page (A5-T2-1)
 *
 * Shows category header, description, subcategory grid, and products in that category.
 * generateMetadata with canonical URL and Schema.org BreadcrumbList.
 */

import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { getCategoryBySlug, listSubcategories } from '@/lib/db/categories';
import { createClient } from '@/lib/supabase/server';
import { ProductCard } from '@/components/storefront/ProductCard';
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav';
import type { Metadata } from 'next';
import type { Database } from '@/lib/types/database';

type ProductRow = Database['public']['Tables']['products']['Row'];

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bhoomiart.com';
  const title = `${category.seo_title ?? category.name} — Bhoomi Art`;
  const description =
    category.seo_description ??
    `Shop ${category.name} — handcrafted terracotta pottery by Bhoomi Art.`;
  const canonical = `${siteUrl}/category/${slug}`;

  return {
    title,
    description,
    openGraph: { title, description, url: canonical },
    alternates: { canonical },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [category, subcategories] = await Promise.all([
    getCategoryBySlug(slug),
    listSubcategories(undefined).then((all) => all), // filter below
  ]);

  if (!category) notFound();

  const catSubcategories = subcategories.filter((s) => s.category_id === category.id);

  return (
    <div>
      {/* Category header */}
      <div
        className="relative overflow-hidden min-h-[240px] flex items-end"
        style={{
          background:
            'linear-gradient(135deg, var(--color-earth-700) 0%, var(--color-brand-primary) 100%)',
        }}
      >
        {category.image_url && (
          <Image
            src={category.image_url}
            alt={category.name}
            fill
            className="object-cover opacity-30"
            sizes="100vw"
          />
        )}
        <div className="relative z-10 container-brand py-[var(--spacing-12)]">
          <BreadcrumbNav
            items={[
              { label: 'Home', href: '/' },
              { label: 'Shop', href: '/shop' },
              { label: category.name },
            ]}
            className="mb-[var(--spacing-4)] [&_a]:text-[var(--color-earth-300)] [&_svg]:text-[var(--color-earth-500)]"
          />
          <h1 className="heading-1 text-white">{category.name}</h1>
          {category.description && (
            <p className="body-large text-[var(--color-earth-200)] mt-[var(--spacing-3)] max-w-2xl">
              {category.description}
            </p>
          )}
        </div>
      </div>

      <div className="container-brand py-[var(--spacing-10)]">
        {/* Subcategory grid */}
        {catSubcategories.length > 0 && (
          <section aria-labelledby="subcats-heading" className="mb-[var(--spacing-12)]">
            <h2 id="subcats-heading" className="heading-4 mb-[var(--spacing-6)]">
              Browse by Style
            </h2>
            <div className="flex flex-wrap gap-[var(--spacing-3)]">
              {catSubcategories.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/category/${slug}/${sub.slug}`}
                  className="group flex items-center gap-[var(--spacing-2)] px-[var(--spacing-5)] py-[var(--spacing-3)] rounded-[var(--radius-full)] border border-[var(--color-earth-200)] bg-white hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)] transition-colors text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-700)]"
                >
                  {sub.image_url && (
                    <Image
                      src={sub.image_url}
                      alt=""
                      width={24}
                      height={24}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  )}
                  {sub.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Products */}
        <Suspense fallback={<ProductGridSkeleton />}>
          <CategoryProducts categoryId={category.id} />
        </Suspense>
      </div>
    </div>
  );
}

async function CategoryProducts({ categoryId }: { categoryId: string }) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('product_category_map')
    .select('products(*, product_media(url, alt_text, media_type, display_order))')
    .eq('category_id', categoryId);

  if (error) throw new Error(`CategoryProducts: ${error.message}`);

  type PRow = ProductRow & {
    product_media: {
      url: string;
      alt_text: string | null;
      media_type: string;
      display_order: number;
    }[];
  };
  const products = ((data ?? []).map((r) => r.products).filter(Boolean) as PRow[]).filter(
    (p) => p.status === 'active'
  );

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-[var(--spacing-16)] text-center">
        <p className="text-[var(--font-size-lg)] font-semibold text-[var(--color-earth-700)] mb-[var(--spacing-2)]">
          No products in this category yet.
        </p>
        <Link
          href="/shop"
          className="text-[var(--font-size-sm)] text-[var(--color-brand-primary)] hover:underline font-semibold"
        >
          Browse all products →
        </Link>
      </div>
    );
  }

  return (
    <section aria-label="Products">
      <p className="text-[var(--font-size-xs)] text-[var(--color-earth-500)] mb-[var(--spacing-4)]">
        {products.length} product{products.length !== 1 ? 's' : ''}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[var(--spacing-4)] md:gap-[var(--spacing-6)]">
        {products.map((p, i) => (
          <ProductCard
            key={p.id}
            product={{ ...p, product_media: p.product_media ?? [] }}
            priority={i < 4}
          />
        ))}
      </div>
    </section>
  );
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
