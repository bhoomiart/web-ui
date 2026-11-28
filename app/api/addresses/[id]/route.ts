/**
 * /api/addresses/[id]
 *
 *   PATCH   edit an address (all fields), or { is_default: true } alone to make it the default
 *   DELETE  remove an address (the next most recent one becomes the default)
 *
 * Past orders keep their own copy of the address, so neither action changes them.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerApi } from '@/lib/auth/customer';
import { createClient } from '@/lib/supabase/server';
import { ADDRESS_COLUMNS, parseAddress, type AddressInput } from '@/lib/addresses';

type Params = { params: Promise<{ id: string }> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(request: NextRequest, { params }: Params) {
  const customer = await requireCustomerApi();
  if (customer instanceof NextResponse) return customer;

  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: 'Address not found.' }, { status: 404 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  const update: Partial<AddressInput> & { is_default?: boolean } = {};
  const onlyDefault = Object.keys(body).length === 1 && body.is_default === true;
  if (!onlyDefault) {
    const parsed = parseAddress(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error, field: parsed.field }, { status: 400 });
    }
    Object.assign(update, parsed.value);
  }
  if (body.is_default === true) update.is_default = true;
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('customer_addresses')
    .update(update)
    .eq('id', id)
    .select(ADDRESS_COLUMNS)
    .maybeSingle();
  if (error) return NextResponse.json({ error: 'Could not update the address.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Address not found.' }, { status: 404 });
  return NextResponse.json({ address: data });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const customer = await requireCustomerApi();
  if (customer instanceof NextResponse) return customer;

  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: 'Address not found.' }, { status: 404 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('customer_addresses')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (error) return NextResponse.json({ error: 'Could not delete the address.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Address not found.' }, { status: 404 });
  return NextResponse.json({ success: true });
}
