'use client'

/**
 * Navbar — Bhoomi Art storefront navigation.
 *
 * Server-renderable shell with client interactivity for:
 * - Mobile menu toggle
 * - Active link highlighting via usePathname
 * - Cart item count (wired to cart store in A6-T1)
 */

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'
import { MobileMenu } from './MobileMenu'

// ─── Nav links ───────────────────────────────────────────────────────────────

export const NAV_LINKS = [
  { label: 'Shop',       href: '/shop' },
  { label: 'Collections', href: '/collections' },
  { label: 'About',      href: '/about' },
  { label: 'Craft',      href: '/craft' },
  { label: 'Custom',     href: '/custom' },
  { label: 'Contact',    href: '/contact' },
] as const

// ─── Component ───────────────────────────────────────────────────────────────

export function Navbar() {
  const pathname                      = usePathname()
  const [menuOpen, setMenuOpen]       = React.useState(false)
  const [scrolled, setScrolled]       = React.useState(false)

  // Elevate navbar on scroll
  React.useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 8) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on route change
  React.useEffect(() => { setMenuOpen(false) }, [pathname])

  return (
    <>
      <header
        className={[
          'fixed top-0 inset-x-0 z-[var(--z-index-sticky)]',
          'transition-all duration-[var(--duration-normal)] ease-[var(--ease-out)]',
          scrolled
            ? 'bg-[var(--color-brand-ivory)]/95 backdrop-blur-sm shadow-[var(--shadow-sm)]'
            : 'bg-[var(--color-brand-ivory)]/80 backdrop-blur-sm',
        ].join(' ')}
      >
        <div className="container-brand">
          <nav
            aria-label="Main navigation"
            className="flex h-16 items-center justify-between gap-[var(--spacing-6)]"
          >
            {/* ── Logo ───────────────────────────────────────────────── */}
            <Link
              href="/"
              className="flex items-center gap-[var(--spacing-2)] shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] rounded-[var(--radius-sm)]"
              aria-label="Bhoomi Art — home"
            >
              <Image
                src="/logo-icon.png"
                alt=""
                aria-hidden="true"
                width={36}
                height={36}
                className="w-9 h-9 object-contain drop-shadow-sm"
                priority
              />
              <Image
                src="/Bhoomi_Art_Wordmark_HD.png"
                alt="Bhoomi Art"
                width={110}
                height={32}
                className="h-8 w-auto object-contain hidden sm:block"
                priority
              />
            </Link>

            {/* ── Desktop nav links ───────────────────────────────────── */}
            <ul
              className="hidden lg:flex items-center gap-[var(--spacing-1)] list-none m-0 p-0"
              role="list"
            >
              {NAV_LINKS.map(({ label, href }) => {
                const active = pathname === href || pathname.startsWith(href + '/')
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={[
                        'relative px-[var(--spacing-3)] py-[var(--spacing-2)]',
                        'text-[var(--font-size-sm)] font-semibold tracking-wide',
                        'rounded-[var(--radius-sm)]',
                        'transition-colors duration-[var(--duration-fast)]',
                        'focus-visible:outline-none focus-visible:ring-2',
                        'focus-visible:ring-[var(--color-brand-primary)]',
                        active
                          ? 'text-[var(--color-brand-primary)]'
                          : 'text-[var(--color-earth-700)] hover:text-[var(--color-earth-900)]',
                      ].join(' ')}
                      aria-current={active ? 'page' : undefined}
                    >
                      {label}
                      {/* Active underline */}
                      {active && (
                        <span
                          aria-hidden="true"
                          className="absolute bottom-0 inset-x-[var(--spacing-3)] h-0.5 rounded-full bg-[var(--color-brand-primary)]"
                        />
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>

            {/* ── Right side actions ──────────────────────────────────── */}
            <div className="flex items-center gap-[var(--spacing-2)]">
              {/* Search */}
              <Link
                href="/search"
                aria-label="Search"
                className={[
                  'hidden sm:flex items-center justify-center',
                  'w-9 h-9 rounded-[var(--radius-full)]',
                  'text-[var(--color-earth-600)]',
                  'hover:bg-[var(--color-earth-100)] hover:text-[var(--color-earth-900)]',
                  'transition-colors duration-[var(--duration-fast)]',
                  'focus-visible:outline-none focus-visible:ring-2',
                  'focus-visible:ring-[var(--color-brand-primary)]',
                ].join(' ')}
              >
                <SearchIcon />
              </Link>

              {/* Cart — badge count wired in A6-T1 */}
              <CartButton />

              {/* WhatsApp enquiry */}
              <a
                href="https://wa.me/917019400775"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp enquiry"
                className={[
                  'hidden md:flex items-center justify-center',
                  'w-9 h-9 rounded-[var(--radius-full)]',
                  'text-[var(--color-forest-500)]',
                  'hover:bg-[var(--color-forest-100)] hover:text-[var(--color-forest-600)]',
                  'transition-colors duration-[var(--duration-fast)]',
                  'focus-visible:outline-none focus-visible:ring-2',
                  'focus-visible:ring-[var(--color-forest-500)]',
                ].join(' ')}
              >
                <WhatsAppIcon />
              </a>

              {/* Mobile hamburger */}
              <button
                type="button"
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
                onClick={() => setMenuOpen(v => !v)}
                className={[
                  'flex lg:hidden items-center justify-center',
                  'w-9 h-9 rounded-[var(--radius-sm)]',
                  'text-[var(--color-earth-700)]',
                  'hover:bg-[var(--color-earth-100)]',
                  'transition-colors duration-[var(--duration-fast)]',
                  'focus-visible:outline-none focus-visible:ring-2',
                  'focus-visible:ring-[var(--color-brand-primary)]',
                ].join(' ')}
              >
                {menuOpen ? <CloseIcon /> : <HamburgerIcon />}
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Spacer so page content doesn't sit under fixed navbar */}
      <div aria-hidden="true" className="h-16" />

      {/* Mobile menu drawer */}
      <MobileMenu
        id="mobile-menu"
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        currentPath={pathname}
      />
    </>
  )
}

// ─── Cart button ─────────────────────────────────────────────────────────────
// Extracted so it can later import the cart store (A6-T1) in isolation.

function CartButton() {
  // itemCount will come from useCartStore() in A6-T1.
  // For now it always reads 0.
  const itemCount = 0

  return (
    <Link
      href="/cart"
      aria-label={itemCount > 0 ? `Cart — ${itemCount} items` : 'Cart — empty'}
      className={[
        'relative flex items-center justify-center',
        'w-9 h-9 rounded-[var(--radius-full)]',
        'text-[var(--color-earth-700)]',
        'hover:bg-[var(--color-earth-100)] hover:text-[var(--color-earth-900)]',
        'transition-colors duration-[var(--duration-fast)]',
        'focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-[var(--color-brand-primary)]',
      ].join(' ')}
    >
      <CartIcon />
      {itemCount > 0 && (
        <span
          aria-hidden="true"
          className={[
            'absolute -top-0.5 -right-0.5',
            'flex items-center justify-center',
            'w-4 h-4 rounded-full',
            'bg-[var(--color-brand-primary)] text-white',
            'text-[10px] font-bold leading-none',
          ].join(' ')}
        >
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </Link>
  )
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
    </svg>
  )
}

function CartIcon() {
  return (
    <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" strokeLinecap="round" />
      <path strokeLinecap="round" d="M16 10a4 4 0 01-8 0" />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.52 3.48A11.93 11.93 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.16 1.6 5.97L0 24l6.22-1.57A11.94 11.94 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.21-1.25-6.22-3.48-8.52zM12 22c-1.85 0-3.66-.5-5.24-1.44l-.37-.22-3.69.93.99-3.59-.24-.38A9.94 9.94 0 0 1 2 12C2 6.48 6.48 2 12 2c2.67 0 5.18 1.04 7.07 2.93A9.93 9.93 0 0 1 22 12c0 5.52-4.48 10-10 10zm5.47-7.37c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.6-.92-2.19-.24-.57-.49-.49-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z" />
    </svg>
  )
}

function HamburgerIcon() {
  return (
    <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}
