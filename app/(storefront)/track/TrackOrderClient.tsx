'use client';
/**
 * TrackOrderClient
 *
 * Signed in: shows the customer's order history straight away (no phone or order
 * number needed), with a return option on delivered orders.
 * Signed out: asks the customer to sign in, and keeps the phone + order number
 * lookup for orders placed as a guest.
 */
import React from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { useAuthModalStore } from '@/lib/store/authModalStore';
import { OrderView, STATUS_LABELS, fmt, formatDate, type OrderData } from './OrderView';

type HistoryOrder = OrderData & {
  reviewedProductIds: string[];
};

export function TrackOrderClient({
  searchParams: _spPromise, // eslint-disable-line @typescript-eslint/no-unused-vars
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = useSearchParams();
  const prefillOrder = sp.get('order') ?? '';
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const authReady = useAuthStore((s) => s.ready);
  const openAuth = useAuthModalStore((s) => s.open);

  // Order history (signed in)
  const [history, setHistory] = React.useState<HistoryOrder[] | null>(null);
  const [historyState, setHistoryState] = React.useState<'loading' | 'ok' | 'guest' | 'error'>(
    'loading'
  );
  const [openOrder, setOpenOrder] = React.useState<string | null>(prefillOrder || null);

  const [reloadKey, setReloadKey] = React.useState(0);
  const loadHistory = React.useCallback(() => setReloadKey((k) => k + 1), []);

  React.useEffect(() => {
    if (!authReady) return;
    let cancelled = false;
    fetch('/api/my-orders', { cache: 'no-store' })
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 401) {
          setHistory(null);
          setHistoryState('guest');
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error();
        setHistory(data.orders as HistoryOrder[]);
        setHistoryState('ok');
      })
      .catch(() => {
        if (!cancelled) setHistoryState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [authReady, userId, reloadKey]);

  // Guest lookup
  const [orderNum, setOrderNum] = React.useState(prefillOrder);
  const [phone, setPhone] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [order, setOrder] = React.useState<OrderData | null>(null);
  const [reviewed, setReviewed] = React.useState<string[]>([]);
  const [lookupPhone, setLookupPhone] = React.useState('');

  async function refreshGuestOrder() {
    try {
      const res = await fetch(
        `/api/track?phone=${encodeURIComponent(lookupPhone)}&order=${encodeURIComponent(order?.order_number ?? '')}`
      );
      const data = await res.json();
      if (res.ok && data.order) {
        setOrder(data.order as OrderData);
        setReviewed((data.reviewedProductIds as string[] | undefined) ?? []);
      }
    } catch {
      /* the page keeps showing the previous state */
    }
  }

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
      setReviewed((data.reviewedProductIds as string[] | undefined) ?? []);
      setLookupPhone(phone.trim());
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full px-[var(--spacing-4)] py-[var(--spacing-2-5)] rounded-[var(--radius-input)] border border-[var(--color-earth-200)] bg-white text-[var(--font-size-base)] text-[var(--color-earth-900)] placeholder:text-[var(--color-earth-400)] focus:outline-none focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-brand-primary)]/20';

  if (historyState === 'loading') {
    return (
      <p className="body-base text-[var(--color-earth-600)]" role="status">
        Loading your orders…
      </p>
    );
  }

  if (historyState === 'error') {
    return (
      <div role="alert" className="text-[var(--color-error)]">
        Could not load your orders.{' '}
        <button type="button" className="underline" onClick={() => loadHistory()}>
          Try again
        </button>
      </div>
    );
  }

  if (historyState === 'ok' && history) {
    if (history.length === 0) {
      return (
        <p className="body-base text-[var(--color-earth-600)]">
          You have not placed any orders yet.
        </p>
      );
    }
    return (
      <ul className="flex flex-col gap-[var(--spacing-4)]">
        {history.map((o) => {
          const isOpen = openOrder === o.order_number;
          const total = o.order_items.reduce((s, i) => s + i.item_total, 0);
          return (
            <li
              key={o.id}
              className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-earth-200)] shadow-[var(--shadow-card)]"
            >
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenOrder(isOpen ? null : o.order_number)}
                className="w-full text-left p-[var(--spacing-4)] flex items-center justify-between gap-[var(--spacing-3)] flex-wrap"
              >
                <span>
                  <span className="block font-mono font-bold text-[var(--color-earth-900)]">
                    #{o.order_number}
                  </span>
                  <span className="block text-[var(--font-size-xs)] text-[var(--color-earth-500)]">
                    {formatDate(o.created_at)} · {fmt(total)}
                  </span>
                </span>
                <span className="text-[var(--font-size-xs)] font-semibold text-[var(--color-info)]">
                  {STATUS_LABELS[o.status] ?? o.status.replace(/_/g, ' ')}
                </span>
              </button>
              {isOpen && (
                <div className="p-[var(--spacing-4)] border-t border-[var(--color-earth-100)]">
                  <OrderView
                    order={o}
                    phone={o.phone ?? ''}
                    reviewedProductIds={o.reviewedProductIds}
                    signedIn
                    onReturned={() => loadHistory()}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  }

  // Signed out
  return (
    <div>
      <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-earth-200)] shadow-[var(--shadow-card)] p-[var(--spacing-6)] mb-[var(--spacing-8)] text-center">
        <p className="font-semibold text-[var(--color-earth-800)] mb-[var(--spacing-3)]">
          Sign in to see all your orders
        </p>
        <button
          type="button"
          onClick={() => openAuth({ reason: 'Sign in to see your orders' })}
          className="px-[var(--spacing-6)] h-11 rounded-[var(--radius-button)] bg-[var(--color-brand-primary)] text-white font-bold hover:bg-[var(--color-earth-700)] transition-colors"
        >
          Sign in
        </button>
      </div>
      <p className="body-small text-[var(--color-earth-600)] mb-[var(--spacing-3)]">
        Placed an order without an account? Look it up with your phone number and order number.
      </p>
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
        <OrderView
          order={order}
          phone={lookupPhone}
          reviewedProductIds={reviewed}
          signedIn={false}
          onReturned={() => void refreshGuestOrder()}
        />
      )}
    </div>
  );
}
