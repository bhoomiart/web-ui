export const instant = false;
/**
 * /collections — all visible collections.
 * Each card links to /shop?collection=<slug>, which already renders a collection's products.
 */

import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bhoomiart.com';

export const metadata: Metadata = {
  title: 'Collections',
  description:
    'Explore Bhoomi Art collections: signature pieces, best sellers, new arrivals and more.',
  openGraph: { title: 'Collections — Bhoomi Art', url: `${siteUrl}/collections` },
  alternates: { canonical: `${siteUrl}/collections` },
};

export default async function CollectionsPage() {
  const supabase = await createClient();
  const { data: collections, error } = await supabase
    .from('collections')
    .select('id, name, slug, description, image_url')
    .eq('is_visible', true)
    .order('name');

  if (error) throw new Error(`CollectionsPage: ${error.message}`);

  return (
    <div>
      <div
        className="min-h-[220px] flex items-end pb-[var(--spacing-10)]"
        style={{
          background:
            'linear-gradient(135deg, var(--color-earth-700) 0%, var(--color-brand-primary) 100%)',
        }}
      >
        <div className="container-brand">
          <BreadcrumbNav
            items={[{ label: 'Home', href: '/' }, { label: 'Collections' }]}
            className="mb-[var(--spacing-4)] [&_a]:text-[var(--color-earth-300)]"
          />
          <h1 className="heading-1 text-white">Collections</h1>
        </div>
      </div>

      <div className="container-brand py-[var(--spacing-12)]">
        {!collections || collections.length === 0 ? (
          <div className="text-center py-[var(--spacing-16)]">
            <p className="text-[var(--font-size-lg)] font-semibold text-[var(--color-earth-700)] mb-[var(--spacing-2)]">
              No collections yet.
            </p>
            <Link
              href="/shop"
              className="text-[var(--font-size-sm)] text-[var(--color-brand-primary)] hover:underline font-semibold"
            >
              Browse all products →
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[var(--spacing-6)]">
            {collections.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/shop?collection=${encodeURIComponent(c.slug)}`}
                  className="group relative block overflow-hidden rounded-[var(--radius-lg)] min-h-[220px] shadow-[var(--shadow-card)]"
                  style={{
                    background:
                      'linear-gradient(135deg, var(--color-earth-800) 0%, var(--color-brand-primary) 100%)',
                  }}
                >
                  {c.image_url && (
                    <Image
                      src={c.image_url}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover opacity-40 group-hover:opacity-50 transition-opacity"
                    />
                  )}
                  <div className="relative z-10 flex flex-col justify-end h-full min-h-[220px] p-[var(--spacing-6)]">
                    <h2 className="heading-3 text-white">{c.name}</h2>
                    {c.description && (
                      <p className="mt-[var(--spacing-2)] text-[var(--color-earth-200)] line-clamp-2">
                        {c.description}
                      </p>
                    )}
                    <span className="mt-[var(--spacing-3)] text-[var(--font-size-sm)] font-semibold text-white">
                      View collection →
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
