export const instant = false;
import { Suspense } from 'react';
import { Spinner } from '@/components/ui/Spinner';
/**
 * /admin/categories — Category list page.
 * Queries categories with subcategory counts via admin client.
 */

import Image from 'next/image';
import Link from 'next/link';
import { requireStaff } from '@/lib/auth/admin';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';
import { AdminOnly } from '@/components/layout/AdminRole';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function CategoriesPagePage() {
  await requireStaff();
  return (
    <div>
      <AdminPageHeader
        title="Categories"
        description="Manage product categories."
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Categories' }]}
      />
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <Spinner size="lg" label="Loading..." />
          </div>
        }
      >
        <CategoriesPageContent />
      </Suspense>
    </div>
  );
}

async function CategoriesPageContent() {
  await requireStaff();

  const admin = createAdminClient();
  const { data: categories, error } = await admin
    .from('categories')
    .select('id, name, slug, is_visible, display_order, image_url, subcategories(id)')
    .order('display_order', { ascending: true });

  if (error) throw new Error(`CategoriesPage: ${error.message}`);

  const rows = (categories ?? []).map((cat) => ({
    ...cat,
    subcategoryCount: (cat.subcategories as Array<{ id: string }> | null)?.length ?? 0,
  }));

  return (
    <div>
      <AdminPageHeader
        title="Categories"
        description="Manage product categories and their visibility."
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Categories' }]}
        action={
          <AdminOnly>
            <Link
              href="/admin/categories/new"
              className="inline-flex items-center gap-[var(--spacing-2)] px-[var(--spacing-5)] py-[var(--spacing-2)] rounded-[var(--radius-button)] bg-[var(--color-brand-primary)] text-white text-[var(--font-size-sm)] font-semibold shadow-[var(--shadow-button)] hover:bg-[var(--color-earth-700)] transition-colors"
            >
              + Add Category
            </Link>
          </AdminOnly>
        }
      />

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-[var(--color-earth-400)]">
          <p className="text-[var(--font-size-sm)]">No categories found.</p>
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
                  Slug
                </th>
                <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)]">
                  Visible
                </th>
                <th className="text-right px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)] hidden sm:table-cell">
                  Order
                </th>
                <th className="text-right px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)] hidden lg:table-cell">
                  Subcategories
                </th>
                <th className="px-[var(--spacing-4)] py-[var(--spacing-3)] w-16 text-left font-semibold text-[var(--color-earth-600)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-earth-100)]">
              {rows.map((cat) => (
                <tr key={cat.id} className="hover:bg-[var(--color-earth-50)] transition-colors">
                  <td className="px-[var(--spacing-4)] py-[var(--spacing-3)]">
                    {cat.image_url ? (
                      <Image
                        src={cat.image_url}
                        alt={cat.name}
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
                          <path strokeLinecap="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                      </div>
                    )}
                  </td>
                  <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-900)]">
                    {cat.name}
                  </td>
                  <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-[var(--color-earth-400)] font-mono text-[var(--font-size-xs)] hidden md:table-cell">
                    {cat.slug}
                  </td>
                  <td className="px-[var(--spacing-4)] py-[var(--spacing-3)]">
                    {cat.is_visible ? (
                      <span
                        className="inline-flex items-center px-[var(--spacing-2)] py-0.5 rounded-[var(--radius-full)] text-[var(--font-size-xs)] font-semibold"
                        style={{
                          color: 'var(--color-success)',
                          background: 'var(--color-success-light)',
                        }}
                      >
                        Visible
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center px-[var(--spacing-2)] py-0.5 rounded-[var(--radius-full)] text-[var(--font-size-xs)] font-semibold"
                        style={{
                          color: 'var(--color-earth-500)',
                          background: 'var(--color-earth-100)',
                        }}
                      >
                        Hidden
                      </span>
                    )}
                  </td>
                  <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-right text-[var(--color-earth-500)] hidden sm:table-cell">
                    {cat.display_order}
                  </td>
                  <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-right hidden lg:table-cell">
                    <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-[var(--spacing-2)] rounded-[var(--radius-full)] bg-[var(--color-earth-100)] text-[var(--color-earth-600)] text-[var(--font-size-xs)] font-semibold">
                      {cat.subcategoryCount}
                    </span>
                  </td>
                  <td className="px-[var(--spacing-4)] py-[var(--spacing-3)]">
                    <AdminOnly>
                      <Link
                        href={`/admin/categories/${cat.id}/edit`}
                        className="text-[var(--color-brand-primary)] hover:underline font-medium text-[var(--font-size-xs)]"
                      >
                        Edit
                      </Link>
                    </AdminOnly>
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
