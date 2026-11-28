'use client';
/**
 * OrderView: one order's items, review prompts, return option, timeline and contact link.
 * Shared by the signed-in order history and the guest phone + order number lookup.
 */
import React from 'react';
import { ReviewForm } from '@/components/storefront/ReviewForm';
import { ReturnRequestForm } from './ReturnRequestForm';

export type OrderData = {
  id: string;
  order_number: string;
  customer_name: string;
  phone?: string;
  status: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
  order_items: Array<{
    id: string;
    products: { id: string; name: string; slug: string } | null;
    quantity: number;
    unit_price: number;
    item_total: number;
    snapshot: { name?: string; sku?: string | null; image_url?: string | null };
    /** This line's own status */
    status: string;
    /** Set by the server: the line can be returned now */
    canReturn?: boolean;
    /** Set by the server: a return was already requested for this line (any outcome) */
    returned?: boolean;
    /** Set by the server: this line's current return request */
    returnId?: string | null;
    returnStatus?: string | null;
    /** Set by the server: its return is still pending, so it can be cancelled */
    canCancelReturn?: boolean;
    returnDeadline?: string;
    /** Set by the server: details of this line's return request */
    returnInfo?: {
      id: string;
      status: string;
      reason: string;
      description: string | null;
      createdAt: string;
      photos: string[];
    } | null;
  }>;
  order_status_history: Array<{
    id: string;
    order_item_id?: string | null;
    new_status: string;
    previous_status: string | null;
    notes: string | null;
    created_at: string;
  }>;
};

export const STATUS_LABELS: Record<string, string> = {
  pending: 'Order Received',
  confirmed: 'Confirmed',
  processing: 'Processing',
  customization_in_progress: 'Customization in Progress',
  ready_for_dispatch: 'Ready for Dispatch',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancellation_requested: 'Cancellation Requested',
  cancelled: 'Cancelled',
  return_requested: 'Return Requested',
  return_approved: 'Return Approved',
  return_rejected: 'Return Declined',
  return_in_transit: 'Return in Transit',
  returned: 'Returned',
  refund_requested: 'Refund Requested',
  refund_under_review: 'Refund Under Review',
  refund_approved: 'Refund Approved',
  refund_processing: 'Refund Processing',
  refund_rejected: 'Refund Declined',
  partially_refunded: 'Partially Refunded',
  refunded: 'Refunded',
};

const RETURN_STATUS_LABELS: Record<string, string> = {
  pending: 'Waiting for review',
  approved: 'Approved',
  rejected: 'Declined',
  in_transit: 'Return in transit',
  completed: 'Return received',
  cancelled: 'Cancelled',
};
const REASON_LABELS: Record<string, string> = {
  damaged: 'Item arrived damaged',
  wrong_item: 'Wrong item received',
  quality_issue: 'Quality issue',
  changed_mind: 'Changed my mind',
  other: 'Other',
};
export const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Label for one line. A delivered line whose return was declined says so. */
function lineLabel(item: OrderData['order_items'][number]) {
  if (item.status === 'delivered' && item.returned) return 'Delivered (return declined)';
  return STATUS_LABELS[item.status] ?? item.status.replace(/_/g, ' ');
}

function lineColor(status: string) {
  if (status === 'delivered') return 'var(--color-success)';
  if (status === 'cancelled') return 'var(--color-error)';
  return 'var(--color-info)';
}

export function OrderView({
  order,
  phone,
  reviewedProductIds,
  signedIn,
  onReturned,
}: {
  order: OrderData;
  phone: string;
  reviewedProductIds: string[];
  signedIn: boolean;
  onReturned: () => void;
}) {
  const reviewed = new Set(reviewedProductIds);
  const returnable = order.order_items.filter((i) => i.canReturn);
  const deliveredItems = order.order_items.filter((i) => i.status === 'delivered');
  const mixed = new Set(order.order_items.map((i) => i.status)).size > 1;
  const returnGroups = Object.values(
    order.order_items.reduce<
      Record<
        string,
        {
          info: NonNullable<OrderData['order_items'][number]['returnInfo']>;
          lines: OrderData['order_items'];
        }
      >
    >((acc, i) => {
      if (!i.returnInfo) return acc;
      (acc[i.returnInfo.id] ??= { info: i.returnInfo, lines: [] }).lines.push(i);
      return acc;
    }, {})
  );
  const [cancelling, setCancelling] = React.useState<string | null>(null);
  const [cancelError, setCancelError] = React.useState<string | null>(null);
  async function cancelReturn(returnId: string) {
    setCancelling(returnId);
    setCancelError(null);
    try {
      const res = await fetch(`/api/returns/${returnId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_number: order.order_number,
          ...(signedIn ? {} : { phone }),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCancelError(data.error ?? 'Could not cancel the return request.');
        return;
      }
      onReturned();
    } catch {
      setCancelError('Network error. Please try again.');
    } finally {
      setCancelling(null);
    }
  }
  const itemName = (id: string | null | undefined) =>
    id ? (order.order_items.find((i) => i.id === id)?.snapshot?.name ?? null) : null;
  const returnSection =
    returnable.length > 0 ? (
      <ReturnRequestForm
        orderNumber={order.order_number}
        phone={phone}
        signedIn={signedIn}
        items={returnable}
        onSubmitted={onReturned}
      />
    ) : null;

  return (
    <div className="flex flex-col gap-[var(--spacing-6)]">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-[var(--font-size-xs)] text-[var(--color-earth-500)]">Order</p>
          <p className="font-mono font-bold text-[var(--color-earth-900)]">#{order.order_number}</p>
        </div>
        <span
          className="inline-flex items-center px-[var(--spacing-3)] py-[var(--spacing-1)] rounded-[var(--radius-full)] text-[var(--font-size-xs)] font-semibold"
          style={{
            color:
              order.status === 'delivered'
                ? 'var(--color-success)'
                : order.status === 'cancelled'
                  ? 'var(--color-error)'
                  : 'var(--color-info)',
            background:
              order.status === 'delivered'
                ? 'var(--color-success-light)'
                : order.status === 'cancelled'
                  ? 'var(--color-error-light)'
                  : 'var(--color-info-light)',
          }}
        >
          {STATUS_LABELS[order.status] ?? order.status.replace(/_/g, ' ')}
        </span>
      </div>
      {mixed && (
        <p className="text-[var(--font-size-xs)] text-[var(--color-earth-500)] -mt-[var(--spacing-3)]">
          Items in this order are at different stages. See each item below.
        </p>
      )}

      {/* Items */}
      <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-earth-200)] shadow-[var(--shadow-card)] overflow-hidden">
        <table className="w-full text-[var(--font-size-sm)]">
          <thead className="bg-[var(--color-earth-50)] border-b border-[var(--color-earth-100)]">
            <tr>
              <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)]">
                Item
              </th>
              <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)]">
                Status
              </th>
              <th className="text-right px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)]">
                Qty
              </th>
              <th className="text-right px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)]">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-earth-100)]">
            {order.order_items.map((item) => (
              <tr key={item.id}>
                <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-900)]">
                  {item.snapshot?.name ?? '—'}
                </td>
                <td className="px-[var(--spacing-4)] py-[var(--spacing-3)]">
                  <span
                    className="text-[var(--font-size-xs)] font-semibold"
                    style={{ color: lineColor(item.status) }}
                  >
                    {lineLabel(item)}
                  </span>
                </td>
                <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-right text-[var(--color-earth-700)]">
                  {item.quantity}
                </td>
                <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-right font-semibold text-[var(--color-earth-900)]">
                  {fmt(item.item_total)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-[var(--color-earth-200)] bg-[var(--color-earth-50)]">
            <tr>
              <td
                colSpan={3}
                className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-right font-semibold text-[var(--color-earth-700)]"
              >
                Total
              </td>
              <td
                className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-right font-bold"
                style={{ color: 'var(--color-brand-primary)' }}
              >
                {fmt(order.order_items.reduce((s, i) => s + i.item_total, 0))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Reviews: per item, once that item is delivered */}
      {deliveredItems.length > 0 && (
        <div>
          <h2 className="heading-5 mb-[var(--spacing-2)]">Review your purchase</h2>
          <p className="body-small text-[var(--color-earth-500)] mb-[var(--spacing-4)]">
            Tell others what you think of the items you received.
          </p>
          <div className="flex flex-col gap-[var(--spacing-4)]">
            {deliveredItems.flatMap((item) => {
              const product = item.products;
              if (!product) return [];
              if (reviewed.has(product.id)) {
                return [
                  <p
                    key={item.id}
                    className="text-[var(--font-size-sm)] text-[var(--color-earth-600)]"
                  >
                    ✓ You reviewed <strong>{product.name}</strong>. Thank you!
                  </p>,
                ];
              }
              return [
                <ReviewForm
                  key={item.id}
                  productId={product.id}
                  productName={product.name}
                  orderNumber={order.order_number}
                  phone={phone}
                  defaultName={order.customer_name}
                />,
              ];
            })}
          </div>
        </div>
      )}

      {/* Return requests: details, photos and, until we review them, a cancel option */}
      {returnGroups.length > 0 && (
        <div className="flex flex-col gap-[var(--spacing-3)]">
          <h2 className="heading-5">Return requests</h2>
          {returnGroups.map(({ info, lines }) => (
            <div
              key={info.id}
              className="bg-[var(--color-earth-50)] rounded-[var(--radius-xl)] border border-[var(--color-earth-200)] p-[var(--spacing-4)] flex flex-col gap-[var(--spacing-2)]"
            >
              <div className="flex items-center justify-between gap-[var(--spacing-3)] flex-wrap">
                <p className="text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-900)]">
                  {lines.map((i) => `${i.snapshot?.name ?? 'Item'} × ${i.quantity}`).join(', ')}
                </p>
                <span className="text-[var(--font-size-xs)] font-semibold text-[var(--color-info)]">
                  {RETURN_STATUS_LABELS[info.status] ?? info.status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-[var(--font-size-xs)] text-[var(--color-earth-500)]">
                Requested {formatDate(info.createdAt)} · Reason:{' '}
                {REASON_LABELS[info.reason] ?? info.reason.replace(/_/g, ' ')}
              </p>
              {info.description && (
                <p className="text-[var(--font-size-sm)] text-[var(--color-earth-700)]">
                  “{info.description}”
                </p>
              )}
              {info.photos.length > 0 && (
                <ul className="flex flex-wrap gap-[var(--spacing-2)]">
                  {info.photos.map((url, n) => (
                    <li key={url}>
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`Return photo ${n + 1}`}
                          className="w-20 h-20 object-cover rounded-[var(--radius-md)] border border-[var(--color-earth-200)]"
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              {info.status === 'pending' && lines.some((i) => i.canCancelReturn) && (
                <div>
                  <button
                    type="button"
                    onClick={() => cancelReturn(info.id)}
                    disabled={cancelling === info.id}
                    className="px-[var(--spacing-4)] h-9 rounded-[var(--radius-button)] border border-[var(--color-error)] text-[var(--color-error)] text-[var(--font-size-xs)] font-semibold disabled:opacity-60"
                  >
                    {cancelling === info.id ? 'Cancelling…' : 'Cancel return request'}
                  </button>
                </div>
              )}
            </div>
          ))}
          {cancelError && (
            <p role="alert" className="text-[var(--font-size-sm)] text-[var(--color-error)]">
              {cancelError}
            </p>
          )}
        </div>
      )}
      {/* Return */}
      {returnSection}
      {/* Timeline */}
      <div>
        <h2 className="heading-5 mb-[var(--spacing-4)]">Order Timeline</h2>
        <ol className="relative border-l-2 border-[var(--color-earth-100)] ml-2 flex flex-col gap-[var(--spacing-5)]">
          {[...order.order_status_history].reverse().map((entry, i) => (
            <li key={entry.id} className="pl-[var(--spacing-5)] relative">
              <span
                className="absolute -left-[0.4375rem] top-1 w-3.5 h-3.5 rounded-full border-2 border-white"
                style={{
                  background: i === 0 ? 'var(--color-brand-primary)' : 'var(--color-earth-200)',
                }}
              />
              <p className="font-semibold text-[var(--font-size-sm)] text-[var(--color-earth-800)]">
                {itemName(entry.order_item_id) ? `${itemName(entry.order_item_id)}: ` : ''}
                {STATUS_LABELS[entry.new_status] ?? entry.new_status.replace(/_/g, ' ')}
              </p>
              {entry.notes && (
                <p className="text-[var(--font-size-xs)] text-[var(--color-earth-500)] mt-0.5">
                  {entry.notes}
                </p>
              )}
              <p className="text-[var(--font-size-xs)] text-[var(--color-earth-400)] mt-0.5">
                {formatDate(entry.created_at)}
              </p>
            </li>
          ))}
        </ol>
      </div>

      {/* Contact */}
      <div className="text-center pt-[var(--spacing-2)]">
        <p className="body-small text-[var(--color-earth-500)] mb-[var(--spacing-3)]">
          Have a question about your order?
        </p>
        <a
          href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '917019400775'}?text=${encodeURIComponent(`Hi! I have a question about order ${order.order_number}.`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-[var(--spacing-2)] px-[var(--spacing-5)] py-[var(--spacing-2)] rounded-[var(--radius-button)] bg-[var(--color-forest-500)] text-white text-[var(--font-size-sm)] font-semibold hover:bg-[var(--color-forest-600)] transition-colors"
        >
          Chat on WhatsApp
        </a>
      </div>
    </div>
  );
}
