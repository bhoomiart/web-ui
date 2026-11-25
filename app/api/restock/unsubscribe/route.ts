/**
 * POST /api/restock/unsubscribe
 *
 * Customer-facing endpoint to unsubscribe from restock notifications.
 * No auth required — subscription ID is the opaque unsubscribe token.
 *
 * Body: { subscription_id: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { unsubscribeFromRestock } from '@/lib/db/restock';

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Record<string, unknown>;
  const id = (body.subscription_id as string | undefined)?.trim();

  if (!id) {
    return NextResponse.json({ error: 'subscription_id is required.' }, { status: 400 });
  }

  try {
    await unsubscribeFromRestock(id);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ message: 'You have been unsubscribed.' });
}
