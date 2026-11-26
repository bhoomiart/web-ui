'use client';

/**
 * OrderActionsPanel (A6-T4-3, A6-T4-5, A6-T4-6)
 *
 * Client component that lives in the admin order detail sidebar.
 * - Status update dropdown + confirm button
 * - Payment status update
 * - WhatsApp customer contact button with pre-filled messages
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { OrderStatusBadge } from './OrderStatusBadge';
import { templates, customerWhatsAppUrl } from '@/lib/whatsapp';

interface OrderActionsPanelProps {
  orderId: string;
  currentStatus: string;
  currentPaymentStatus: string;
  customerName: string;
  phone: string;
  orderNumber: string;
}

// Valid transitions from each status
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['customization_in_progress', 'ready_for_dispatch', 'cancelled'],
  customization_in_progress: ['ready_for_dispatch', 'cancelled'],
  ready_for_dispatch: ['shipped'],
  shipped: ['delivered'],
  delivered: [],
  cancellation_requested: ['cancelled', 'confirmed'],
  return_requested: ['return_approved', 'return_rejected'],
  return_approved: ['return_in_transit'],
  return_in_transit: ['returned'],
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirm Order',
  processing: 'Mark Processing',
  customization_in_progress: 'Mark Customizing',
  ready_for_dispatch: 'Mark Ready for Dispatch',
  shipped: 'Mark Shipped',
  delivered: 'Mark Delivered',
  cancelled: 'Cancel Order',
  return_approved: 'Approve Return',
  return_rejected: 'Reject Return',
  return_in_transit: 'Mark Return in Transit',
  returned: 'Mark Returned',
};

const WA_TEMPLATES: Record<string, (name: string, orderNum: string) => string> = {
  confirmed: (n, o) => templates.orderConfirmation(n, o),
  processing: (n, o) => templates.processingUpdate(n, o),
  ready_for_dispatch: (n, o) =>
    templates.processingUpdate(n, o, 'Your order is packed and ready to ship!'),
  shipped: (n, o) => templates.dispatchUpdate(n, o),
  delivered: (n, o) => templates.deliveryConfirmation(n, o),
  cancelled: (n, o) => templates.cancellationUpdate(n, o),
  return_approved: (n, o) => templates.returnRefundUpdate(n, o, 'return_approved'),
};

export function OrderActionsPanel({
  orderId,
  currentStatus,
  currentPaymentStatus,
  customerName,
  phone,
  orderNumber,
}: OrderActionsPanelProps) {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = React.useState('');
  const [statusNotes, setStatusNotes] = React.useState('');
  const [paymentStatus, setPaymentStatus] = React.useState(currentPaymentStatus);
  const [paymentNotes, setPaymentNotes] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const transitions = VALID_TRANSITIONS[currentStatus] ?? [];
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '917019400775';

  async function handleStatusUpdate() {
    if (!selectedStatus) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selectedStatus, notes: statusNotes || undefined }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Failed to update status.');
        return;
      }
      setSuccess(`Status updated to "${selectedStatus}".`);
      setSelectedStatus('');
      setStatusNotes('');
      router.refresh();
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  }

  async function handlePaymentUpdate() {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_status: paymentStatus,
          payment_notes: paymentNotes || undefined,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Failed to update payment.');
        return;
      }
      setSuccess('Payment status updated.');
      setPaymentNotes('');
      router.refresh();
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  }

  function openWhatsApp(template?: string) {
    const msg = template
      ? (WA_TEMPLATES[template]?.(customerName, orderNumber) ?? templates.generalEnquiry())
      : `Hi ${customerName}! Regarding your Bhoomi Art order #${orderNumber}.`;
    window.open(customerWhatsAppUrl(phone, msg), '_blank', 'noopener,noreferrer');
  }

  const inputClass =
    'w-full px-[var(--spacing-3)] py-[var(--spacing-2)] rounded-[var(--radius-md)] border border-[var(--color-earth-200)] bg-white text-[var(--font-size-sm)] text-[var(--color-earth-800)] focus:outline-none focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)]/20';
  const btnPrimary =
    'flex items-center justify-center gap-[var(--spacing-1)] px-[var(--spacing-4)] py-[var(--spacing-2)] rounded-[var(--radius-button)] bg-[var(--color-brand-primary)] text-white text-[var(--font-size-xs)] font-semibold hover:bg-[var(--color-earth-700)] transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]';

  return (
    <div className="flex flex-col gap-[var(--spacing-5)]">
      {/* Status update */}
      <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-[var(--spacing-5)]">
        <h3 className="heading-6 mb-[var(--spacing-4)]">Order Status</h3>

        <div className="flex items-center justify-between mb-[var(--spacing-4)]">
          <span className="text-[var(--font-size-sm)] text-[var(--color-earth-500)]">Current</span>
          <OrderStatusBadge status={currentStatus} />
        </div>

        {transitions.length > 0 ? (
          <div className="flex flex-col gap-[var(--spacing-3)]">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={inputClass}
              aria-label="New order status"
            >
              <option value="">Select new status…</option>
              {transitions.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s] ?? s.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            <textarea
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              placeholder="Optional notes for this status change…"
              rows={2}
              className={inputClass}
            />
            <button
              type="button"
              onClick={handleStatusUpdate}
              disabled={!selectedStatus || loading}
              className={btnPrimary}
            >
              {loading ? (
                <span
                  className="w-3 h-3 rounded-full border border-white border-t-transparent animate-spin"
                  aria-hidden="true"
                />
              ) : null}
              Update Status
            </button>

            {/* Quick WhatsApp for the selected transition */}
            {selectedStatus && WA_TEMPLATES[selectedStatus] && (
              <button
                type="button"
                onClick={() => openWhatsApp(selectedStatus)}
                className="flex items-center justify-center gap-[var(--spacing-1)] px-[var(--spacing-4)] py-[var(--spacing-2)] rounded-[var(--radius-button)] border border-[var(--color-forest-500)] text-[var(--color-forest-500)] text-[var(--font-size-xs)] font-semibold hover:bg-[var(--color-forest-50)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-forest-500)]"
              >
                <svg
                  aria-hidden="true"
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Also notify customer
              </button>
            )}
          </div>
        ) : (
          <p className="text-[var(--font-size-xs)] text-[var(--color-earth-400)] italic">
            No further transitions available.
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mt-[var(--spacing-2)] text-[var(--font-size-xs)] text-[var(--color-error)]"
          >
            {error}
          </p>
        )}
        {success && (
          <p
            role="status"
            className="mt-[var(--spacing-2)] text-[var(--font-size-xs)] text-[var(--color-success)]"
          >
            {success}
          </p>
        )}
      </div>

      {/* Payment */}
      <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-[var(--spacing-5)]">
        <h3 className="heading-6 mb-[var(--spacing-4)]">Payment</h3>
        <div className="flex flex-col gap-[var(--spacing-3)]">
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className={inputClass}
            aria-label="Payment status"
          >
            <option value="pending">Pending</option>
            <option value="received">Received</option>
            <option value="failed">Failed</option>
          </select>
          <input
            type="text"
            value={paymentNotes}
            onChange={(e) => setPaymentNotes(e.target.value)}
            placeholder="UPI/bank reference (optional)"
            className={inputClass}
          />
          <button
            type="button"
            onClick={handlePaymentUpdate}
            disabled={loading}
            className={btnPrimary}
          >
            Update Payment
          </button>
        </div>
      </div>

      {/* WhatsApp contact */}
      <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-[var(--spacing-5)]">
        <h3 className="heading-6 mb-[var(--spacing-3)]">Contact Customer</h3>
        <p className="text-[var(--font-size-xs)] text-[var(--color-earth-500)] mb-[var(--spacing-3)]">
          Opens WhatsApp with a pre-filled message.
        </p>
        <div className="flex flex-col gap-[var(--spacing-2)]">
          <button
            type="button"
            onClick={() => openWhatsApp()}
            className="flex items-center gap-[var(--spacing-2)] px-[var(--spacing-3)] py-[var(--spacing-2)] rounded-[var(--radius-md)] border border-[var(--color-forest-400)] text-[var(--color-forest-500)] text-[var(--font-size-xs)] font-semibold hover:bg-[var(--color-forest-50)] transition-colors text-left"
          >
            <svg
              aria-hidden="true"
              className="w-4 h-4 shrink-0"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            General enquiry
          </button>
        </div>
      </div>
    </div>
  );
}
