'use server';

/**
 * Admin auth server actions.
 * signInAction — called from LoginForm
 * signOutAction — called from AdminTopbar
 */

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function signInAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Don't leak internal Supabase error details
    return { error: 'Invalid email or password.' };
  }

  // proxy.ts will handle redirect on next request
  // We return success; the client router.push() handles navigation
  return { error: null };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}
