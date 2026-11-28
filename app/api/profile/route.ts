/**
 * /api/profile
 *
 *   GET    the signed-in customer's name, phone and email
 *   PATCH  change name and phone     Body: { full_name, phone }
 *
 * Writes use the service role but are limited to the signed-in customer's own row
 * and to these two columns, so a customer can never touch `role`.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerApi } from '@/lib/auth/customer';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const customer = await requireCustomerApi();
  if (customer instanceof NextResponse) return customer;

  const { data } = await createAdminClient()
    .from('profiles')
    .select('full_name, phone')
    .eq('id', customer.id)
    .maybeSingle();

  return NextResponse.json({
    profile: {
      email: customer.email,
      full_name: data?.full_name ?? '',
      phone: data?.phone ?? customer.phone ?? '',
    },
  });
}

export async function PATCH(request: NextRequest) {
  const customer = await requireCustomerApi();
  if (customer instanceof NextResponse) return customer;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  const fullName = typeof body.full_name === 'string' ? body.full_name.trim().slice(0, 120) : '';
  const phone =
    typeof body.phone === 'string' ? body.phone.trim().replace(/\s/g, '').slice(0, 20) : '';

  if (!fullName) {
    return NextResponse.json(
      { error: 'Full name is required.', field: 'full_name' },
      { status: 400 }
    );
  }
  if (phone && !/^\+?[0-9]{10,15}$/.test(phone)) {
    return NextResponse.json(
      { error: 'Enter a valid phone number (10 to 15 digits).', field: 'phone' },
      { status: 400 }
    );
  }

  const { error } = await createAdminClient()
    .from('profiles')
    .update({ full_name: fullName, phone: phone || null })
    .eq('id', customer.id);
  if (error) return NextResponse.json({ error: 'Could not save your details.' }, { status: 500 });

  return NextResponse.json({ profile: { email: customer.email, full_name: fullName, phone } });
}
