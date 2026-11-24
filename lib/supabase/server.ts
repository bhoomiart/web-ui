/**
 * lib/supabase/server.ts
 *
 * SSR Supabase client for use in:
 * - Server Components
 * - Server Actions  (`'use server'`)
 * - Route Handlers  (`app/api/**`)
 * - proxy.ts        (admin route protection)
 *
 * Uses @supabase/ssr to read/write cookies correctly in Next.js App Router.
 * The anon key is used here — RLS on the database enforces access control.
 * For privileged operations use lib/supabase/admin.ts.
 *
 * RULE: Do NOT import this in any client component (`'use client'` files).
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/types/database';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll is called from Server Components which cannot set cookies.
            // The middleware (proxy.ts) handles session refresh, so this is safe to ignore.
          }
        },
      },
    }
  );
}
