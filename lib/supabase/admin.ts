/**
 * lib/supabase/admin.ts
 *
 * Service-role Supabase client.
 *
 * BYPASSES Row Level Security — has full unrestricted database access.
 *
 * Use ONLY for:
 * - Admin Server Actions that need to write data on behalf of admin users
 *   after verifying auth/role server-side first
 * - Background tasks (e.g. restock notification queue processing)
 * - Initial data seeding in migrations
 *
 * NEVER:
 * - Import this in any client component
 * - Import this in a Server Component that is publicly accessible
 * - Expose SUPABASE_SERVICE_ROLE_KEY in any client bundle
 *
 * Always call requireAdmin() or requireStaff() from lib/auth/admin.ts
 * BEFORE using this client in a Server Action.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';

// Guard — crash loudly at startup if the key is missing rather than silently
// running with wrong permissions
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[admin.ts] SUPABASE_SERVICE_ROLE_KEY is not set. ' + 'This is required for admin operations.'
    );
  }
  // In development, warn instead of crashing so the app still loads during setup
  console.warn(
    '[admin.ts] SUPABASE_SERVICE_ROLE_KEY is not set. ' +
      'Admin operations will fail until you add it to .env.local.'
  );
}

// Not a singleton — service-role client should not persist session state
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        // Disable auto-refresh — service role doesn't use auth sessions
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  );
}
