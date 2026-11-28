'use client';

/**
 * AdminSidebar — Bhoomi Art admin navigation.
 *
 * Features:
 * - Full nav tree from requirements §11.8
 * - Collapsible groups (Products, Categories, Inventory, etc.)
 * - Collapsed mode (icon-only) toggled by a button — persisted to localStorage
 * - Active link / active group highlighting via usePathname
 * - Mobile: hidden by default, shown as overlay drawer when sidebarOpen=true
 */

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { useIsAdmin } from './AdminRole';

// ─── Nav tree ────────────────────────────────────────────────────────────────

type NavItem = { label: string; href: string; adminOnly?: boolean };
type NavGroup = {
  label: string;
  icon: React.ReactNode;
  items: NavItem[];
  basePath: string; // used to detect if this group is active
  adminOnly?: boolean;
};
type NavSingle = {
  label: string;
  icon: React.ReactNode;
  href: string;
  /** Hidden from staff (the page itself also checks on the server) */
  adminOnly?: boolean;
};
type NavEntry = NavGroup | NavSingle;

function isSingle(e: NavEntry): e is NavSingle {
  return 'href' in e;
}

const NAV: NavEntry[] = [
  {
    label: 'Dashboard',
    icon: <DashIcon />,
    href: '/admin/dashboard',
  },
  {
    label: 'Products',
    icon: <ProductIcon />,
    basePath: '/admin/products',
    items: [
      { label: 'All Products', href: '/admin/products' },
      { label: 'Add Product', href: '/admin/products/new' },
      { label: 'Collections', href: '/admin/collections' },
    ],
  },
  {
    label: 'Categories',
    icon: <CategoryIcon />,
    basePath: '/admin/categories',
    items: [
      { label: 'Categories', href: '/admin/categories' },
      { label: 'Subcategories', href: '/admin/categories/subcategories' },
    ],
  },
  {
    label: 'Inventory',
    icon: <InventoryIcon />,
    basePath: '/admin/inventory',
    items: [
      { label: 'Stock Overview', href: '/admin/inventory' },
      { label: 'Low Stock', href: '/admin/inventory/low-stock' },
      { label: 'Out of Stock', href: '/admin/inventory/out-of-stock' },
      { label: 'Inventory History', href: '/admin/inventory/history' },
    ],
  },
  {
    label: 'Restock',
    icon: <RestockIcon />,
    basePath: '/admin/restock',
    items: [
      { label: 'Subscribers', href: '/admin/restock/subscribers' },
      { label: 'Pending Notifications', href: '/admin/restock/notifications' },
      { label: 'Notification History', href: '/admin/restock/history' },
    ],
  },
  {
    label: 'Orders',
    icon: <OrderIcon />,
    basePath: '/admin/orders',
    items: [
      { label: 'All Orders', href: '/admin/orders' },
      { label: 'Pending', href: '/admin/orders/pending' },
      { label: 'Completed', href: '/admin/orders/completed' },
      { label: 'Cancellations', href: '/admin/orders/cancellations' },
      { label: 'Returns', href: '/admin/orders/returns' },
      { label: 'Refunds', href: '/admin/orders/refunds', adminOnly: true },
    ],
  },
  {
    label: 'Reviews',
    icon: <ReviewIcon />,
    href: '/admin/reviews',
  },
  {
    label: 'Homepage',
    icon: <HomeIcon />,
    href: '/admin/homepage',
  },
  {
    label: 'Pages & Blog',
    icon: <PageIcon />,
    href: '/admin/pages',
  },
  {
    label: 'SEO',
    icon: <SeoIcon />,
    href: '/admin/seo',
    adminOnly: true,
  },
  {
    label: 'Customers',
    icon: <CustomerIcon />,
    href: '/admin/customers',
  },
  {
    label: 'Analytics',
    icon: <AnalyticsIcon />,
    href: '/admin/analytics',
  },
  {
    label: 'Settings',
    icon: <SettingsIcon />,
    href: '/admin/settings',
  },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface AdminSidebarProps {
  /** Mobile: whether the sidebar drawer is open */
  mobileOpen: boolean;
  onMobileClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminSidebar({ mobileOpen, onMobileClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const isAdmin = useIsAdmin();
  // Staff do not see links to admin-only pages
  const nav = React.useMemo<NavEntry[]>(
    () =>
      NAV.filter((e) => isAdmin || !e.adminOnly).map((e) =>
        isSingle(e) ? e : { ...e, items: e.items.filter((i) => isAdmin || !i.adminOnly) }
      ),
    [isAdmin]
  );

  // Collapsed state — persisted in localStorage
  const [collapsed, setCollapsed] = React.useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('admin-sidebar-collapsed') === 'true';
  });

  // Open groups (by basePath / href) — auto-open the active group on mount
  const activeGroupKey = React.useMemo(() => {
    for (const entry of nav) {
      if (!isSingle(entry) && pathname.startsWith(entry.basePath)) {
        return entry.basePath;
      }
    }
    return null;
  }, [pathname, nav]);

  const [openGroups, setOpenGroups] = React.useState<Set<string>>(() => {
    return activeGroupKey ? new Set([activeGroupKey]) : new Set();
  });

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem('admin-sidebar-collapsed', String(next));
      return next;
    });
  };

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Close mobile menu on route change
  React.useEffect(() => {
    onMobileClose();
  }, [pathname, onMobileClose]);

  // Keyboard close on Escape (mobile)
  React.useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onMobileClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen, onMobileClose]);

  const sidebarContent = (
    <div
      className={[
        'flex flex-col h-full',
        'bg-[var(--color-brand-charcoal)]',
        'transition-[width] duration-[var(--duration-slow)] ease-[var(--ease-spring)]',
        collapsed ? 'w-16' : 'w-64',
      ].join(' ')}
    >
      {/* ── Logo strip ─────────────────────────────────────────── */}
      <div
        className={[
          'flex items-center h-16 shrink-0',
          'border-b border-white/10',
          collapsed ? 'justify-center px-0' : 'px-[var(--spacing-4)] gap-[var(--spacing-3)]',
        ].join(' ')}
      >
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-[var(--spacing-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded"
          aria-label="Bhoomi Art admin — dashboard"
        >
          <Image
            src="/logo-icon.png"
            alt=""
            aria-hidden="true"
            width={28}
            height={28}
            className="w-7 h-7 object-contain brightness-0 invert opacity-80 shrink-0"
          />
          {!collapsed && (
            <span
              className="text-[var(--font-size-sm)] font-semibold text-white/80 whitespace-nowrap"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Bhoomi Art
            </span>
          )}
        </Link>
      </div>

      {/* ── Nav items ──────────────────────────────────────────── */}
      <nav
        aria-label="Admin navigation"
        className="flex-1 overflow-y-auto py-[var(--spacing-3)] px-[var(--spacing-2)]"
      >
        <ul className="list-none m-0 p-0 flex flex-col gap-0.5" role="list">
          {nav.map((entry) => {
            if (isSingle(entry)) {
              const active = pathname === entry.href || pathname.startsWith(entry.href + '/');
              return (
                <li key={entry.href}>
                  <Link
                    href={entry.href}
                    aria-current={active ? 'page' : undefined}
                    title={collapsed ? entry.label : undefined}
                    className={[
                      'flex items-center gap-[var(--spacing-3)]',
                      'px-[var(--spacing-3)] py-[var(--spacing-2-5)]',
                      'rounded-[var(--radius-md)]',
                      'text-[var(--font-size-sm)] font-medium',
                      'transition-colors duration-[var(--duration-fast)]',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
                      active
                        ? 'bg-[var(--color-brand-primary)] text-white'
                        : 'text-white/70 hover:bg-white/10 hover:text-white',
                      collapsed ? 'justify-center' : '',
                    ].join(' ')}
                  >
                    <span className="shrink-0 w-5 h-5 flex items-center justify-center">
                      {entry.icon}
                    </span>
                    {!collapsed && <span>{entry.label}</span>}
                  </Link>
                </li>
              );
            }

            // Group
            const groupActive = pathname.startsWith(entry.basePath);
            const isOpen = openGroups.has(entry.basePath);

            return (
              <li key={entry.basePath}>
                <button
                  type="button"
                  onClick={() => (collapsed ? undefined : toggleGroup(entry.basePath))}
                  title={collapsed ? entry.label : undefined}
                  aria-expanded={collapsed ? undefined : isOpen}
                  className={[
                    'w-full flex items-center gap-[var(--spacing-3)]',
                    'px-[var(--spacing-3)] py-[var(--spacing-2-5)]',
                    'rounded-[var(--radius-md)]',
                    'text-[var(--font-size-sm)] font-medium text-left',
                    'transition-colors duration-[var(--duration-fast)]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
                    groupActive
                      ? 'bg-white/15 text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white',
                    collapsed ? 'justify-center' : '',
                  ].join(' ')}
                >
                  <span className="shrink-0 w-5 h-5 flex items-center justify-center">
                    {entry.icon}
                  </span>
                  {!collapsed && (
                    <>
                      <span className="flex-1">{entry.label}</span>
                      <svg
                        aria-hidden="true"
                        className={[
                          'w-4 h-4 shrink-0 transition-transform duration-[var(--duration-fast)]',
                          isOpen ? 'rotate-180' : '',
                        ].join(' ')}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>

                {/* Sub-items */}
                {!collapsed && isOpen && (
                  <ul
                    className="list-none m-0 mt-0.5 p-0 pl-[var(--spacing-8)] flex flex-col gap-0.5"
                    role="list"
                  >
                    {entry.items.map((item) => {
                      const itemActive =
                        pathname === item.href || pathname.startsWith(item.href + '/');
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            aria-current={itemActive ? 'page' : undefined}
                            className={[
                              'flex items-center',
                              'px-[var(--spacing-3)] py-[var(--spacing-2)]',
                              'rounded-[var(--radius-md)]',
                              'text-[var(--font-size-xs)] font-medium',
                              'transition-colors duration-[var(--duration-fast)]',
                              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
                              itemActive
                                ? 'text-white bg-[var(--color-brand-primary)]/80'
                                : 'text-white/60 hover:text-white hover:bg-white/10',
                            ].join(' ')}
                          >
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── Collapse toggle ─────────────────────────────────────── */}
      <div className="shrink-0 p-[var(--spacing-2)] border-t border-white/10">
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={[
            'w-full flex items-center gap-[var(--spacing-3)]',
            'px-[var(--spacing-3)] py-[var(--spacing-2-5)]',
            'rounded-[var(--radius-md)]',
            'text-white/50 hover:bg-white/10 hover:text-white',
            'transition-colors duration-[var(--duration-fast)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
            collapsed ? 'justify-center' : '',
          ].join(' ')}
        >
          <svg
            aria-hidden="true"
            className={[
              'w-5 h-5 shrink-0 transition-transform duration-[var(--duration-slow)]',
              collapsed ? 'rotate-180' : '',
            ].join(' ')}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.75"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
          </svg>
          {!collapsed && <span className="text-[var(--font-size-xs)]">Collapse</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────── */}
      <aside className="hidden lg:flex shrink-0" aria-label="Sidebar">
        {sidebarContent}
      </aside>

      {/* ── Mobile overlay ──────────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[var(--z-index-modal)] flex lg:hidden">
          {/* Backdrop */}
          <div
            aria-hidden="true"
            onClick={onMobileClose}
            className="absolute inset-0 bg-black/60"
          />
          {/* Panel */}
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation"
            className="relative animate-slide-in-left"
          >
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
// All 20×20 viewBox, stroke-based, consistent weight.

function DashIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function ProductIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
  );
}
function CategoryIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  );
}
function InventoryIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
    </svg>
  );
}
function RestockIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}
function OrderIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
      />
    </svg>
  );
}
function ReviewIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
      />
    </svg>
  );
}
function HomeIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}
function PageIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}
function SeoIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
      <path strokeLinecap="round" d="M8 11h6M11 8v6" />
    </svg>
  );
}
function CustomerIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );
}
function AnalyticsIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  );
}
function SettingsIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
