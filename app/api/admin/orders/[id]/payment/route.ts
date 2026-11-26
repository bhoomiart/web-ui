/**
 * PATCH /api/admin/orders/[id]/payment
 *
 * Record payment status manually.
 * Body: { payment_status: 'pending'|'received'|'failed', payment_notes?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireStaffApi } from '@/lib/api/auth';
import { updatePaymentStatus } from '@/lib/db/orders';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireStaffApi(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = (await request.json()) as {
    payment_status?: 'pending' | 'received' | 'failed';
    payment_notes?: string;
  };

  if (!body.payment_status || !['pending', 'received', 'failed'].includes(body.payment_status)) {
    return NextResponse.json(
      { error: 'payment_status must be one of: pending, received, failed.' },
      { status: 400 }
    );
  }

  try {
    await updatePaymentStatus({
      orderId: id,
      paymentStatus: body.payment_status,
      paymentNotes: body.payment_notes,
      actorId: auth.user.id,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
