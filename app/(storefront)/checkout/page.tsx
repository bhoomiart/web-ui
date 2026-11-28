export const instant = false;
/**
 * /checkout — Checkout page (A6-T2, auth gate in A10-T6)
 *
 * Server part: finds out whether a customer is signed in and, if so, loads what
 * we already know about them (their default saved address, else their last order)
 * so the form starts filled in.
 *
 * Signed-out visitors still reach this URL, but see a sign-in prompt instead of
 * the form, with their cart intact. Placing an order is enforced in
 * POST /api/checkout, which rejects anyone who is not signed in.
 */
import type { Metadata } from 'next';
import { getCustomer } from '@/lib/auth/customer';
import { createClient } from '@/lib/supabase/server';
import { ADDRESS_COLUMNS, type SavedAddress } from '@/lib/addresses';
import { CheckoutPageClient, type CheckoutInitial } from './CheckoutPageClient';

export const metadata: Metadata = {
  title: 'Checkout',
  robots: { index: false },
};

export default async function CheckoutPage() {
  const customer = await getCustomer();

  const initial: CheckoutInitial = {
    authed: Boolean(customer),
    name: '',
    phone: '',
    email: customer?.email ?? '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
  };

  let addresses: SavedAddress[] = [];
  if (customer) {
    // Row-level security limits both reads to this customer's own data.
    const supabase = await createClient();
    const [{ data: profile }, { data: lastOrder }, { data: saved }] = await Promise.all([
      supabase.from('profiles').select('full_name, phone').eq('id', customer.id).maybeSingle(),
      supabase
        .from('orders')
        .select('customer_name, phone, address_line1, address_line2, city, state, postal_code')
        .eq('user_id', customer.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('customer_addresses')
        .select(ADDRESS_COLUMNS)
        .order('is_default', { ascending: false })
        .order('updated_at', { ascending: false }),
    ]);
    addresses = saved ?? [];
    // The default saved address wins; the last order is the fallback
    const def = addresses.find((a) => a.is_default) ?? addresses[0];

    initial.name = def?.full_name ?? profile?.full_name ?? lastOrder?.customer_name ?? '';
    initial.phone = def?.phone ?? profile?.phone ?? lastOrder?.phone ?? '';
    initial.addressLine1 = def?.address_line1 ?? lastOrder?.address_line1 ?? '';
    initial.addressLine2 = def ? (def.address_line2 ?? '') : (lastOrder?.address_line2 ?? '');
    initial.city = def?.city ?? lastOrder?.city ?? '';
    initial.state = def?.state ?? lastOrder?.state ?? '';
    initial.postalCode = def?.postal_code ?? lastOrder?.postal_code ?? '';
  }

  // key: when the shopper signs in on this page the server re-renders with their details,
  // and the form must restart from them instead of keeping the empty values.
  return (
    <CheckoutPageClient key={customer?.id ?? 'guest'} initial={initial} addresses={addresses} />
  );
}
