/**
 * PATCH /api/admin/orders/[id]/status
 *
 * Update order status with optional notes.
 * Body: { status: order_status_enum, notes?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireStaffApi } from '@/lib/api/auth';
import { updateOrderStatus } from '@/lib/db/orders';
import { releaseStock } from '@/lib/db/inventory';

type Params = { params: Promise<{ id: string }> };

// Valid forward transitions per current status (simplified business rules)
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['customization_in_progress', 'ready_for_dispatch', 'cancelled'],
  customization_in_progress: ['ready_for_dispatch', 'cancelled'],
  ready_for_dispatch: ['shipped'],
  shipped: ['delivered'],
  delivered: ['return_requested'],
  cancellation_requested: ['cancelled', 'confirmed'],
  return_requested: ['return_approved', 'return_rejected'],
  return_approved: ['return_in_transit'],
  return_in_transit: ['returned'],
  returned: ['refund_requested', 'refund_approved'],
  refund_requested: ['refund_under_review'],
  refund_under_review: ['refund_approved', 'refund_rejected'],
  refund_approved: ['refund_processing'],
  refund_processing: ['refunded', 'partially_refunded'],
};

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireStaffApi(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = (await request.json()) as { status?: string; notes?: string };

  if (!body.status) {
    return NextResponse.json({ error: 'status is required.' }, { status: 400 });
  }

  // Fetch current order status
  const { createAdminClient } = await import('@/lib/supabase/admin');
  const admin = createAdminClient();
  const { data: order, error: fetchErr } = await admin
    .from('orders')
    .select('status')
    .eq('id', id)
    .single();

  if (fetchErr || !order) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }

  // Validate transition
  const allowed = VALID_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(body.status)) {
    return NextResponse.json(
      {
        error: `Cannot transition from '${order.status}' to '${body.status}'. Allowed: ${allowed.join(', ') || 'none'}.`,
      },
      { status: 422 }
    );
  }

  try {
    await updateOrderStatus({
      orderId: id,
      newStatus: body.status,
      actorId: auth.user.id,
      notes: body.notes,
    });

    // Release stock when order is cancelled
    if (body.status === 'cancelled') {
      await releaseStock(id, 'order_cancelled');
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
