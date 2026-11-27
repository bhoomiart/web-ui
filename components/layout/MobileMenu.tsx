'use client';

/**
 * MobileMenu — slide-out drawer for storefront navigation on small screens.
 *
 * Rendered by Navbar. Handles:
 * - Slide-in/out animation
 * - Focus trap when open
 * - Backdrop click to close
 * - Escape key to close
 * - Body scroll lock when open
 */

import Image from 'next/image';
import Link from 'next/link';
import * as React from 'react';
import { createPortal } from 'react-dom';
import { NAV_LINKS } from './Navbar';

// ─── Types ───────────────────────────────────────────────────────────────────

interface MobileMenuProps {
  id: string;
  open: boolean;
  onClose: () => void;
  currentPath: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function MobileMenu({ id, open, onClose, currentPath }: MobileMenuProps) {
  const drawerRef = React.useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Body scroll lock
  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Escape key
  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Focus trap — keep focus inside drawer while open
  React.useEffect(() => {
    if (!open || !drawerRef.current) return;
    const el = drawerRef.current;
    const focusable = el.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    function onTab(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    el.addEventListener('keydown', onTab);
    return () => el.removeEventListener('keydown', onTab);
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <div
      aria-hidden={!open}
      inert={!open}
      className={[
        'fixed inset-0 z-[var(--z-index-modal)]',
        'transition-all duration-[var(--duration-slow)] ease-[var(--ease-out)]',
        open ? 'visible pointer-events-auto' : 'invisible pointer-events-none',
      ].join(' ')}
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={[
          'absolute inset-0 bg-[var(--color-brand-charcoal)]/50',
          'transition-opacity duration-[var(--duration-slow)]',
          open ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
      />

      {/* Drawer panel */}
      <div
        id={id}
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={[
          'absolute top-0 right-0 bottom-0',
          'w-[min(320px,90vw)]',
          'flex flex-col',
          'bg-[var(--color-brand-ivory)]',
          'shadow-[var(--shadow-2xl)]',
          'transition-transform duration-[var(--duration-slow)] ease-[var(--ease-spring)]',
          open ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-[var(--spacing-5)] h-16 border-b border-[var(--color-earth-200)]">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-[var(--spacing-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] rounded-[var(--radius-sm)]"
          >
            <Image
              src="/logo-icon.png"
              alt="Bhoomi Art"
              width={30}
              height={30}
              className="w-8 h-8 object-contain"
            />
            <span
              className="text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-800)]"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Bhoomi Art
            </span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className={[
              'flex items-center justify-center',
              'w-9 h-9 rounded-[var(--radius-sm)]',
              'text-[var(--color-earth-500)]',
              'hover:bg-[var(--color-earth-100)] hover:text-[var(--color-earth-800)]',
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
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Navigation links */}
        <nav
          aria-label="Mobile navigation"
          className="flex-1 overflow-y-auto py-[var(--spacing-4)]"
        >
          <ul className="list-none m-0 p-0 px-[var(--spacing-3)]" role="list">
            {NAV_LINKS.map(({ label, href }) => {
              const active = currentPath === href || currentPath.startsWith(href + '/');
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onClose}
                    aria-current={active ? 'page' : undefined}
                    className={[
                      'flex items-center justify-between',
                      'px-[var(--spacing-3)] py-[var(--spacing-3)]',
                      'rounded-[var(--radius-md)]',
                      'text-[var(--font-size-base)] font-semibold',
                      'transition-colors duration-[var(--duration-fast)]',
                      'focus-visible:outline-none focus-visible:ring-2',
                      'focus-visible:ring-[var(--color-brand-primary)]',
                      active
                        ? 'text-[var(--color-brand-primary)] bg-[var(--color-earth-100)]'
                        : 'text-[var(--color-earth-800)] hover:bg-[var(--color-earth-100)] hover:text-[var(--color-earth-900)]',
                    ].join(' ')}
                  >
                    <span>{label}</span>
                    <svg
                      aria-hidden="true"
                      className="w-4 h-4 text-[var(--color-earth-400)]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                    </svg>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Divider */}
          <div
            className="mx-[var(--spacing-6)] my-[var(--spacing-4)] h-px bg-[var(--color-earth-200)]"
            aria-hidden="true"
          />

          {/* WhatsApp CTA */}
          <div className="px-[var(--spacing-6)]">
            <a
              href="https://wa.me/917019400775"
              target="_blank"
              rel="noopener noreferrer"
              className={[
                'flex items-center gap-[var(--spacing-3)]',
                'px-[var(--spacing-4)] py-[var(--spacing-3)]',
                'rounded-[var(--radius-button)]',
                'bg-[var(--color-forest-500)] text-white',
                'text-[var(--font-size-sm)] font-semibold',
                'transition-opacity duration-[var(--duration-fast)] hover:opacity-90',
                'focus-visible:outline-none focus-visible:ring-2',
                'focus-visible:ring-[var(--color-forest-500)]',
              ].join(' ')}
            >
              <svg
                aria-hidden="true"
                className="w-4 h-4 shrink-0"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M20.52 3.48A11.93 11.93 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.16 1.6 5.97L0 24l6.22-1.57A11.94 11.94 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.21-1.25-6.22-3.48-8.52z" />
              </svg>
              Chat on WhatsApp
            </a>
          </div>
        </nav>

        {/* Footer strip */}
        <div className="px-[var(--spacing-6)] py-[var(--spacing-4)] border-t border-[var(--color-earth-200)]">
          <p className="brand-signature text-center">
            Rooted in Earth · Shaped by Hand · Born with Love
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
