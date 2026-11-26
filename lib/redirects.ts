/**
 * lib/redirects.ts (A8-T1-4)
 *
 * DB-driven URL redirect management for slug changes.
 *
 * When a product or category slug changes, the old URL should 301-redirect
 * to the new one so inbound links and search engine rankings are preserved.
 *
 * Usage in proxy.ts (or middleware):
 *   const redirect = await getRedirect(pathname);
 *   if (redirect) return NextResponse.redirect(new URL(redirect.to, request.url), 301);
 *
 * Schema assumed in site_settings (JSONB value):
 *   key: 'url_redirects'
 *   value: JSON.stringify([{ from: '/product/old-slug', to: '/product/new-slug' }])
 *
 * Alternatively, store in a dedicated `url_redirects` table if volume grows.
 * This lightweight approach uses site_settings to avoid a schema migration.
 */

import { createAdminClient } from '@/lib/supabase/admin';

interface RedirectRule {
  from: string;
  to: string;
  permanent?: boolean;
}

/** Returns the redirect target for a given pathname, or null if no redirect applies. */
export async function getRedirect(pathname: string): Promise<RedirectRule | null> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('site_settings')
      .select('value')
      .eq('key', 'url_redirects')
      .single();

    if (!data?.value) return null;

    const rules: RedirectRule[] = JSON.parse(data.value);
    return rules.find((r) => r.from === pathname) ?? null;
  } catch {
    // Fail open — missing redirects should never break the site
    return null;
  }
}

/**
 * Convenience: upsert the full redirects list.
 * Call this from an admin action when a slug changes.
 */
export async function upsertRedirects(rules: RedirectRule[]): Promise<void> {
  const admin = createAdminClient();
  await admin.from('site_settings').upsert(
    {
      key: 'url_redirects',
      value: JSON.stringify(rules),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' }
  );
}
