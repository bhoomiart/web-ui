export const instant = false;
import { Suspense } from 'react';
import { Spinner } from '@/components/ui/Spinner';
/**
 * /admin/categories/subcategories — Subcategory list page.
 * Groups subcategories under their parent category.
 */

import Link from 'next/link';
import { requireStaff } from '@/lib/auth/admin';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';
import { AdminOnly } from '@/components/layout/AdminRole';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function SubcategoriesPagePage() {
  await requireStaff();
  return (
    <div>
      <AdminPageHeader
        title="Subcategories"
        description="Manage subcategories."
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Subcategories' }]}
      />
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <Spinner size="lg" label="Loading..." />
          </div>
        }
      >
        <SubcategoriesPageContent />
      </Suspense>
    </div>
  );
}

async function SubcategoriesPageContent() {
  await requireStaff();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('subcategories')
    .select('id, name, slug, is_visible, display_order, category_id, categories(id, name)')
    .order('display_order', { ascending: true });

  if (error) throw new Error(`SubcategoriesPage: ${error.message}`);

  const subcategories = data ?? [];

  // Group by parent category
  type SubRow = (typeof subcategories)[number] & {
    categories: { id: string; name: string } | null;
  };

  const groups = new Map<string, { parentName: string; parentId: string; subs: SubRow[] }>();
  for (const sub of subcategories as SubRow[]) {
    const parentId = sub.category_id;
    const parentName = sub.categories?.name ?? 'Unknown';
    if (!groups.has(parentId)) {
      groups.set(parentId, { parentName, parentId, subs: [] });
    }
    groups.get(parentId)!.subs.push(sub);
  }

  const groupList = Array.from(groups.values()).sort((a, b) =>
    a.parentName.localeCompare(b.parentName)
  );

  return (
    <div>
      <AdminPageHeader
        title="Subcategories"
        description="Manage subcategories grouped by parent category."
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Categories', href: '/admin/categories' },
          { label: 'Subcategories' },
        ]}
        action={
          <AdminOnly>
            <Link
              href="/admin/categories/subcategories/new"
              className="inline-flex items-center gap-[var(--spacing-2)] px-[var(--spacing-5)] py-[var(--spacing-2)] rounded-[var(--radius-button)] bg-[var(--color-brand-primary)] text-white text-[var(--font-size-sm)] font-semibold shadow-[var(--shadow-button)] hover:bg-[var(--color-earth-700)] transition-colors"
            >
              + Add Subcategory
            </Link>
          </AdminOnly>
        }
      />

      {subcategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-[var(--color-earth-400)]">
          <p className="text-[var(--font-size-sm)]">No subcategories found.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-[var(--spacing-6)]">
          {groupList.map((group) => (
            <section key={group.parentId}>
              <h2 className="text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-500)] uppercase tracking-widest mb-[var(--spacing-2)] px-1">
                {group.parentName}
              </h2>
              <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] overflow-hidden">
                <table className="w-full text-[var(--font-size-sm)]">
                  <thead className="bg-[var(--color-earth-50)] border-b border-[var(--color-earth-100)]">
                    <tr>
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
                      <th className="px-[var(--spacing-4)] py-[var(--spacing-3)] w-16" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-earth-100)]">
                    {group.subs.map((sub) => (
                      <tr
                        key={sub.id}
                        className="hover:bg-[var(--color-earth-50)] transition-colors"
                      >
                        <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-900)]">
                          {sub.name}
                        </td>
                        <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-[var(--color-earth-400)] font-mono text-[var(--font-size-xs)] hidden md:table-cell">
                          {sub.slug}
                        </td>
                        <td className="px-[var(--spacing-4)] py-[var(--spacing-3)]">
                          {sub.is_visible ? (
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
                          {sub.display_order}
                        </td>
                        <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-right">
                          <AdminOnly>
                            <Link
                              href={`/admin/categories/subcategories/${sub.id}/edit`}
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
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
