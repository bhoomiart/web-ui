/**
 * lib/supabase/client.ts
 *
 * Browser Supabase client for use ONLY in:
 * - Client Components (`'use client'` files)
 *
 * Uses @supabase/ssr so the same session cookie is shared with the server client.
 *
 * RULE: This file must ONLY be imported by client components.
 *       Never import it in Server Components, Server Actions, or Route Handlers.
 *       Those use lib/supabase/server.ts instead.
 *
 * RULE: Do NOT use this to call the database directly from the browser.
 *       All data mutations go through Server Actions.
 *       Client-side reads that bypass Server Actions must only access
 *       publicly readable data subject to RLS (e.g. reading a product).
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/types/database';

// Singleton — one client per browser session
let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createClient() {
  if (client) return client;

  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return client;
}
