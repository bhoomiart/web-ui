export const instant = false;
/**
 * /admin/collections — Collections placeholder page.
 */

import { requireStaff } from '@/lib/auth/admin';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';

export default async function CollectionsPage() {
  await requireStaff();

  return (
    <div>
      <AdminPageHeader
        title="Collections"
        description="Manage curated product collections."
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Collections' }]}
      />

      <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-[var(--spacing-8)] flex flex-col items-center justify-center gap-[var(--spacing-4)] text-center max-w-md mx-auto">
        <div className="w-14 h-14 rounded-full bg-[var(--color-earth-100)] flex items-center justify-center">
          <svg
            className="w-7 h-7 text-[var(--color-earth-400)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <div>
          <h2 className="heading-5 mb-[var(--spacing-2)]">Coming soon</h2>
          <p className="body-small text-[var(--color-earth-500)]">
            Collections management — full implementation coming in a future sprint.
          </p>
        </div>
      </div>
    </div>
  );
}
