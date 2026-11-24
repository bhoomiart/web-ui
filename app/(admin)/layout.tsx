/**
 * Admin layout — Server Component.
 *
 * Uses AdminShell (a client component) to hold the mobile sidebar state,
 * keeping this layout itself a Server Component so it can eventually read
 * the Supabase session server-side (A3-T1).
 *
 * Route protection (proxy.ts) added in A3-T1.
 */

import { AdminShell } from '@/components/layout/AdminShell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // userName will come from the Supabase session in A3-T1.
  // Passed as a prop so AdminShell stays a pure client component.
  const userName = 'Admin';

  return <AdminShell userName={userName}>{children}</AdminShell>;
}
