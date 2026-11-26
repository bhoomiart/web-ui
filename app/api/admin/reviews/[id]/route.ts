/**
 * PATCH /api/admin/reviews/[id]
 *
 * Moderate a review: approve, reject, or hide.
 * Optionally add an admin response.
 *
 * Body: { status: 'approved'|'rejected'|'hidden', admin_response?: string }
 *
 * Staff or admin access required.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireStaffApi } from '@/lib/api/auth';
import { moderateReview } from '@/lib/db/reviews';
import { createAdminClient } from '@/lib/supabase/admin';

type Params = { params: Promise<{ id: string }> };

const VALID_STATUSES = ['approved', 'rejected', 'hidden'] as const;

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireStaffApi(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;

  const status = body.status as string | undefined;
  if (!status || !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID_STATUSES.join(', ')}.` },
      { status: 400 }
    );
  }

  const adminResponse = (body.admin_response as string | undefined)?.trim() || undefined;

  try {
    await moderateReview(id, status as 'approved' | 'rejected' | 'hidden', adminResponse);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  // Audit log
  const admin = createAdminClient();
  await admin.from('audit_logs').insert({
    actor_id: auth.user.id,
    action: `review.${status}`,
    table_name: 'product_reviews',
    record_id: id,
  });

  return NextResponse.json({ success: true });
}
