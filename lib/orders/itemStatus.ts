/**
 * Order line statuses and the moves admin can make by hand.
 *
 * Safe to import from client and server. Return and refund statuses are NOT here:
 * they change through the returns and refunds screens so the return/refund records
 * and the line status can never disagree.
 */

export const ITEM_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['customization_in_progress', 'ready_for_dispatch', 'cancelled'],
  customization_in_progress: ['ready_for_dispatch', 'cancelled'],
  ready_for_dispatch: ['shipped'],
  shipped: ['delivered'],
  cancellation_requested: ['cancelled', 'confirmed'],
};

export const ITEM_ACTION_LABELS: Record<string, string> = {
  confirmed: 'Confirm',
  processing: 'Mark processing',
  customization_in_progress: 'Mark customizing',
  ready_for_dispatch: 'Ready for dispatch',
  shipped: 'Mark shipped',
  delivered: 'Mark delivered',
  cancelled: 'Cancel',
};

export function nextStatuses(status: string): string[] {
  return ITEM_TRANSITIONS[status] ?? [];
}

/** Statuses that belong to the returns / refunds screens. */
export function isReturnOrRefundStatus(status: string): boolean {
  return (
    status.startsWith('return') ||
    status === 'returned' ||
    status.startsWith('refund') ||
    status === 'partially_refunded' ||
    status === 'refunded'
  );
}
