export const instant = false;

/**
 * /admin/collections — Manage product collections.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { requireStaff } from '@/lib/auth/admin';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';
import { createAdminClient } from '@/lib/supabase/admin';
import { Spinner } from '@/components/ui/Spinner';

export default async function CollectionsPage() {
  await requireStaff();
  return (
    <div>
      <AdminPageHeader
        title="Collections"
        description="Manage product collections and their membership."
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Collections' }]}
        action={
          <Link
            href="/admin/collections/new"
            className="inline-flex items-center gap-[var(--spacing-2)] px-[var(--spacing-5)] py-[var(--spacing-2)] rounded-[var(--radius-button)] bg-[var(--color-brand-primary)] text-white text-[var(--font-size-sm)] font-semibold shadow-[var(--shadow-button)] hover:opacity-90 transition-opacity"
          >
            + Add Collection
          </Link>
        }
      />
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <Spinner size="lg" label="Loading…" />
          </div>
        }
      >
        <CollectionsContent />
      </Suspense>
    </div>
  );
}

async function CollectionsContent() {
  const admin = createAdminClient();
  const { data: collections } = await admin
    .from('collections')
    .select('*, collection_products(product_id)')
    .order('type');

  const rows = (collections ?? []).map((c) => ({
    ...c,
    productCount: (c.collection_products as Array<{ product_id: string }> | null)?.length ?? 0,
  }));

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[var(--color-earth-400)]">
        <p className="text-[var(--font-size-sm)]">No collections yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] overflow-hidden">
      <table className="w-full text-[var(--font-size-sm)]">
        <thead className="bg-[var(--color-earth-50)] border-b border-[var(--color-earth-100)]">
          <tr>
            <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)]">
              Name
            </th>
            <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)] hidden md:table-cell">
              Type
            </th>
            <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)]">
              Visible
            </th>
            <th className="text-right px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)]">
              Products
            </th>
            <th className="px-[var(--spacing-4)] py-[var(--spacing-3)] w-20" />
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-earth-100)]">
          {rows.map((c) => (
            <tr key={c.id} className="hover:bg-[var(--color-earth-50)] transition-colors">
              <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-900)]">
                {c.name}
              </td>
              <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-[var(--color-earth-500)] hidden md:table-cell capitalize">
                {c.type.replace(/_/g, ' ')}
              </td>
              <td className="px-[var(--spacing-4)] py-[var(--spacing-3)]">
                <span
                  className="inline-flex items-center px-[var(--spacing-2)] py-0.5 rounded-[var(--radius-full)] text-[var(--font-size-xs)] font-semibold"
                  style={{
                    color: c.is_visible ? 'var(--color-success)' : 'var(--color-earth-500)',
                    background: c.is_visible
                      ? 'var(--color-success-light)'
                      : 'var(--color-earth-100)',
                  }}
                >
                  {c.is_visible ? 'Visible' : 'Hidden'}
                </span>
              </td>
              <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-right text-[var(--color-earth-700)]">
                {c.productCount}
              </td>
              <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-right">
                <Link
                  href={`/admin/collections/${c.id}/edit`}
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
  );
}
