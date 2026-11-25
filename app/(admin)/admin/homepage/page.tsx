export const instant = false;
/**
 * /admin/homepage — Homepage sections placeholder page.
 */

import { requireStaff } from '@/lib/auth/admin';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';

export default async function HomepagePage() {
  await requireStaff();

  return (
    <div>
      <AdminPageHeader
        title="Homepage"
        description="Configure homepage banners and sections."
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Homepage' }]}
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
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
        </div>
        <div>
          <h2 className="heading-5 mb-[var(--spacing-2)]">Coming soon</h2>
          <p className="body-small text-[var(--color-earth-500)]">
            Homepage section and banner management — full implementation coming in a future sprint.
          </p>
        </div>
      </div>
    </div>
  );
}
