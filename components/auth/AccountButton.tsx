'use client';

/**
 * AccountButton
 *
 * Navbar entry for the customer account.
 *   signed out  "Sign in" button that opens the auth modal
 *   signed in   initial-letter button with a small menu: track orders, sign out
 *
 * Rendered as the signed-out button until Supabase reports the session, so the
 * server HTML and the first client render match.
 */

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/authStore';
import { useAuthModalStore } from '@/lib/store/authModalStore';
import { useToast } from '@/components/ui/Toast';

const ring =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]';

export function AccountButton() {
  const user = useAuthStore((s) => s.user);
  const openAuth = useAuthModalStore((s) => s.open);
  const router = useRouter();
  const toast = useToast();

  const [menuOpen, setMenuOpen] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);
  const wrapRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click / Escape
  React.useEffect(() => {
    if (!menuOpen) return;
    function onDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  async function signOut() {
    setSigningOut(true);
    // This device only. Signing out here should not log the customer out of their phone.
    const { error } = await createClient().auth.signOut({ scope: 'local' });
    setSigningOut(false);
    setMenuOpen(false);
    if (error) {
      toast.add({ variant: 'error', title: "Couldn't sign out", message: 'Please try again.' });
      return;
    }
    toast.add({ variant: 'info', title: 'Signed out', duration: 3000 });
    router.refresh();
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={() => openAuth()}
        aria-label="Sign in"
        className={`flex items-center justify-center gap-[var(--spacing-2)] h-9 px-[var(--spacing-2)] sm:px-[var(--spacing-3)] rounded-[var(--radius-full)] text-[var(--color-earth-700)] hover:bg-[var(--color-earth-100)] hover:text-[var(--color-earth-900)] transition-colors duration-[var(--duration-fast)] ${ring}`}
      >
        <UserIcon />
        <span className="hidden md:inline text-[var(--font-size-sm)] font-semibold">Sign in</span>
      </button>
    );
  }

  const label = (user.name || user.email || 'Account').trim();
  const initial = label.charAt(0).toUpperCase();

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label={`Account menu for ${label}`}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className={`flex items-center justify-center w-9 h-9 rounded-[var(--radius-full)] bg-[var(--color-brand-primary)] text-white text-[var(--font-size-sm)] font-bold hover:bg-[var(--color-earth-700)] transition-colors ${ring}`}
      >
        {initial}
      </button>

      {menuOpen && (
        <div
          role="menu"
          aria-label="Account"
          className="absolute right-0 mt-2 w-60 rounded-[var(--radius-md)] bg-white border border-[var(--color-earth-100)] shadow-[var(--shadow-lg)] py-1 z-[var(--z-index-dropdown)]"
        >
          <div className="px-[var(--spacing-4)] py-[var(--spacing-3)] border-b border-[var(--color-earth-100)]">
            <p className="text-[var(--font-size-xs)] text-[var(--color-earth-600)]">Signed in as</p>
            <p className="text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-900)] truncate">
              {user.email ?? label}
            </p>
          </div>
          {(user.role === 'admin' || user.role === 'staff') && (
            <Link
              role="menuitem"
              href="/admin/dashboard"
              onClick={() => setMenuOpen(false)}
              className={`block px-[var(--spacing-4)] py-[var(--spacing-2)] text-[var(--font-size-sm)] font-semibold text-[var(--color-brand-primary)] hover:bg-[var(--color-earth-50)] ${ring}`}
            >
              {user.role === 'admin' ? 'Admin dashboard' : 'Staff dashboard'}
            </Link>
          )}
          <Link
            role="menuitem"
            href="/track"
            onClick={() => setMenuOpen(false)}
            className={`block px-[var(--spacing-4)] py-[var(--spacing-2)] text-[var(--font-size-sm)] text-[var(--color-earth-800)] hover:bg-[var(--color-earth-50)] ${ring}`}
          >
            Track an order
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={signOut}
            disabled={signingOut}
            className={`block w-full text-left px-[var(--spacing-4)] py-[var(--spacing-2)] text-[var(--font-size-sm)] text-[var(--color-earth-800)] hover:bg-[var(--color-earth-50)] disabled:opacity-60 ${ring}`}
          >
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  );
}

function UserIcon() {
  return (
    <svg
      aria-hidden="true"
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <circle cx="12" cy="8" r="4" />
      <path strokeLinecap="round" d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
    </svg>
  );
}
