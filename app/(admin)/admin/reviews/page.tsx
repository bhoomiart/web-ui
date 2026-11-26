export const instant = false;
import { Suspense } from 'react';
import { Spinner } from '@/components/ui/Spinner';
/**
 * /admin/reviews — Review moderation page.
 * Server Component. Tabs: All, Pending, Approved, Rejected.
 */

import Link from 'next/link';
import { requireStaff } from '@/lib/auth/admin';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';
import { listAllReviews } from '@/lib/db/reviews';
import { ReviewModerationActions } from '@/components/admin/ReviewModerationActions';

type TabKey = 'all' | 'pending' | 'approved' | 'rejected';

const STATUS_TABS: { key: TabKey; label: string; value?: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending', value: 'pending' },
  { key: 'approved', label: 'Approved', value: 'approved' },
  { key: 'rejected', label: 'Rejected', value: 'rejected' },
];

function reviewStatusBadge(status: string) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'Pending', color: 'var(--color-warning)', bg: 'var(--color-warning-light)' },
    approved: {
      label: 'Approved',
      color: 'var(--color-success)',
      bg: 'var(--color-success-light)',
    },
    rejected: { label: 'Rejected', color: 'var(--color-error)', bg: 'var(--color-error-light)' },
    hidden: { label: 'Hidden', color: 'var(--color-earth-500)', bg: 'var(--color-earth-100)' },
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

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className="w-3.5 h-3.5"
          fill={i <= rating ? 'var(--color-warning)' : 'none'}
          stroke={i <= rating ? 'var(--color-warning)' : 'var(--color-earth-200)'}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      ))}
    </span>
  );
}

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireStaff();

  const { status: rawStatus } = await searchParams;
  const statusParam = typeof rawStatus === 'string' ? rawStatus : undefined;
  const activeTab = (statusParam ?? 'all') as TabKey;

  const { reviews } = await listAllReviews({ status: statusParam, limit: 50 });

  function tabHref(tab: { key: TabKey; value?: string }) {
    return tab.value ? `/admin/reviews?status=${tab.value}` : '/admin/reviews';
  }

  return (
    <div>
      <AdminPageHeader
        title="Reviews"
        description="Moderate customer product reviews."
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Reviews' }]}
      />

      {/* Tabs */}
      <div className="flex gap-[var(--spacing-1)] mb-[var(--spacing-5)] border-b border-[var(--color-earth-100)]">
        {STATUS_TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <Link
              key={tab.key}
              href={tabHref(tab)}
              className={`px-[var(--spacing-4)] py-[var(--spacing-2)] text-[var(--font-size-sm)] font-semibold border-b-2 transition-colors -mb-px ${
                isActive
                  ? 'border-[var(--color-brand-primary)] text-[var(--color-brand-primary)]'
                  : 'border-transparent text-[var(--color-earth-500)] hover:text-[var(--color-earth-800)]'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {reviews.length === 0 ? (
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
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
          <p className="text-[var(--font-size-sm)]">No reviews found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] overflow-hidden">
          <table className="w-full text-[var(--font-size-sm)]">
            <thead className="bg-[var(--color-earth-50)] border-b border-[var(--color-earth-100)]">
              <tr>
                <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)]">
                  Product
                </th>
                <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)]">
                  Customer
                </th>
                <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)] hidden lg:table-cell">
                  Review
                </th>
                <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)]">
                  Rating
                </th>
                <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)]">
                  Status
                </th>
                <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)] hidden lg:table-cell">
                  Verified
                </th>
                <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)] hidden xl:table-cell">
                  Date
                </th>
                <th className="px-[var(--spacing-4)] py-[var(--spacing-3)]" aria-label="Actions" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-earth-100)]">
              {reviews.map((review) => {
                const product = review.products as {
                  id: string;
                  name: string;
                  slug: string;
                } | null;
                return (
                  <tr
                    key={review.id}
                    className="hover:bg-[var(--color-earth-50)] transition-colors"
                  >
                    <td className="px-[var(--spacing-4)] py-[var(--spacing-3)]">
                      <span className="font-semibold text-[var(--color-earth-900)]">
                        {product?.name ?? '—'}
                      </span>
                    </td>
                    <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-[var(--color-earth-700)]">
                      {review.customer_name}
                    </td>
                    <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-[var(--color-earth-500)] hidden lg:table-cell max-w-[200px]">
                      <p className="truncate text-[var(--font-size-xs)]">{review.body ?? '—'}</p>
                      {review.admin_response && (
                        <p className="truncate text-[var(--font-size-2xs)] text-[var(--color-info)] mt-0.5">
                          ↳ {review.admin_response}
                        </p>
                      )}
                    </td>
                    <td className="px-[var(--spacing-4)] py-[var(--spacing-3)]">
                      <StarRating rating={review.rating} />
                    </td>
                    <td className="px-[var(--spacing-4)] py-[var(--spacing-3)]">
                      {reviewStatusBadge(review.status)}
                    </td>
                    <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] hidden lg:table-cell">
                      {review.is_verified_purchase ? (
                        <span
                          className="inline-flex items-center gap-1 px-[var(--spacing-2)] py-0.5 rounded-[var(--radius-full)] text-[var(--font-size-xs)] font-semibold"
                          style={{
                            color: 'var(--color-info)',
                            background: 'var(--color-info-light)',
                          }}
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Verified
                        </span>
                      ) : (
                        <span className="text-[var(--font-size-xs)] text-[var(--color-earth-400)]">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-[var(--color-earth-400)] hidden xl:table-cell whitespace-nowrap">
                      {new Date(review.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-right">
                      <ReviewModerationActions
                        reviewId={review.id}
                        currentStatus={review.status}
                        existingResponse={review.admin_response}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
