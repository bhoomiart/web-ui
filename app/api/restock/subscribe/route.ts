/**
 * POST /api/restock/subscribe
 *
 * Customer-facing endpoint to subscribe for restock notifications.
 * No auth required — anon users can subscribe.
 *
 * Body:
 *   product_id  string  (required)
 *   variant_id  string  (optional)
 *   phone       string  (required when channel is whatsapp or both)
 *   email       string  (optional)
 *   channel     'whatsapp' | 'email' | 'both'  (default: whatsapp)
 */

import { NextRequest, NextResponse } from 'next/server';
import { subscribeToRestock } from '@/lib/db/restock';

const VALID_CHANNELS = ['whatsapp', 'email', 'both'] as const;
type Channel = (typeof VALID_CHANNELS)[number];

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Record<string, unknown>;

  const productId = (body.product_id as string | undefined)?.trim();
  if (!productId) {
    return NextResponse.json({ error: 'product_id is required.' }, { status: 400 });
  }

  const channel = ((body.channel as string | undefined) ?? 'whatsapp') as Channel;
  if (!VALID_CHANNELS.includes(channel)) {
    return NextResponse.json(
      { error: `channel must be one of: ${VALID_CHANNELS.join(', ')}.` },
      { status: 400 }
    );
  }

  const phone = (body.phone as string | undefined)?.trim() || undefined;
  const email = (body.email as string | undefined)?.trim() || undefined;

  if (!phone && !email) {
    return NextResponse.json(
      { error: 'At least one of phone or email is required.' },
      { status: 400 }
    );
  }

  if ((channel === 'whatsapp' || channel === 'both') && !phone) {
    return NextResponse.json(
      { error: 'Phone is required for WhatsApp notifications.' },
      { status: 400 }
    );
  }

  // Basic phone format check (10–15 digits, optionally starting with +)
  if (phone && !/^\+?[0-9]{10,15}$/.test(phone)) {
    return NextResponse.json({ error: 'Invalid phone number format.' }, { status: 400 });
  }

  const variantId = (body.variant_id as string | undefined)?.trim() || undefined;

  try {
    await subscribeToRestock({ productId, variantId, phone, email, channel });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Handle unique constraint violation gracefully
    if (message.includes('unique') || message.includes('duplicate')) {
      return NextResponse.json(
        { message: 'You are already subscribed for notifications on this product.' },
        { status: 200 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json(
    { message: "You're subscribed! We'll notify you when this product is back in stock." },
    { status: 201 }
  );
}
