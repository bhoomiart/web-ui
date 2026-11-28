/**
 * lib/auth/customer.ts
 *
 * Server-side auth for storefront customers. Counterpart of lib/auth/admin.ts.
 *
 * A customer is any Supabase user with a CONFIRMED email or phone. An
 * unconfirmed email/password sign-up has a session-less user record only, but we
 * check the flag as well so a half-finished sign-up can never place an order.
 *
 * Always call getCustomer() / requireCustomerApi() inside the handler. Never
 * rely on the proxy or on client state.
 *
 * RULE: server-only. Do not import from a 'use client' file.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface Customer {
  id: string;
  email: string | null;
  phone: string | null;
}

export async function getCustomer(): Promise<Customer | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  if (!user.email_confirmed_at && !user.phone_confirmed_at) return null;

  return { id: user.id, email: user.email ?? null, phone: user.phone || null };
}

/** For route handlers: returns the customer, or a ready-made 401 response. */
export async function requireCustomerApi(): Promise<Customer | NextResponse> {
  const customer = await getCustomer();
  if (!customer) {
    return NextResponse.json(
      { error: 'Please sign in to continue.', code: 'AUTH_REQUIRED' },
      { status: 401 }
    );
  }
  return customer;
}
