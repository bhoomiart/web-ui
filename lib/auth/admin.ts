/**
 * lib/auth/admin.ts
 *
 * Server-side auth guards for admin Server Actions.
 *
 * USAGE — call at the top of every admin Server Action:
 *
 *   export async function updateProduct(id: string, data: FormData) {
 *     'use server'
 *     const actor = await requireAdmin()   // throws if not admin
 *     // ... proceed with actor.id
 *   }
 *
 * NEVER rely solely on proxy.ts for authorization.
 * Server Actions are callable via direct POST — always check server-side.
 */

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export interface AuthenticatedActor {
  id: string;
  email: string | null;
  role: 'admin' | 'staff';
  fullName: string | null;
}

/**
 * Verifies the current request is from an authenticated admin.
 * Throws (and redirects to /admin/login) if not.
 */
export async function requireAdmin(): Promise<AuthenticatedActor> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/admin/login');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, full_name, email')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || profile.role !== 'admin') {
    redirect('/admin/login');
  }

  return {
    id: profile.id,
    email: profile.email,
    role: profile.role,
    fullName: profile.full_name,
  };
}

/**
 * Verifies the current request is from an authenticated admin or staff member.
 * Throws (and redirects) if not.
 */
export async function requireStaff(): Promise<AuthenticatedActor> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/admin/login');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, full_name, email')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || !['admin', 'staff'].includes(profile.role)) {
    redirect('/admin/login');
  }

  return {
    id: profile.id,
    email: profile.email,
    role: profile.role as 'admin' | 'staff',
    fullName: profile.full_name,
  };
}

/**
 * Returns the current session user without throwing.
 * Returns null if unauthenticated.
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name, email')
    .eq('id', user.id)
    .single();

  return profile ?? null;
}
