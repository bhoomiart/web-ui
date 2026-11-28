export const instant = false;
import { Suspense } from 'react';
import { Spinner } from '@/components/ui/Spinner';
/**
 * /admin/orders/[id] — Order detail page.
 * Shows customer info, items, status history timeline.
 */

import Link from 'next/link';
import Image from 'next/image';
import { requireStaff } from '@/lib/auth/admin';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';
import { OrderActionsPanel } from '@/components/admin/OrderActionsPanel';
import { OrderItemStatusControl } from '@/components/admin/OrderItemStatusControl';
import { getOrderById } from '@/lib/db/orders';
import type { Json } from '@/lib/types/database';

type SnapshotJson = { name?: string; sku?: string | null; image_url?: string | null };

function parseSnapshot(raw: Json): SnapshotJson {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as SnapshotJson;
  }
  return {};
}

function paymentBadge(status: string) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'Pending', color: 'var(--color-warning)', bg: 'var(--color-warning-light)' },
    received: {
      label: 'Received',
      color: 'var(--color-success)',
      bg: 'var(--color-success-light)',
    },
    failed: { label: 'Failed', color: 'var(--color-error)', bg: 'var(--color-error-light)' },
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

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Spinner size="lg" label="Loading..." />
        </div>
      }
    >
      <OrderDetailPageContent params={params} />
    </Suspense>
  );
}

async function OrderDetailPageContent({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();

  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) {
    return (
      <div>
        <AdminPageHeader
          title="Order Not Found"
          breadcrumbs={[
            { label: 'Dashboard', href: '/admin/dashboard' },
            { label: 'Orders', href: '/admin/orders' },
            { label: 'Not Found' },
          ]}
        />
        <div className="flex flex-col items-center justify-center py-16 text-[var(--color-earth-400)]">
          <svg
            className="w-12 h-12 mb-4 opacity-40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"
            />
          </svg>
          <p className="text-[var(--font-size-base)] font-semibold text-[var(--color-earth-600)] mb-2">
            Order not found
          </p>
          <p className="text-[var(--font-size-sm)] mb-6">
            The order you&apos;re looking for doesn&apos;t exist or was removed.
          </p>
          <Link
            href="/admin/orders"
            className="text-[var(--font-size-sm)] font-semibold text-[var(--color-brand-primary)] hover:underline"
          >
            ← Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const items =
    (order.order_items as Array<{
      id: string;
      quantity: number;
      unit_price: number;
      item_total: number;
      snapshot: Json;
      status: string;
    }>) ?? [];

  const history =
    (order.order_status_history as Array<{
      id: string;
      order_item_id: string | null;
      previous_status: string | null;
      new_status: string;
      notes: string | null;
      actor_id: string | null;
      created_at: string;
    }>) ?? [];

  const orderTotal = items.reduce((sum, item) => sum + item.item_total, 0);

  return (
    <div>
      <AdminPageHeader
        title={`Order #${order.order_number}`}
        description={`Placed on ${new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Orders', href: '/admin/orders' },
          { label: `#${order.order_number}` },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[var(--spacing-6)]">
        {/* ── Left column: items + history ── */}
        <div className="lg:col-span-2 flex flex-col gap-[var(--spacing-6)]">
          {/* Order items */}
          <section>
            <h2 className="heading-5 mb-[var(--spacing-3)]">Items</h2>
            <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] overflow-hidden">
              <table className="w-full text-[var(--font-size-sm)]">
                <thead className="bg-[var(--color-earth-50)] border-b border-[var(--color-earth-100)]">
                  <tr>
                    <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)]">
                      Product
                    </th>
                    <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)]">
                      Status
                    </th>
                    <th className="text-right px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)]">
                      Qty
                    </th>
                    <th className="text-right px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)]">
                      Unit
                    </th>
                    <th className="text-right px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)]">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-earth-100)]">
                  {items.map((item) => {
                    const snap = parseSnapshot(item.snapshot);
                    return (
                      <tr key={item.id}>
                        <td className="px-[var(--spacing-4)] py-[var(--spacing-3)]">
                          <div className="flex items-center gap-[var(--spacing-3)]">
                            {snap.image_url ? (
                              <Image
                                src={snap.image_url}
                                alt={snap.name ?? 'Product'}
                                width={40}
                                height={40}
                                className="w-10 h-10 object-cover rounded-[var(--radius-sm)] shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-[var(--color-earth-100)] shrink-0" />
                            )}
                            <div>
                              <p className="font-semibold text-[var(--color-earth-900)]">
                                {snap.name ?? '—'}
                              </p>
                              {snap.sku && (
                                <p className="text-[var(--font-size-xs)] text-[var(--color-earth-400)]">
                                  SKU: {snap.sku}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-[var(--spacing-4)] py-[var(--spacing-3)]">
                          <OrderItemStatusControl
                            orderId={order.id}
                            itemId={item.id}
                            status={item.status}
                          />
                        </td>
                        <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-right text-[var(--color-earth-700)]">
                          {item.quantity}
                        </td>
                        <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-right text-[var(--color-earth-700)]">
                          ₹{item.unit_price.toLocaleString('en-IN')}
                        </td>
                        <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-right font-semibold text-[var(--color-earth-900)]">
                          ₹{item.item_total.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t border-[var(--color-earth-200)] bg-[var(--color-earth-50)]">
                  <tr>
                    <td
                      colSpan={4}
                      className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-right font-semibold text-[var(--color-earth-700)]"
                    >
                      Order Total
                    </td>
                    <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-right font-bold text-[var(--color-earth-900)]">
                      ₹{orderTotal.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          {/* Status history timeline */}
          <section>
            <h2 className="heading-5 mb-[var(--spacing-3)]">Status History</h2>
            <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-[var(--spacing-5)]">
              {history.length === 0 ? (
                <p className="text-[var(--font-size-sm)] text-[var(--color-earth-400)]">
                  No status history available.
                </p>
              ) : (
                <ol className="relative border-l-2 border-[var(--color-earth-100)] ml-2 flex flex-col gap-[var(--spacing-5)]">
                  {[...history].reverse().map((entry, i) => (
                    <li key={entry.id} className="pl-[var(--spacing-5)] relative">
                      {/* Timeline dot */}
                      <span
                        className="absolute -left-[0.4375rem] top-1 w-3.5 h-3.5 rounded-full border-2 border-white"
                        style={{
                          background:
                            i === 0 ? 'var(--color-brand-primary)' : 'var(--color-earth-200)',
                        }}
                      />
                      <div className="flex flex-wrap items-center gap-[var(--spacing-2)] mb-1">
                        {entry.order_item_id && (
                          <span className="text-[var(--font-size-xs)] font-semibold text-[var(--color-earth-700)]">
                            {parseSnapshot(
                              items.find((i) => i.id === entry.order_item_id)?.snapshot ?? null
                            ).name ?? 'Item'}
                            :
                          </span>
                        )}
                        <OrderStatusBadge status={entry.new_status} />
                        {entry.previous_status && (
                          <span className="text-[var(--font-size-xs)] text-[var(--color-earth-400)]">
                            from{' '}
                            <span className="font-medium">
                              {entry.previous_status.replace(/_/g, ' ')}
                            </span>
                          </span>
                        )}
                      </div>
                      {entry.notes && (
                        <p className="text-[var(--font-size-xs)] text-[var(--color-earth-500)] mb-1">
                          {entry.notes}
                        </p>
                      )}
                      <p className="text-[var(--font-size-xs)] text-[var(--color-earth-400)]">
                        {new Date(entry.created_at).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </section>
        </div>

        {/* ── Right column: customer info + actions ── */}
        <div className="flex flex-col gap-[var(--spacing-6)]">
          {/* Status + payment — actions panel */}
          <OrderActionsPanel
            orderId={order.id}
            currentStatus={order.status}
            currentPaymentStatus={order.payment_status}
            customerName={order.customer_name}
            phone={order.phone}
            orderNumber={order.order_number}
            itemStatuses={items.map((i) => i.status)}
          />

          {/* Customer info */}
          <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-[var(--spacing-5)]">
            <h3 className="heading-6 mb-[var(--spacing-4)]">Customer</h3>
            <dl className="flex flex-col gap-[var(--spacing-2)] text-[var(--font-size-sm)]">
              <div>
                <dt className="text-[var(--font-size-xs)] text-[var(--color-earth-400)] mb-0.5">
                  Name
                </dt>
                <dd className="font-semibold text-[var(--color-earth-900)]">
                  {order.customer_name}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--font-size-xs)] text-[var(--color-earth-400)] mb-0.5">
                  Phone
                </dt>
                <dd className="text-[var(--color-earth-700)]">{order.phone}</dd>
              </div>
              {order.email && (
                <div>
                  <dt className="text-[var(--font-size-xs)] text-[var(--color-earth-400)] mb-0.5">
                    Email
                  </dt>
                  <dd className="text-[var(--color-earth-700)] break-all">{order.email}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Shipping address */}
          {(order.address_line1 || order.city) && (
            <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-[var(--spacing-5)]">
              <h3 className="heading-6 mb-[var(--spacing-3)]">Shipping Address</h3>
              <address className="text-[var(--font-size-sm)] text-[var(--color-earth-700)] not-italic leading-relaxed">
                {order.address_line1 && <p>{order.address_line1}</p>}
                {order.address_line2 && <p>{order.address_line2}</p>}
                {(order.city || order.state) && (
                  <p>{[order.city, order.state].filter(Boolean).join(', ')}</p>
                )}
                {order.postal_code && <p>{order.postal_code}</p>}
                <p>{order.country}</p>
              </address>
            </div>
          )}

          {/* Notes */}
          {(order.notes || order.customization) && (
            <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-[var(--spacing-5)]">
              <h3 className="heading-6 mb-[var(--spacing-3)]">Notes</h3>
              {order.notes && (
                <div className="mb-[var(--spacing-3)]">
                  <p className="text-[var(--font-size-xs)] text-[var(--color-earth-400)] mb-1">
                    Customer note
                  </p>
                  <p className="text-[var(--font-size-sm)] text-[var(--color-earth-700)]">
                    {order.notes}
                  </p>
                </div>
              )}
              {order.customization && (
                <div>
                  <p className="text-[var(--font-size-xs)] text-[var(--color-earth-400)] mb-1">
                    Customization
                  </p>
                  <p className="text-[var(--font-size-sm)] text-[var(--color-earth-700)]">
                    {order.customization}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
