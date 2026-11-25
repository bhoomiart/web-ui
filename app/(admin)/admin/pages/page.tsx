export const instant = false;

/**
 * /admin/pages — Static page management.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { requireStaff } from '@/lib/auth/admin';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';
import { createAdminClient } from '@/lib/supabase/admin';
import { Spinner } from '@/components/ui/Spinner';

export default async function PagesAdminPage() {
  await requireStaff();
  return (
    <div>
      <AdminPageHeader
        title="Pages & Blog"
        description="Manage static content pages and blog posts."
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Pages & Blog' }]}
        action={
          <Link
            href="/admin/pages/new"
            className="inline-flex items-center gap-[var(--spacing-2)] px-[var(--spacing-5)] py-[var(--spacing-2)] rounded-[var(--radius-button)] bg-[var(--color-brand-primary)] text-white text-[var(--font-size-sm)] font-semibold shadow-[var(--shadow-button)] hover:opacity-90 transition-opacity"
          >
            + Add Page
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
        <PagesContent />
      </Suspense>
    </div>
  );
}

async function PagesContent() {
  const admin = createAdminClient();
  const { data: pages } = await admin
    .from('pages')
    .select('id, slug, title, is_published, updated_at')
    .order('title');

  const rows = pages ?? [];

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] flex flex-col items-center justify-center py-16">
        <p className="text-[var(--font-size-sm)] text-[var(--color-earth-400)]">No pages yet.</p>
        <Link
          href="/admin/pages/new"
          className="mt-3 text-[var(--font-size-sm)] font-semibold text-[var(--color-brand-primary)] hover:underline"
        >
          Create your first page →
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] overflow-hidden">
      <table className="w-full text-[var(--font-size-sm)]">
        <thead className="bg-[var(--color-earth-50)] border-b border-[var(--color-earth-100)]">
          <tr>
            <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)]">
              Title
            </th>
            <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)] hidden md:table-cell">
              Slug
            </th>
            <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)]">
              Status
            </th>
            <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)] hidden lg:table-cell">
              Updated
            </th>
            <th className="px-[var(--spacing-4)] py-[var(--spacing-3)] w-24" />
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-earth-100)]">
          {rows.map((page) => (
            <tr key={page.id} className="hover:bg-[var(--color-earth-50)] transition-colors">
              <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-900)]">
                {page.title}
              </td>
              <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-[var(--color-earth-400)] font-mono text-[var(--font-size-xs)] hidden md:table-cell">
                /{page.slug}
              </td>
              <td className="px-[var(--spacing-4)] py-[var(--spacing-3)]">
                <span
                  className="inline-flex items-center px-[var(--spacing-2)] py-0.5 rounded-[var(--radius-full)] text-[var(--font-size-xs)] font-semibold"
                  style={{
                    color: page.is_published ? 'var(--color-success)' : 'var(--color-warning)',
                    background: page.is_published
                      ? 'var(--color-success-light)'
                      : 'var(--color-warning-light)',
                  }}
                >
                  {page.is_published ? 'Published' : 'Draft'}
                </span>
              </td>
              <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-[var(--color-earth-400)] hidden lg:table-cell">
                {new Date(page.updated_at).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </td>
              <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-right">
                <Link
                  href={`/admin/pages/${page.id}/edit`}
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
