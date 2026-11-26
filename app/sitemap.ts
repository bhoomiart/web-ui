/**
 * app/sitemap.ts (A8-T1-1)
 *
 * Dynamic XML sitemap covering:
 *   - Static brand pages (home, shop, about, craft, custom, contact, track)
 *   - All active products
 *   - All visible categories + subcategories
 *   - All published CMS pages
 *
 * Served at /sitemap.xml automatically by Next.js.
 */

import { createClient } from '@/lib/supabase/server';
import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bhoomiart.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  // ── Fetch all data in parallel ──────────────────────────────────────────────
  const [{ data: products }, { data: categories }, { data: subcategories }, { data: pages }] =
    await Promise.all([
      supabase
        .from('products')
        .select('slug, updated_at')
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(1000),
      supabase
        .from('categories')
        .select('slug, updated_at')
        .eq('is_visible', true)
        .order('display_order', { ascending: true }),
      supabase
        .from('subcategories')
        .select('slug, updated_at, category_id, categories!inner(slug)')
        .eq('is_visible', true)
        .order('display_order', { ascending: true }),
      supabase.from('pages').select('slug, updated_at').eq('is_published', true),
    ]);

  const now = new Date().toISOString();

  // ── Static pages ───────────────────────────────────────────────────────────
  const statics: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${siteUrl}/shop`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/craft`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/custom`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteUrl}/track`, lastModified: now, changeFrequency: 'never', priority: 0.3 },
  ];

  // ── Products ───────────────────────────────────────────────────────────────
  const productUrls: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
    url: `${siteUrl}/product/${p.slug}`,
    lastModified: p.updated_at,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // ── Categories ────────────────────────────────────────────────────────────
  const categoryUrls: MetadataRoute.Sitemap = (categories ?? []).map((c) => ({
    url: `${siteUrl}/category/${c.slug}`,
    lastModified: c.updated_at,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // ── Subcategories ─────────────────────────────────────────────────────────
  type SubRow = {
    slug: string;
    updated_at: string;
    category_id: string;
    categories: { slug: string } | null;
  };
  const subcategoryUrls: MetadataRoute.Sitemap = ((subcategories as SubRow[]) ?? [])
    .filter((s) => s.categories?.slug)
    .map((s) => ({
      url: `${siteUrl}/category/${s.categories!.slug}/${s.slug}`,
      lastModified: s.updated_at,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

  // ── CMS pages ─────────────────────────────────────────────────────────────
  const pageUrls: MetadataRoute.Sitemap = (pages ?? [])
    .filter((p) => !['about', 'craft', 'custom', 'contact'].includes(p.slug)) // already in statics
    .map((p) => ({
      url: `${siteUrl}/${p.slug}`,
      lastModified: p.updated_at,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }));

  return [...statics, ...productUrls, ...categoryUrls, ...subcategoryUrls, ...pageUrls];
}
