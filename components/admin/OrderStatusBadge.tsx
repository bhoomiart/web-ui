/**
 * OrderStatusBadge — colored badge for order status values.
 * Server component.
 */

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: 'var(--color-warning)', bg: 'var(--color-warning-light)' },
  confirmed: { label: 'Confirmed', color: 'var(--color-info)', bg: 'var(--color-info-light)' },
  processing: { label: 'Processing', color: 'var(--color-info)', bg: 'var(--color-info-light)' },
  customization_in_progress: {
    label: 'Customizing',
    color: 'var(--color-info)',
    bg: 'var(--color-info-light)',
  },
  ready_for_dispatch: {
    label: 'Ready',
    color: 'var(--color-success)',
    bg: 'var(--color-success-light)',
  },
  shipped: { label: 'Shipped', color: 'var(--color-success)', bg: 'var(--color-success-light)' },
  delivered: {
    label: 'Delivered',
    color: 'var(--color-success)',
    bg: 'var(--color-success-light)',
  },
  cancellation_requested: {
    label: 'Cancel Requested',
    color: 'var(--color-error)',
    bg: 'var(--color-error-light)',
  },
  cancelled: { label: 'Cancelled', color: 'var(--color-error)', bg: 'var(--color-error-light)' },
  return_requested: {
    label: 'Return Requested',
    color: 'var(--color-warning)',
    bg: 'var(--color-warning-light)',
  },
  return_approved: {
    label: 'Return Approved',
    color: 'var(--color-info)',
    bg: 'var(--color-info-light)',
  },
  return_rejected: {
    label: 'Return Rejected',
    color: 'var(--color-error)',
    bg: 'var(--color-error-light)',
  },
  return_in_transit: {
    label: 'In Transit',
    color: 'var(--color-info)',
    bg: 'var(--color-info-light)',
  },
  returned: { label: 'Returned', color: 'var(--color-earth-600)', bg: 'var(--color-earth-100)' },
  refund_requested: {
    label: 'Refund Requested',
    color: 'var(--color-warning)',
    bg: 'var(--color-warning-light)',
  },
  refund_under_review: {
    label: 'Refund Review',
    color: 'var(--color-warning)',
    bg: 'var(--color-warning-light)',
  },
  refund_approved: {
    label: 'Refund Approved',
    color: 'var(--color-success)',
    bg: 'var(--color-success-light)',
  },
  refund_processing: {
    label: 'Refund Processing',
    color: 'var(--color-info)',
    bg: 'var(--color-info-light)',
  },
  partially_refunded: {
    label: 'Partial Refund',
    color: 'var(--color-warning)',
    bg: 'var(--color-warning-light)',
  },
  refunded: { label: 'Refunded', color: 'var(--color-success)', bg: 'var(--color-success-light)' },
  refund_rejected: {
    label: 'Refund Rejected',
    color: 'var(--color-error)',
    bg: 'var(--color-error-light)',
  },
};

interface OrderStatusBadgeProps {
  status: string;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status.replace(/_/g, ' '),
    color: 'var(--color-earth-600)',
    bg: 'var(--color-earth-100)',
  };

  return (
    <span
      className="inline-flex items-center px-[var(--spacing-2)] py-0.5 rounded-[var(--radius-full)] text-[var(--font-size-xs)] font-semibold whitespace-nowrap"
      style={{ color: config.color, background: config.bg }}
    >
      {config.label}
    </span>
  );
}
