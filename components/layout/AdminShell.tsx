'use client';

/**
 * AdminShell — client wrapper that owns mobile sidebar open/close state.
 *
 * The admin layout is a Server Component. It can't use useState.
 * This thin client component wraps the sidebar + topbar so both can
 * share the mobileOpen state without making the whole layout a client component.
 */

import * as React from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';

interface AdminShellProps {
  children: React.ReactNode;
  /** Display name passed down from server (session) once A3-T1 wires auth */
  userName?: string;
}

export function AdminShell({ children, userName }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen bg-[var(--color-earth-50)]">
      {/* Sidebar */}
      <AdminSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      {/* Main content area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <AdminTopbar onMenuOpen={() => setMobileOpen(true)} userName={userName} />

        <main className="flex-1 overflow-y-auto p-[var(--spacing-6)]">{children}</main>
      </div>
    </div>
  );
}
