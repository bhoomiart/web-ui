/**
 * /api/addresses
 *
 *   GET   the signed-in customer's saved addresses (default first)
 *   POST  save a new address     Body: address fields, optional is_default
 *
 * Runs as the customer (not the service role), so row-level security guarantees
 * nobody can read or write another customer's addresses.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerApi } from '@/lib/auth/customer';
import { createClient } from '@/lib/supabase/server';
import { ADDRESS_COLUMNS, parseAddress } from '@/lib/addresses';

export async function GET() {
  const customer = await requireCustomerApi();
  if (customer instanceof NextResponse) return customer;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('customer_addresses')
    .select(ADDRESS_COLUMNS)
    .order('is_default', { ascending: false })
    .order('updated_at', { ascending: false });
  if (error) {
    return NextResponse.json({ error: 'Could not load your addresses.' }, { status: 500 });
  }
  return NextResponse.json({ addresses: data ?? [] });
}

export async function POST(request: NextRequest) {
  const customer = await requireCustomerApi();
  if (customer instanceof NextResponse) return customer;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  const parsed = parseAddress(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error, field: parsed.field }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('customer_addresses')
    .insert({ ...parsed.value, user_id: customer.id, is_default: body.is_default === true })
    .select(ADDRESS_COLUMNS)
    .single();
  if (error) {
    if (error.message.includes('ADDRESS_LIMIT')) {
      return NextResponse.json(
        { error: 'You can save up to 10 addresses. Delete one to add another.' },
        { status: 422 }
      );
    }
    return NextResponse.json({ error: 'Could not save the address.' }, { status: 500 });
  }
  return NextResponse.json({ address: data }, { status: 201 });
}
