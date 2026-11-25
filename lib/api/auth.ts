/**
 * lib/api/auth.ts
 *
 * Auth helpers for Route Handlers.
 * Returns the authenticated user + profile, or a 401/403 response.
 *
 * Usage:
 *   const auth = await requireAdminApi(request)
 *   if (auth instanceof NextResponse) return auth  // early return 401/403
 *   // auth.user, auth.profile.role available here
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

type Profile = { id: string; role: string; full_name: string | null; email: string | null };
type AuthResult = { user: { id: string }; profile: Profile };

async function getAuthResult(
  request: NextRequest,
  requiredRole: 'admin' | 'staff'
): Promise<AuthResult | NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('id, role, full_name, email')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (requiredRole === 'admin' && profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden — admin role required' }, { status: 403 });
  }

  if (requiredRole === 'staff' && !['admin', 'staff'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden — staff role required' }, { status: 403 });
  }

  return { user: { id: user.id }, profile: profile as Profile };
}

export async function requireAdminApi(request: NextRequest): Promise<AuthResult | NextResponse> {
  return getAuthResult(request, 'admin');
}

export async function requireStaffApi(request: NextRequest): Promise<AuthResult | NextResponse> {
  return getAuthResult(request, 'staff');
}
