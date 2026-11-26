'use client';

/**
 * ReviewModerationActions (A7-T2-2, A7-T2-3, A7-T2-4)
 *
 * Per-row action controls on the admin reviews page.
 * Approve / Reject / Hide, plus an optional admin response field.
 * Calls PATCH /api/admin/reviews/[id].
 */

import React from 'react';
import { useRouter } from 'next/navigation';

interface ReviewModerationActionsProps {
  reviewId: string;
  currentStatus: string;
  existingResponse: string | null;
}

export function ReviewModerationActions({
  reviewId,
  currentStatus,
  existingResponse,
}: ReviewModerationActionsProps) {
  const router = useRouter();
  const [showResponse, setShowResponse] = React.useState(false);
  const [adminResponse, setAdminResponse] = React.useState(existingResponse ?? '');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function moderate(status: 'approved' | 'rejected' | 'hidden') {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          admin_response: adminResponse.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Failed to update.');
        return;
      }
      router.refresh();
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  }

  const btnBase =
    'inline-flex items-center px-[var(--spacing-3)] py-[var(--spacing-1)] rounded-[var(--radius-sm)] text-[var(--font-size-xs)] font-semibold border transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]';

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap gap-[var(--spacing-1)] justify-end">
        {currentStatus !== 'approved' && (
          <button
            type="button"
            onClick={() => moderate('approved')}
            disabled={loading}
            className={`${btnBase} border-[var(--color-success)] text-[var(--color-success)] hover:bg-[var(--color-success-light)]`}
          >
            Approve
          </button>
        )}
        {currentStatus !== 'rejected' && (
          <button
            type="button"
            onClick={() => moderate('rejected')}
            disabled={loading}
            className={`${btnBase} border-[var(--color-error)] text-[var(--color-error)] hover:bg-[var(--color-error-light)]`}
          >
            Reject
          </button>
        )}
        {currentStatus !== 'hidden' && (
          <button
            type="button"
            onClick={() => moderate('hidden')}
            disabled={loading}
            className={`${btnBase} border-[var(--color-earth-200)] text-[var(--color-earth-500)] hover:border-[var(--color-earth-400)]`}
          >
            Hide
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowResponse((v) => !v)}
          className={`${btnBase} border-[var(--color-info)] text-[var(--color-info)] hover:bg-[var(--color-info-light)]`}
          aria-expanded={showResponse}
        >
          {existingResponse ? 'Edit Reply' : 'Reply'}
        </button>
      </div>

      {/* Admin response field */}
      {showResponse && (
        <div className="flex flex-col gap-1 w-full max-w-xs">
          <textarea
            value={adminResponse}
            onChange={(e) => setAdminResponse(e.target.value)}
            rows={2}
            placeholder="Your response (visible to customers)…"
            className="w-full px-[var(--spacing-3)] py-[var(--spacing-2)] rounded-[var(--radius-md)] border border-[var(--color-earth-200)] bg-white text-[var(--font-size-xs)] text-[var(--color-earth-800)] focus:outline-none focus:border-[var(--color-brand-primary)] resize-none"
          />
          <button
            type="button"
            onClick={() => moderate(currentStatus as 'approved' | 'rejected' | 'hidden')}
            disabled={loading}
            className="self-end px-[var(--spacing-3)] py-[var(--spacing-1)] rounded-[var(--radius-sm)] bg-[var(--color-brand-primary)] text-white text-[var(--font-size-xs)] font-semibold hover:bg-[var(--color-earth-700)] transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Save Response'}
          </button>
        </div>
      )}

      {error && <p className="text-[var(--font-size-xs)] text-[var(--color-error)]">{error}</p>}
    </div>
  );
}
