'use client';

/**
 * AdminTopbar — top bar for every admin page.
 *
 * Shows:
 * - Mobile hamburger (triggers sidebar open)
 * - Current page title (passed from layout context or page)
 * - User avatar / name pill
 * - Logout button
 * - Link to storefront (opens in new tab)
 *
 * Auth state is a placeholder — wired to Supabase session in A3-T1.
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface AdminTopbarProps {
  /** Callback to open the mobile sidebar */
  onMenuOpen: () => void;
  /** Display name of the logged-in user. Placeholder until A3-T1. */
  userName?: string;
}

export function AdminTopbar({ onMenuOpen, userName = 'Admin' }: AdminTopbarProps) {
  return (
    <header className="sticky top-0 z-[var(--z-index-sticky)] flex h-16 items-center gap-[var(--spacing-4)] bg-white border-b border-[var(--color-earth-100)] px-[var(--spacing-5)]">
      {/* Mobile hamburger */}
      <button
        type="button"
        aria-label="Open navigation menu"
        onClick={onMenuOpen}
        className={[
          'flex lg:hidden items-center justify-center',
          'w-9 h-9 rounded-[var(--radius-sm)]',
          'text-[var(--color-earth-600)]',
          'hover:bg-[var(--color-earth-100)]',
          'transition-colors duration-[var(--duration-fast)]',
          'focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-[var(--color-brand-primary)]',
        ].join(' ')}
      >
        <svg
          aria-hidden="true"
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side actions */}
      <div className="flex items-center gap-[var(--spacing-2)]">
        {/* View storefront */}
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View storefront"
          className={[
            'hidden sm:flex items-center gap-[var(--spacing-2)]',
            'px-[var(--spacing-3)] py-[var(--spacing-2)]',
            'rounded-[var(--radius-sm)]',
            'text-[var(--font-size-xs)] font-medium text-[var(--color-earth-600)]',
            'border border-[var(--color-earth-200)]',
            'hover:border-[var(--color-earth-300)] hover:text-[var(--color-earth-800)]',
            'transition-colors duration-[var(--duration-fast)]',
            'focus-visible:outline-none focus-visible:ring-2',
            'focus-visible:ring-[var(--color-brand-primary)]',
          ].join(' ')}
        >
          <svg
            aria-hidden="true"
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
          <span>View Store</span>
        </Link>

        {/* User pill */}
        <div
          className={[
            'flex items-center gap-[var(--spacing-2)]',
            'pl-[var(--spacing-2)] pr-[var(--spacing-3)] py-[var(--spacing-1-5)]',
            'rounded-[var(--radius-full)]',
            'bg-[var(--color-earth-100)]',
          ].join(' ')}
        >
          {/* Avatar */}
          <span
            aria-hidden="true"
            className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--color-brand-primary)] text-white text-[var(--font-size-xs)] font-bold uppercase"
          >
            {userName.charAt(0)}
          </span>
          <span className="hidden sm:block text-[var(--font-size-sm)] font-medium text-[var(--color-earth-800)]">
            {userName}
          </span>
        </div>

        {/* Logout */}
        <LogoutButton />
      </div>
    </header>
  );
}

function LogoutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await fetch('/api/auth/signout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      aria-label="Sign out"
      title="Sign out"
      className={[
        'flex items-center justify-center',
        'w-9 h-9 rounded-[var(--radius-sm)]',
        'text-[var(--color-earth-500)]',
        'hover:bg-[var(--color-error-light)] hover:text-[var(--color-error)]',
        'transition-colors duration-[var(--duration-fast)]',
        'focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-[var(--color-error)]',
      ].join(' ')}
    >
      <svg
        aria-hidden="true"
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="1.75"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
        />
      </svg>
    </button>
  );
}
