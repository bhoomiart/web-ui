'use client';

/**
 * SearchInput
 *
 * Controlled search input that navigates to /search?q= on submit.
 * Mounted on the search page so the initial server-rendered query is reflected.
 */

import React from 'react';
import { useRouter } from 'next/navigation';

export function SearchInput({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [value, setValue] = React.useState(initialQuery);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
    } else {
      router.push('/search');
    }
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="flex gap-[var(--spacing-2)]">
      <label htmlFor="search-input" className="sr-only">
        Search products
      </label>
      <input
        id="search-input"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search for pots, vases, planters…"
        autoComplete="off"
        className="flex-1 px-[var(--spacing-4)] py-[var(--spacing-3)] rounded-[var(--radius-input)] border border-[var(--color-earth-200)] bg-white text-[var(--font-size-base)] text-[var(--color-earth-900)] placeholder:text-[var(--color-earth-400)] focus:outline-none focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-brand-primary)]/20"
      />
      <button
        type="submit"
        className="px-[var(--spacing-5)] h-11 flex items-center gap-[var(--spacing-2)] rounded-[var(--radius-button)] bg-[var(--color-brand-primary)] text-white font-semibold text-[var(--font-size-sm)] hover:bg-[var(--color-earth-700)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2"
      >
        <svg
          aria-hidden="true"
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.75"
        >
          <circle cx="11" cy="11" r="7" />
          <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
        </svg>
        Search
      </button>
    </form>
  );
}
