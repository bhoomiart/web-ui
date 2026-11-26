/**
 * POST /api/admin/refunds
 *
 * Record a refund for an order.
 * Body: { order_id, return_request_id?, amount, refund_type, method,
 *         reference_id?, processed_at?, notes? }
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/api/auth';
import { createRefund } from '@/lib/db/orders';

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json()) as Record<string, unknown>;

  const orderId = (body.order_id as string | undefined)?.trim();
  if (!orderId) return NextResponse.json({ error: 'order_id is required.' }, { status: 400 });

  const amount = Number(body.amount);
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'amount must be a positive number.' }, { status: 400 });
  }

  const refundType = body.refund_type as string | undefined;
  if (!refundType || !['full', 'partial'].includes(refundType)) {
    return NextResponse.json(
      { error: 'refund_type must be "full" or "partial".' },
      { status: 400 }
    );
  }

  const method = (body.method as string | undefined)?.trim();
  if (!method) return NextResponse.json({ error: 'method is required.' }, { status: 400 });

  try {
    const refund = await createRefund({
      orderId,
      returnRequestId: (body.return_request_id as string | undefined) || undefined,
      amount,
      refundType: refundType as 'full' | 'partial',
      method,
      referenceId: (body.reference_id as string | undefined) || undefined,
      processedAt: (body.processed_at as string | undefined) || undefined,
      notes: (body.notes as string | undefined) || undefined,
      actorId: auth.user.id,
    });

    return NextResponse.json({ refund }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
