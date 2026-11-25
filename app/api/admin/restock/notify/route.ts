/**
 * POST /api/admin/restock/notify
 *
 * Records that a restock notification was dispatched for a subscription.
 * The admin sends the WhatsApp message manually; this endpoint marks it as sent.
 *
 * Body: { subscription_id: string; inventory_id: string }
 *
 * Staff or admin access required.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireStaffApi } from '@/lib/api/auth';
import { markNotificationSent } from '@/lib/db/restock';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const auth = await requireStaffApi(request);
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json()) as Record<string, unknown>;
  const subscriptionId = (body.subscription_id as string | undefined)?.trim();
  const inventoryId = (body.inventory_id as string | undefined)?.trim();

  if (!subscriptionId) {
    return NextResponse.json({ error: 'subscription_id is required.' }, { status: 400 });
  }
  if (!inventoryId) {
    return NextResponse.json({ error: 'inventory_id is required.' }, { status: 400 });
  }

  try {
    await markNotificationSent(subscriptionId, inventoryId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // Audit log
  const admin = createAdminClient();
  await admin.from('audit_logs').insert({
    actor_id: auth.user.id,
    action: 'restock.notify',
    table_name: 'restock_subscriptions',
    record_id: subscriptionId as never,
  });

  return NextResponse.json({ success: true });
}
