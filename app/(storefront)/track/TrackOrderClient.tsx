'use client';

/**
 * TrackOrderClient
 *
 * Form to look up an order by phone + order number.
 * On success, renders the order status timeline inline.
 */

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { ReviewForm } from '@/components/storefront/ReviewForm';

type OrderData = {
  order_number: string;
  customer_name: string;
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
  }>;
  order_status_history: Array<{
    id: string;
    new_status: string;
    previous_status: string | null;
    notes: string | null;
    created_at: string;
  }>;
};

const STATUS_LABELS: Record<string, string> = {
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
  return_in_transit: 'Return in Transit',
  returned: 'Returned',
  refund_approved: 'Refund Approved',
  partially_refunded: 'Partially Refunded',
  refunded: 'Refunded',
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function TrackOrderClient({
  searchParams: spPromise,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = useSearchParams();
  const prefillOrder = sp.get('order') ?? '';

  const [orderNum, setOrderNum] = React.useState(prefillOrder);
  const [phone, setPhone] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [order, setOrder] = React.useState<OrderData | null>(null);
  const [reviewed, setReviewed] = React.useState<Set<string>>(new Set());
  const [lookupPhone, setLookupPhone] = React.useState('');

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim() || !orderNum.trim()) {
      setError('Both phone number and order number are required.');
      return;
    }
    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      const res = await fetch(
        `/api/track?phone=${encodeURIComponent(phone.trim())}&order=${encodeURIComponent(orderNum.trim())}`
      );
      const data = await res.json();
      if (!res.ok || !data.order) {
        setError(data.error ?? 'Order not found. Please check your details.');
        return;
      }
      setOrder(data.order as OrderData);
      setReviewed(new Set((data.reviewedProductIds as string[] | undefined) ?? []));
      setLookupPhone(phone.trim());
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full px-[var(--spacing-4)] py-[var(--spacing-2-5)] rounded-[var(--radius-input)] border border-[var(--color-earth-200)] bg-white text-[var(--font-size-base)] text-[var(--color-earth-900)] placeholder:text-[var(--color-earth-400)] focus:outline-none focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-brand-primary)]/20';

  return (
    <div>
      {/* Lookup form */}
      <form
        onSubmit={handleLookup}
        className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-earth-200)] shadow-[var(--shadow-card)] p-[var(--spacing-6)] flex flex-col gap-[var(--spacing-4)] mb-[var(--spacing-8)]"
      >
        <div>
          <label
            htmlFor="track-phone"
            className="block text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-700)] mb-[var(--spacing-1-5)]"
          >
            Phone Number{' '}
            <span aria-hidden="true" className="text-[var(--color-error)]">
              *
            </span>
          </label>
          <input
            id="track-phone"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            autoComplete="tel"
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor="track-order"
            className="block text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-700)] mb-[var(--spacing-1-5)]"
          >
            Order Number{' '}
            <span aria-hidden="true" className="text-[var(--color-error)]">
              *
            </span>
          </label>
          <input
            id="track-order"
            type="text"
            value={orderNum}
            onChange={(e) => setOrderNum(e.target.value)}
            placeholder="BA-20241201-1234"
            className={inputClass}
          />
        </div>

        {error && (
          <p role="alert" className="text-[var(--font-size-sm)] text-[var(--color-error)]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 flex items-center justify-center gap-[var(--spacing-2)] rounded-[var(--radius-button)] bg-[var(--color-brand-primary)] text-white font-bold hover:bg-[var(--color-earth-700)] transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2"
        >
          {loading ? (
            <span
              className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"
              aria-hidden="true"
            />
          ) : (
            'Track Order'
          )}
        </button>
      </form>

      {/* Result */}
      {order && (
        <div className="flex flex-col gap-[var(--spacing-6)]">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-[var(--font-size-xs)] text-[var(--color-earth-500)]">Order</p>
              <p className="font-mono font-bold text-[var(--color-earth-900)]">
                #{order.order_number}
              </p>
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

          {/* Items */}
          <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-earth-200)] shadow-[var(--shadow-card)] overflow-hidden">
            <table className="w-full text-[var(--font-size-sm)]">
              <thead className="bg-[var(--color-earth-50)] border-b border-[var(--color-earth-100)]">
                <tr>
                  <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)]">
                    Item
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
                    colSpan={2}
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

          {/* Reviews — only once the order is delivered */}
          {order.status === 'delivered' && (
            <div>
              <h2 className="heading-5 mb-[var(--spacing-2)]">Review your purchase</h2>
              <p className="body-small text-[var(--color-earth-500)] mb-[var(--spacing-4)]">
                Your order has been delivered. Tell others what you think.
              </p>
              <div className="flex flex-col gap-[var(--spacing-4)]">
                {order.order_items.flatMap((item) => {
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
                      phone={lookupPhone}
                      defaultName={order.customer_name}
                    />,
                  ];
                })}
              </div>
            </div>
          )}

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
      )}
    </div>
  );
}
