/**
 * ContentPage — shared layout for text pages (policies, FAQs).
 * Body comes from the `pages` table (admin-editable); falls back to the
 * `fallback` node when no published row exists for the slug.
 */

import * as React from 'react';
import { createClient } from '@/lib/supabase/server';
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav';

export async function ContentPage({
  slug,
  title,
  fallback,
}: {
  slug: string;
  title: string;
  fallback: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: page } = await supabase
    .from('pages')
    .select('title, body')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle();

  return (
    <div>
      <div
        className="min-h-[220px] flex items-end pb-[var(--spacing-10)]"
        style={{
          background:
            'linear-gradient(135deg, var(--color-earth-800) 0%, var(--color-brand-primary) 100%)',
        }}
      >
        <div className="container-brand">
          <BreadcrumbNav
            items={[{ label: 'Home', href: '/' }, { label: page?.title ?? title }]}
            className="mb-[var(--spacing-4)] [&_a]:text-[var(--color-earth-300)]"
          />
          <h1 className="heading-1 text-white">{page?.title ?? title}</h1>
        </div>
      </div>

      <div className="container-brand py-[var(--spacing-16)] max-w-3xl">
        {page?.body ? (
          <div className="body-large text-[var(--color-earth-700)] whitespace-pre-wrap">
            {page.body}
          </div>
        ) : (
          <div className="space-y-[var(--spacing-6)] body-large text-[var(--color-earth-700)]">
            {fallback}
          </div>
        )}
      </div>
    </div>
  );
}
