export const instant = false;

import { requireStaff } from '@/lib/auth/admin';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';

export default async function AnalyticsPage() {
  await requireStaff();
  return (
    <div>
      <AdminPageHeader
        title="Reports & Analytics"
        description="Traffic, sales, and product performance."
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Analytics' }]}
      />
      <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-[var(--spacing-8)] flex flex-col items-center justify-center gap-[var(--spacing-3)] text-center">
        <svg
          className="w-12 h-12 text-[var(--color-earth-200)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <p className="text-[var(--font-size-base)] font-semibold text-[var(--color-earth-600)]">
          Analytics coming in A8
        </p>
        <p className="text-[var(--font-size-sm)] text-[var(--color-earth-400)] max-w-sm">
          Google Analytics 4 and Search Console integration will be added in the SEO & Performance
          phase.
        </p>
      </div>
    </div>
  );
}
