export const instant = false;
/**
 * /admin/customers — Customers placeholder page.
 */

import { requireStaff } from '@/lib/auth/admin';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';

export default async function CustomersPage() {
  await requireStaff();

  return (
    <div>
      <AdminPageHeader
        title="Customers"
        description="Browse and manage customer accounts."
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Customers' }]}
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
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <div>
          <h2 className="heading-5 mb-[var(--spacing-2)]">Coming soon</h2>
          <p className="body-small text-[var(--color-earth-500)]">
            Customer management — full implementation coming in a future sprint.
          </p>
        </div>
      </div>
    </div>
  );
}
