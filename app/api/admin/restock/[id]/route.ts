/**
 * PATCH /api/admin/restock/[id]
 *
 * Update a restock subscription status.
 * Body: { status: 'active' | 'notified' | 'unsubscribed' }
 *
 * Staff or admin access required.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireStaffApi } from '@/lib/api/auth';
import { updateSubscriptionStatus } from '@/lib/db/restock';

type Params = { params: Promise<{ id: string }> };

const VALID_STATUSES = ['active', 'notified', 'unsubscribed'] as const;

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireStaffApi(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Subscription ID required.' }, { status: 400 });

  const body = (await request.json()) as Record<string, unknown>;
  const status = body.status as string | undefined;

  if (!status || !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID_STATUSES.join(', ')}.` },
      { status: 400 }
    );
  }

  try {
    await updateSubscriptionStatus(id, status as 'active' | 'notified' | 'unsubscribed');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
