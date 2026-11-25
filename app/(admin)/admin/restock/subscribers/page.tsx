export const instant = false;
/**
 * /admin/restock/subscribers — Restock subscribers placeholder page.
 */

import { requireStaff } from '@/lib/auth/admin';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';

export default async function RestockSubscribersPage() {
  await requireStaff();

  return (
    <div>
      <AdminPageHeader
        title="Restock Subscribers"
        description="Customers waiting to be notified when products are back in stock."
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Restock Subscribers' },
        ]}
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
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </div>
        <div>
          <h2 className="heading-5 mb-[var(--spacing-2)]">Coming soon</h2>
          <p className="body-small text-[var(--color-earth-500)]">
            Restock subscriber management and notification dispatch — full implementation coming in
            a future sprint.
          </p>
        </div>
      </div>
    </div>
  );
}
