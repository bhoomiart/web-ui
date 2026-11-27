/**
 * lib/db/site-settings.ts
 *
 * Cached, cookie-less reader for public site_settings entries.
 * Safe to call inside generateMetadata() and RootLayout under Next.js 16 Cache Components.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cacheLife } from 'next/cache';
import type { Database } from '@/lib/types/database';

/**
 * Fetch public site_settings keys without reading request cookies,
 * cached across requests via Next.js `'use cache'`.
 */
export async function getPublicSiteSettings(keys: string[]): Promise<Record<string, string>> {
  'use cache';
  cacheLife('hours');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return {};

  const supabase = createSupabaseClient<Database>(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  const { data } = await supabase.from('site_settings').select('key, value').in('key', keys);
  const result: Record<string, string> = {};
  for (const row of data ?? []) {
    if (row.value != null) result[row.key] = row.value;
  }
  return result;
}
