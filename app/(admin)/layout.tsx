export const instant = false;

/**
 * Admin layout — Server Component.
 *
 * Reads the Supabase session server-side and passes userName to AdminShell.
 * Route protection is handled by proxy.ts — users without a session
 * are redirected before this layout runs.
 */

import { getCurrentUser } from '@/lib/auth/admin';
import { AdminShell } from '@/components/layout/AdminShell';
import { AdminRoleProvider } from '@/components/layout/AdminRole';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const userName = user?.full_name ?? user?.email ?? 'Admin';

  return (
    <AdminRoleProvider role={user?.role ?? null}>
      <AdminShell userName={userName}>{children}</AdminShell>
    </AdminRoleProvider>
  );
}
