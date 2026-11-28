'use client';
/**
 * AdminRole: lets the admin screens know whether the signed-in user is an admin or
 * staff, so links to admin-only pages can be hidden from staff.
 *
 * This only hides links. It is NOT the access check: every admin-only page and API
 * route still verifies the role on the server (requireAdmin / requireAdminApi).
 */
import * as React from 'react';

const AdminRoleContext = React.createContext<string | null>(null);

export function AdminRoleProvider({
  role,
  children,
}: {
  role: string | null;
  children: React.ReactNode;
}) {
  return <AdminRoleContext.Provider value={role}>{children}</AdminRoleContext.Provider>;
}

export function useIsAdmin(): boolean {
  return React.useContext(AdminRoleContext) === 'admin';
}

/** Renders its children for admins only. Staff see nothing. */
export function AdminOnly({ children }: { children: React.ReactNode }) {
  return useIsAdmin() ? <>{children}</> : null;
}
