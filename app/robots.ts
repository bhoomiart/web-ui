/**
 * app/robots.ts (A8-T1-2)
 *
 * Served at /robots.txt by Next.js.
 * - Blocks all crawlers from /admin/* and all API routes
 * - Allows everything else
 * - References the sitemap
 */

import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bhoomiart.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/checkout', '/cart', '/track', '/order/', '/search'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
