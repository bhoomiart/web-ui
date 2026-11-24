/**
 * Footer — Bhoomi Art storefront footer.
 *
 * Server component — no interactivity needed.
 * Sections:
 * - Brand column (logo, tagline, social links)
 * - Shop links
 * - Company links
 * - Contact info + WhatsApp CTA
 * - Bottom bar (copyright, policy links, brand signature)
 */

import Image from 'next/image';
import Link from 'next/link';

// ─── Nav data ────────────────────────────────────────────────────────────────

const SHOP_LINKS = [
  { label: 'All Products', href: '/shop' },
  { label: 'Collections', href: '/collections' },
  { label: 'New Arrivals', href: '/shop?collection=new-arrivals' },
  { label: 'Best Sellers', href: '/shop?collection=bestsellers' },
  { label: 'Signature Items', href: '/shop?collection=signature' },
  { label: 'Custom Creations', href: '/custom' },
];

const COMPANY_LINKS = [
  { label: 'Our Story', href: '/about' },
  { label: 'The Art of Terracotta', href: '/craft' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'FAQs', href: '/faqs' },
  { label: 'Shipping Policy', href: '/policies/shipping' },
  { label: 'Returns & Refunds', href: '/policies/returns' },
];

const SOCIAL_LINKS = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/ba4bhoomiart',
    icon: (
      <svg
        aria-hidden="true"
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      >
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: 'WhatsApp',
    href: 'https://wa.me/917019400775',
    icon: (
      <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.52 3.48A11.93 11.93 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.16 1.6 5.97L0 24l6.22-1.57A11.94 11.94 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.21-1.25-6.22-3.48-8.52zM12 22c-1.85 0-3.66-.5-5.24-1.44l-.37-.22-3.69.93.99-3.59-.24-.38A9.94 9.94 0 0 1 2 12C2 6.48 6.48 2 12 2c2.67 0 5.18 1.04 7.07 2.93A9.93 9.93 0 0 1 22 12c0 5.52-4.48 10-10 10z" />
      </svg>
    ),
  },
  {
    label: 'Email',
    href: 'mailto:ba4bhoomiart@gmail.com',
    icon: (
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
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Computed at module scope (build time) — a predictable value, not a runtime call.
// Next.js 16 with cacheComponents:true treats new Date() inside render as dynamic;
// module-scope evaluation is prerendered once and stable.
const CURRENT_YEAR = new Date().getFullYear();

// ─── Component ───────────────────────────────────────────────────────────────

export function Footer() {
  const year = CURRENT_YEAR;

  return (
    <footer className="bg-[var(--color-earth-900)] text-[var(--color-earth-200)]">
      {/* Main footer content */}
      <div className="container-brand py-[var(--spacing-16)]">
        <div className="grid grid-cols-1 gap-[var(--spacing-12)] sm:grid-cols-2 lg:grid-cols-4">
          {/* ── Brand column ───────────────────────────────────────── */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center gap-[var(--spacing-3)] mb-[var(--spacing-5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-earth-400)] rounded-[var(--radius-sm)]"
              aria-label="Bhoomi Art — home"
            >
              <Image
                src="/logo-icon.png"
                alt=""
                aria-hidden="true"
                width={40}
                height={40}
                className="w-10 h-10 object-contain brightness-0 invert opacity-80"
              />
              <Image
                src="/Bhoomi_Art_Wordmark_HD.png"
                alt="Bhoomi Art"
                width={120}
                height={36}
                className="h-9 w-auto object-contain brightness-0 invert opacity-80"
              />
            </Link>

            <p className="text-[var(--font-size-sm)] leading-relaxed text-[var(--color-earth-400)] mb-[var(--spacing-6)] max-w-[260px]">
              Handcrafted terracotta creations rooted in the beauty of Mother Earth. Each piece
              shaped by hand and born with love.
            </p>

            {/* Social links */}
            <div className="flex items-center gap-[var(--spacing-2)]">
              {SOCIAL_LINKS.map(({ label, href, icon }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  aria-label={label}
                  className={[
                    'flex items-center justify-center',
                    'w-9 h-9 rounded-[var(--radius-full)]',
                    'text-[var(--color-earth-400)]',
                    'border border-[var(--color-earth-700)]',
                    'hover:border-[var(--color-earth-500)] hover:text-[var(--color-earth-200)]',
                    'transition-colors duration-[var(--duration-fast)]',
                    'focus-visible:outline-none focus-visible:ring-2',
                    'focus-visible:ring-[var(--color-earth-400)]',
                  ].join(' ')}
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* ── Shop links ──────────────────────────────────────────── */}
          <div>
            <h3 className="text-[var(--font-size-xs)] font-semibold tracking-[var(--letter-spacing-widest)] uppercase text-[var(--color-earth-400)] mb-[var(--spacing-5)]">
              Shop
            </h3>
            <ul className="list-none m-0 p-0 flex flex-col gap-[var(--spacing-3)]" role="list">
              {SHOP_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={[
                      'text-[var(--font-size-sm)] text-[var(--color-earth-300)]',
                      'hover:text-white',
                      'transition-colors duration-[var(--duration-fast)]',
                      'focus-visible:outline-none focus-visible:underline',
                    ].join(' ')}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Company links ───────────────────────────────────────── */}
          <div>
            <h3 className="text-[var(--font-size-xs)] font-semibold tracking-[var(--letter-spacing-widest)] uppercase text-[var(--color-earth-400)] mb-[var(--spacing-5)]">
              Company
            </h3>
            <ul className="list-none m-0 p-0 flex flex-col gap-[var(--spacing-3)]" role="list">
              {COMPANY_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={[
                      'text-[var(--font-size-sm)] text-[var(--color-earth-300)]',
                      'hover:text-white',
                      'transition-colors duration-[var(--duration-fast)]',
                      'focus-visible:outline-none focus-visible:underline',
                    ].join(' ')}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Contact & WhatsApp ──────────────────────────────────── */}
          <div>
            <h3 className="text-[var(--font-size-xs)] font-semibold tracking-[var(--letter-spacing-widest)] uppercase text-[var(--color-earth-400)] mb-[var(--spacing-5)]">
              Get in Touch
            </h3>

            <div className="flex flex-col gap-[var(--spacing-4)] mb-[var(--spacing-6)]">
              <a
                href="mailto:ba4bhoomiart@gmail.com"
                className="flex items-center gap-[var(--spacing-3)] text-[var(--font-size-sm)] text-[var(--color-earth-300)] hover:text-white transition-colors duration-[var(--duration-fast)] focus-visible:outline-none focus-visible:underline"
              >
                <svg
                  aria-hidden="true"
                  className="w-4 h-4 shrink-0 text-[var(--color-earth-500)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.75"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                ba4bhoomiart@gmail.com
              </a>

              <a
                href="https://wa.me/917019400775"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-[var(--spacing-3)] text-[var(--font-size-sm)] text-[var(--color-earth-300)] hover:text-white transition-colors duration-[var(--duration-fast)] focus-visible:outline-none focus-visible:underline"
              >
                <svg
                  aria-hidden="true"
                  className="w-4 h-4 shrink-0 text-[var(--color-earth-500)]"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M20.52 3.48A11.93 11.93 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.16 1.6 5.97L0 24l6.22-1.57A11.94 11.94 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.21-1.25-6.22-3.48-8.52z" />
                </svg>
                +91 70194 00775
              </a>

              <a
                href="https://www.instagram.com/ba4bhoomiart"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-[var(--spacing-3)] text-[var(--font-size-sm)] text-[var(--color-earth-300)] hover:text-white transition-colors duration-[var(--duration-fast)] focus-visible:outline-none focus-visible:underline"
              >
                <svg
                  aria-hidden="true"
                  className="w-4 h-4 shrink-0 text-[var(--color-earth-500)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.75"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <circle cx="12" cy="12" r="4" />
                </svg>
                @ba4bhoomiart
              </a>
            </div>

            {/* WhatsApp CTA */}
            <a
              href="https://wa.me/917019400775"
              target="_blank"
              rel="noopener noreferrer"
              className={[
                'inline-flex items-center gap-[var(--spacing-2)]',
                'px-[var(--spacing-5)] py-[var(--spacing-2-5)]',
                'rounded-[var(--radius-button)]',
                'bg-[var(--color-forest-500)] text-white',
                'text-[var(--font-size-sm)] font-semibold',
                'transition-opacity duration-[var(--duration-fast)] hover:opacity-90',
                'focus-visible:outline-none focus-visible:ring-2',
                'focus-visible:ring-[var(--color-forest-400)]',
              ].join(' ')}
            >
              <svg aria-hidden="true" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.52 3.48A11.93 11.93 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.16 1.6 5.97L0 24l6.22-1.57A11.94 11.94 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.21-1.25-6.22-3.48-8.52z" />
              </svg>
              Enquire on WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[var(--color-earth-800)]">
        <div className="container-brand py-[var(--spacing-5)]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-[var(--spacing-3)]">
            <p className="text-[var(--font-size-xs)] text-[var(--color-earth-500)]">
              © {year} Bhoomi Art. All rights reserved.
            </p>

            <p className="brand-signature">Rooted in Earth · Shaped by Hand · Born with Love</p>

            <div className="flex items-center gap-[var(--spacing-4)]">
              <Link
                href="/policies/privacy"
                className="text-[var(--font-size-xs)] text-[var(--color-earth-500)] hover:text-[var(--color-earth-300)] transition-colors duration-[var(--duration-fast)] focus-visible:outline-none focus-visible:underline"
              >
                Privacy
              </Link>
              <Link
                href="/policies/terms"
                className="text-[var(--font-size-xs)] text-[var(--color-earth-500)] hover:text-[var(--color-earth-300)] transition-colors duration-[var(--duration-fast)] focus-visible:outline-none focus-visible:underline"
              >
                Terms
              </Link>
              <Link
                href="/policies/shipping"
                className="text-[var(--font-size-xs)] text-[var(--color-earth-500)] hover:text-[var(--color-earth-300)] transition-colors duration-[var(--duration-fast)] focus-visible:outline-none focus-visible:underline"
              >
                Shipping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
