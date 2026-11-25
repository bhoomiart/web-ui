export const instant = false;
/**
 * /category/[slug]/[sub] — Subcategory page (A5-T2-2)
 */

import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { getCategoryBySlug, getSubcategoryBySlug } from '@/lib/db/categories';
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
  params: Promise<{ slug: string; sub: string }>;
}): Promise<Metadata> {
  const { slug, sub } = await params;
  const [category, subcategory] = await Promise.all([
    getCategoryBySlug(slug),
    getSubcategoryBySlug(sub),
  ]);
  if (!category || !subcategory) return {};

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bhoomiart.com';
  const title = `${subcategory.seo_title ?? subcategory.name} — ${category.name} — Bhoomi Art`;
  const description =
    subcategory.seo_description ??
    `Shop ${subcategory.name} from our ${category.name} collection — handcrafted terracotta by Bhoomi Art.`;
  const canonical = `${siteUrl}/category/${slug}/${sub}`;

  return {
    title,
    description,
    openGraph: { title, description, url: canonical },
    alternates: { canonical },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SubcategoryPage({
  params,
}: {
  params: Promise<{ slug: string; sub: string }>;
}) {
  const { slug, sub } = await params;
  const [category, subcategory] = await Promise.all([
    getCategoryBySlug(slug),
    getSubcategoryBySlug(sub),
  ]);

  if (!category || !subcategory || subcategory.category_id !== category.id) notFound();

  return (
    <div>
      {/* Header */}
      <div
        className="relative overflow-hidden min-h-[200px] flex items-end"
        style={{
          background:
            'linear-gradient(135deg, var(--color-earth-600) 0%, var(--color-earth-800) 100%)',
        }}
      >
        {subcategory.image_url && (
          <Image
            src={subcategory.image_url}
            alt={subcategory.name}
            fill
            className="object-cover opacity-25"
            sizes="100vw"
          />
        )}
        <div className="relative z-10 container-brand py-[var(--spacing-10)]">
          <BreadcrumbNav
            items={[
              { label: 'Home', href: '/' },
              { label: 'Shop', href: '/shop' },
              { label: category.name, href: `/category/${slug}` },
              { label: subcategory.name },
            ]}
            className="mb-[var(--spacing-4)] [&_a]:text-[var(--color-earth-300)] [&_svg]:text-[var(--color-earth-500)]"
          />
          <h1 className="heading-2 text-white">{subcategory.name}</h1>
          {subcategory.description && (
            <p className="body-large text-[var(--color-earth-200)] mt-[var(--spacing-2)] max-w-xl">
              {subcategory.description}
            </p>
          )}
        </div>
      </div>

      <div className="container-brand py-[var(--spacing-10)]">
        <Suspense fallback={<ProductGridSkeleton />}>
          <SubcategoryProducts subcategoryId={subcategory.id} />
        </Suspense>
      </div>
    </div>
  );
}

async function SubcategoryProducts({ subcategoryId }: { subcategoryId: string }) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('product_subcategory_map')
    .select('products(*, product_media(url, alt_text, media_type, display_order))')
    .eq('subcategory_id', subcategoryId);

  if (error) throw new Error(`SubcategoryProducts: ${error.message}`);

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
          No products here yet.
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
