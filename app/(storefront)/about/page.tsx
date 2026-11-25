export const instant = false;
/**
 * /about — Our Story (A5-T5-1)
 * Content driven by site_settings and a static fallback.
 */

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav';
import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bhoomiart.com';

export const metadata: Metadata = {
  title: 'Our Story — Bhoomi Art',
  description:
    'Learn about Bhoomi Art — where terracotta meets tradition. Handcrafted pottery born from the earth, shaped by skilled artisans.',
  openGraph: { title: 'Our Story — Bhoomi Art', url: `${siteUrl}/about` },
  alternates: { canonical: `${siteUrl}/about` },
};

export default async function AboutPage() {
  const supabase = await createClient();
  const { data: page } = await supabase
    .from('pages')
    .select('title, body')
    .eq('slug', 'about')
    .eq('is_published', true)
    .single();

  return (
    <div>
      {/* Hero */}
      <div
        className="min-h-[280px] flex items-end pb-[var(--spacing-12)]"
        style={{
          background:
            'linear-gradient(135deg, var(--color-earth-800) 0%, var(--color-brand-primary) 100%)',
        }}
      >
        <div className="container-brand">
          <BreadcrumbNav
            items={[{ label: 'Home', href: '/' }, { label: 'Our Story' }]}
            className="mb-[var(--spacing-4)] [&_a]:text-[var(--color-earth-300)]"
          />
          <h1 className="heading-1 text-white">Our Story</h1>
        </div>
      </div>

      <div className="container-brand py-[var(--spacing-16)] max-w-4xl">
        {page?.body ? (
          <div className="prose max-w-none body-large text-[var(--color-earth-700)] whitespace-pre-wrap">
            {page.body}
          </div>
        ) : (
          <>
            <p className="label-uppercase text-[var(--color-brand-primary)] mb-[var(--spacing-4)]">
              Who We Are
            </p>
            <h2 className="heading-2 mb-[var(--spacing-8)]">Born from the Earth</h2>

            <div className="space-y-[var(--spacing-6)] body-large text-[var(--color-earth-700)]">
              <p>
                Bhoomi Art began with a simple question: what if everyday objects could carry the
                warmth of the earth itself? Founded by artisans with a deep love for terracotta, we
                set out to create pieces that celebrate the most ancient of materials — clay.
              </p>
              <p>
                Every pot, vase, and sculpture we craft is a conversation between the maker&apos;s
                hands and the earth beneath. We work with natural terracotta clay, shaped by
                artisans who have inherited the knowledge of generations before them.
              </p>
              <p>
                We believe in slow craft — in taking the time to get every curve, every texture,
                every glaze exactly right. In a world of mass production, Bhoomi Art is a commitment
                to making things that last, that mean something, that bring a little of the
                earth&apos;s beauty into your home.
              </p>
              <p>
                Based in India, we work with local artisans and source our materials thoughtfully.
                Each purchase supports a living tradition and the families that keep it alive.
              </p>
            </div>

            <div className="mt-[var(--spacing-12)] flex flex-wrap gap-[var(--spacing-4)]">
              <Link
                href="/craft"
                className="inline-flex items-center gap-[var(--spacing-2)] px-[var(--spacing-6)] py-[var(--spacing-3)] rounded-[var(--radius-button)] bg-[var(--color-brand-primary)] text-white font-semibold hover:bg-[var(--color-earth-700)] transition-colors"
              >
                The Art of Terracotta →
              </Link>
              <Link
                href="/shop"
                className="inline-flex items-center gap-[var(--spacing-2)] px-[var(--spacing-6)] py-[var(--spacing-3)] rounded-[var(--radius-button)] border border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] font-semibold hover:bg-[var(--color-earth-50)] transition-colors"
              >
                Shop Our Work
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
