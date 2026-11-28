'use client';
/** Side menu of the profile area (becomes a scrolling row on small screens). */
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/account', label: 'Profile' },
  { href: '/account/orders', label: 'Orders' },
  { href: '/account/addresses', label: 'Saved addresses' },
  { href: '/account/payments', label: 'Payment methods', soon: true },
];

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Account">
      <ul className="flex md:flex-col gap-[var(--spacing-1)] overflow-x-auto md:overflow-visible">
        {ITEMS.map((item) => {
          const active =
            item.href === '/account' ? pathname === '/account' : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center justify-between gap-[var(--spacing-2)] px-[var(--spacing-4)] py-[var(--spacing-2-5)] rounded-[var(--radius-md)] text-[var(--font-size-sm)] font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] ${
                  active
                    ? 'bg-[var(--color-brand-primary)] text-white'
                    : 'text-[var(--color-earth-700)] hover:bg-[var(--color-earth-100)]'
                }`}
              >
                {item.label}
                {item.soon && (
                  <span
                    className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-full ${
                      active
                        ? 'bg-white/20'
                        : 'bg-[var(--color-earth-100)] text-[var(--color-earth-600)]'
                    }`}
                  >
                    Soon
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
