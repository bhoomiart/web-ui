export function ReturnStatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string }> = {
    pending: { color: 'var(--color-warning)', bg: 'var(--color-warning-light)' },
    approved: { color: 'var(--color-info)', bg: 'var(--color-info-light)' },
    rejected: { color: 'var(--color-error)', bg: 'var(--color-error-light)' },
    in_transit: { color: 'var(--color-info)', bg: 'var(--color-info-light)' },
    completed: { color: 'var(--color-success)', bg: 'var(--color-success-light)' },
    cancelled: { color: 'var(--color-earth-500)', bg: 'var(--color-earth-100)' },
  };
  const cfg = map[status] ?? { color: 'var(--color-earth-500)', bg: 'var(--color-earth-100)' };
  return (
    <span
      className="inline-flex items-center px-[var(--spacing-2)] py-0.5 rounded-[var(--radius-full)] text-[var(--font-size-xs)] font-semibold capitalize"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}
