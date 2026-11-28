/**
 * PATCH /api/admin/shipping-rates
 * Body: { rates: [{ state, fee, freeAbove, isActive }] }
 *
 * Updates existing rows only (states are seeded, never created here).
 * The '*' row is the fallback for states without an active rate and cannot be
 * deactivated. Admin only. Audit-logged.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/api/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { SHIPPING_FALLBACK_STATE } from '@/lib/cart/constants';

const MAX_AMOUNT = 100_000;
const MAX_ROWS = 60;

interface RateInput {
  state: string;
  fee: number;
  freeAbove: number | null;
  isActive: boolean;
}

function validAmount(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= MAX_AMOUNT;
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (auth instanceof NextResponse) return auth;

  let body: { rates?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  if (!Array.isArray(body.rates) || body.rates.length === 0 || body.rates.length > MAX_ROWS) {
    return NextResponse.json({ error: 'Provide between 1 and 60 rates.' }, { status: 400 });
  }

  const rates: RateInput[] = [];
  for (const raw of body.rates as Array<Record<string, unknown>>) {
    if (typeof raw?.state !== 'string' || raw.state.length === 0) {
      return NextResponse.json({ error: 'Each rate needs a state.' }, { status: 400 });
    }
    if (!validAmount(raw.fee)) {
      return NextResponse.json(
        { error: `Fee for ${raw.state} must be between 0 and ${MAX_AMOUNT}.` },
        { status: 400 }
      );
    }
    if (raw.freeAbove != null && !validAmount(raw.freeAbove)) {
      return NextResponse.json(
        { error: `Free-shipping threshold for ${raw.state} must be between 0 and ${MAX_AMOUNT}.` },
        { status: 400 }
      );
    }
    if (typeof raw.isActive !== 'boolean') {
      return NextResponse.json({ error: `Invalid status for ${raw.state}.` }, { status: 400 });
    }
    if (raw.state === SHIPPING_FALLBACK_STATE && !raw.isActive) {
      return NextResponse.json(
        { error: 'The default rate cannot be turned off.' },
        { status: 400 }
      );
    }
    rates.push({
      state: raw.state,
      fee: raw.fee,
      freeAbove: (raw.freeAbove as number | null | undefined) ?? null,
      isActive: raw.isActive,
    });
  }

  const admin = createAdminClient();

  const { data: known, error: readError } = await admin.from('shipping_rates').select('state');
  if (readError) return NextResponse.json({ error: 'Could not read rates.' }, { status: 500 });

  const knownStates = new Set((known ?? []).map((r) => r.state));
  const unknown = rates.find((r) => !knownStates.has(r.state));
  if (unknown) {
    return NextResponse.json({ error: `Unknown state: ${unknown.state}` }, { status: 400 });
  }

  const { error } = await admin.from('shipping_rates').upsert(
    rates.map((r) => ({
      state: r.state,
      fee: r.fee,
      free_above: r.freeAbove,
      is_active: r.isActive,
    })),
    { onConflict: 'state' }
  );
  if (error) return NextResponse.json({ error: 'Could not save rates.' }, { status: 500 });

  await admin.from('audit_logs').insert({
    actor_id: auth.user.id,
    action: 'shipping_rates.update',
    table_name: 'shipping_rates',
    diff: { updated: rates.map((r) => r.state), count: rates.length } as never,
  });

  return NextResponse.json({ success: true, updated: rates.length });
}
