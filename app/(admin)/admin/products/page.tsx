export const instant = false;
import { Suspense } from 'react';
import { Spinner } from '@/components/ui/Spinner';
/**
 * /admin/products — Product list page.
 * Server Component. Queries via createAdminClient directly (no lib/db wrapper
 * exists for admin product listing with media join).
 */

import Image from 'next/image';
import Link from 'next/link';
import { requireStaff } from '@/lib/auth/admin';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';
import { createAdminClient } from '@/lib/supabase/admin';

type StatusFilter = 'all' | 'active' | 'draft' | 'archived';

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'draft', label: 'Draft' },
  { key: 'archived', label: 'Archived' },
];

function statusBadge(status: string) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    active: { label: 'Active', color: 'var(--color-success)', bg: 'var(--color-success-light)' },
    draft: { label: 'Draft', color: 'var(--color-warning)', bg: 'var(--color-warning-light)' },
    archived: { label: 'Archived', color: 'var(--color-earth-500)', bg: 'var(--color-earth-100)' },
  };
  const cfg = map[status] ?? {
    label: status,
    color: 'var(--color-earth-500)',
    bg: 'var(--color-earth-100)',
  };
  return (
    <span
      className="inline-flex items-center px-[var(--spacing-2)] py-0.5 rounded-[var(--radius-full)] text-[var(--font-size-xs)] font-semibold"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      {cfg.label}
    </span>
  );
}

function availabilityBadge(type: string) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    ready_to_ship: {
      label: 'Ready to Ship',
      color: 'var(--color-success)',
      bg: 'var(--color-success-light)',
    },
    made_to_order: {
      label: 'Made to Order',
      color: 'var(--color-info)',
      bg: 'var(--color-info-light)',
    },
    out_of_stock: {
      label: 'Out of Stock',
      color: 'var(--color-error)',
      bg: 'var(--color-error-light)',
    },
  };
  const cfg = map[type] ?? {
    label: type,
    color: 'var(--color-earth-500)',
    bg: 'var(--color-earth-100)',
  };
  return (
    <span
      className="inline-flex items-center px-[var(--spacing-2)] py-0.5 rounded-[var(--radius-full)] text-[var(--font-size-xs)] font-semibold"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      {cfg.label}
    </span>
  );
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireStaff();

  const { status: rawStatus } = await searchParams;
  const statusFilter = (typeof rawStatus === 'string' ? rawStatus : 'all') as StatusFilter;

  const admin = createAdminClient();
  let query = admin
    .from('products')
    .select(
      'id, name, sku, slug, status, availability_type, price, created_at, product_media(id, url, alt_text, display_order)',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false });

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter as 'active' | 'draft' | 'archived');
  }

  const { data: products, error } = await query;

  if (error) throw new Error(`ProductsPage: ${error.message}`);

  const rows = (products ?? []).map((p) => {
    const media =
      (p.product_media as Array<{
        id: string;
        url: string;
        alt_text: string | null;
        display_order: number;
      }> | null) ?? [];
    const thumb = media.sort((a, b) => a.display_order - b.display_order)[0] ?? null;
    return { ...p, thumb };
  });

  return (
    <div>
      <AdminPageHeader
        title="Products"
        description="Manage your product catalogue."
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Products' }]}
        action={
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-[var(--spacing-2)] px-[var(--spacing-5)] py-[var(--spacing-2)] rounded-[var(--radius-button)] bg-[var(--color-brand-primary)] text-white text-[var(--font-size-sm)] font-semibold shadow-[var(--shadow-button)] hover:bg-[var(--color-earth-700)] transition-colors"
          >
            + Add Product
          </Link>
        }
      />

      {/* Status filter tabs */}
      <div className="flex gap-[var(--spacing-1)] mb-[var(--spacing-5)] border-b border-[var(--color-earth-100)]">
        {STATUS_TABS.map((tab) => {
          const active = tab.key === statusFilter;
          return (
            <Link
              key={tab.key}
              href={tab.key === 'all' ? '/admin/products' : `/admin/products?status=${tab.key}`}
              className={`px-[var(--spacing-4)] py-[var(--spacing-2)] text-[var(--font-size-sm)] font-semibold border-b-2 transition-colors -mb-px ${
                active
                  ? 'border-[var(--color-brand-primary)] text-[var(--color-brand-primary)]'
                  : 'border-transparent text-[var(--color-earth-500)] hover:text-[var(--color-earth-800)]'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-[var(--color-earth-400)]">
          <svg
            className="w-10 h-10 mb-3 opacity-40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"
            />
          </svg>
          <p className="text-[var(--font-size-sm)]">No products found.</p>
          <Link
            href="/admin/products/new"
            className="mt-3 text-[var(--font-size-sm)] font-semibold text-[var(--color-brand-primary)] hover:underline"
          >
            Add your first product →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] overflow-hidden">
          <table className="w-full text-[var(--font-size-sm)]">
            <thead className="bg-[var(--color-earth-50)] border-b border-[var(--color-earth-100)]">
              <tr>
                <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)] w-14">
                  Image
                </th>
                <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)]">
                  Name
                </th>
                <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)] hidden md:table-cell">
                  SKU
                </th>
                <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)]">
                  Status
                </th>
                <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)] hidden lg:table-cell">
                  Availability
                </th>
                <th className="text-right px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)]">
                  Price
                </th>
                <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)] hidden xl:table-cell">
                  Created
                </th>
                <th className="px-[var(--spacing-4)] py-[var(--spacing-3)] w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-earth-100)]">
              {rows.map((product) => (
                <tr key={product.id} className="hover:bg-[var(--color-earth-50)] transition-colors">
                  <td className="px-[var(--spacing-4)] py-[var(--spacing-3)]">
                    {product.thumb ? (
                      <Image
                        src={product.thumb.url}
                        alt={product.thumb.alt_text ?? product.name}
                        width={40}
                        height={40}
                        className="w-10 h-10 object-cover rounded-[var(--radius-sm)]"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-[var(--color-earth-100)] flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-[var(--color-earth-300)]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.5"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"
                          />
                        </svg>
                      </div>
                    )}
                  </td>
                  <td className="px-[var(--spacing-4)] py-[var(--spacing-3)]">
                    <span className="font-semibold text-[var(--color-earth-900)]">
                      {product.name}
                    </span>
                  </td>
                  <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-[var(--color-earth-500)] hidden md:table-cell">
                    {product.sku ?? '—'}
                  </td>
                  <td className="px-[var(--spacing-4)] py-[var(--spacing-3)]">
                    {statusBadge(product.status)}
                  </td>
                  <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] hidden lg:table-cell">
                    {availabilityBadge(product.availability_type)}
                  </td>
                  <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-right font-medium text-[var(--color-earth-800)]">
                    {product.price != null ? `₹${product.price.toLocaleString('en-IN')}` : '—'}
                  </td>
                  <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-[var(--color-earth-400)] hidden xl:table-cell whitespace-nowrap">
                    {new Date(product.created_at).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-right">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="text-[var(--color-brand-primary)] hover:underline font-medium text-[var(--font-size-xs)]"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
