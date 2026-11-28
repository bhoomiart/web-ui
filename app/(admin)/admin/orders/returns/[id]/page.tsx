export const instant = false;
/**
 * /admin/orders/returns/[id] — One return request: customer, items, reason,
 * customer photos at full size, and the actions to move it along.
 */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireStaff } from '@/lib/auth/admin';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';
import { ReturnActions } from '@/components/admin/ReturnActions';
import { ReturnStatusBadge } from '@/components/admin/ReturnStatusBadge';
import { getReturnRequestById } from '@/lib/db/orders';
import { signPhotoPaths } from '@/lib/uploads';

type Snap = { name?: string; variant_name?: string | null };

export default async function ReturnDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const ret = await getReturnRequestById(id);
  if (!ret) notFound();

  const order = ret.orders as {
    id: string;
    order_number: string;
    customer_name: string;
    phone: string;
    email: string | null;
  } | null;
  const items = ret.return_request_items as unknown as Array<{
    id: string;
    quantity: number;
    order_items: { id: string; snapshot: Snap } | null;
  }>;
  const photos = await signPhotoPaths(ret.photos);

  const card =
    'bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-[var(--spacing-5)]';
  const label = 'text-[var(--font-size-xs)] text-[var(--color-earth-400)] mb-1';

  return (
    <div>
      <AdminPageHeader
        title={`Return request${order ? ` · #${order.order_number}` : ''}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Returns', href: '/admin/orders/returns' },
          { label: order ? `#${order.order_number}` : 'Return' },
        ]}
      />
      <div className="flex flex-col gap-[var(--spacing-5)] max-w-4xl">
        <div
          className={`${card} flex flex-wrap items-center justify-between gap-[var(--spacing-3)]`}
        >
          <div className="flex items-center gap-[var(--spacing-3)]">
            <ReturnStatusBadge status={ret.status} />
            <span className="text-[var(--font-size-xs)] text-[var(--color-earth-500)]">
              Requested{' '}
              {new Date(ret.created_at).toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <div className="flex items-center gap-[var(--spacing-3)]">
            <ReturnActions returnId={ret.id} status={ret.status} />
            {order && (
              <Link
                href={`/admin/orders/${order.id}`}
                className="text-[var(--font-size-sm)] font-semibold text-[var(--color-brand-primary)] hover:underline"
              >
                View order
              </Link>
            )}
          </div>
        </div>

        <div className={`${card} grid grid-cols-1 sm:grid-cols-2 gap-[var(--spacing-4)]`}>
          <div>
            <p className={label}>Customer</p>
            <p className="text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-900)]">
              {order?.customer_name ?? '—'}
            </p>
            <p className="text-[var(--font-size-sm)] text-[var(--color-earth-600)]">
              {order?.phone}
              {order?.email ? ` · ${order.email}` : ''}
            </p>
          </div>
          <div>
            <p className={label}>Reason</p>
            <p className="text-[var(--font-size-sm)] capitalize text-[var(--color-earth-800)]">
              {ret.reason.replace(/_/g, ' ')}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className={label}>Items to return</p>
            {items.map((ri) => (
              <p key={ri.id} className="text-[var(--font-size-sm)] text-[var(--color-earth-800)]">
                {ri.order_items?.snapshot?.name ?? 'Item'}
                {ri.order_items?.snapshot?.variant_name
                  ? ` (${ri.order_items.snapshot.variant_name})`
                  : ''}{' '}
                × {ri.quantity}
              </p>
            ))}
          </div>
          {ret.description && (
            <div className="sm:col-span-2">
              <p className={label}>Customer’s details</p>
              <p className="text-[var(--font-size-sm)] text-[var(--color-earth-800)] whitespace-pre-wrap">
                {ret.description}
              </p>
            </div>
          )}
          {ret.admin_notes && (
            <div className="sm:col-span-2">
              <p className={label}>Staff notes</p>
              <p className="text-[var(--font-size-sm)] text-[var(--color-earth-800)] whitespace-pre-wrap">
                {ret.admin_notes}
              </p>
            </div>
          )}
        </div>

        <div className={card}>
          <h2 className="heading-6 mb-[var(--spacing-3)]">Customer photos</h2>
          {photos.length === 0 ? (
            <p className="text-[var(--font-size-sm)] text-[var(--color-earth-500)]">
              The customer did not attach any photos.
            </p>
          ) : (
            <ul className="grid grid-cols-2 md:grid-cols-3 gap-[var(--spacing-3)]">
              {photos.map((url, i) => (
                <li key={url}>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Return photo ${i + 1}`}
                      className="w-full aspect-square object-cover rounded-[var(--radius-md)] border border-[var(--color-earth-200)]"
                    />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
