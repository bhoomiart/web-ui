/**
 * POST /api/auth/signin   (admin and staff sign-in)
 * Body: { email, password }
 * Returns: { ok: true } or { error: string }
 *
 * Customers use the same Supabase Auth, so a correct password is not enough:
 * the account must also be admin or staff. Anyone else is signed straight back
 * out, so a customer session is never created through the admin login.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = (await request.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  // A profile can read its own row (row-level security), so the user's own client is enough.
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle();

  if (!profile || !['admin', 'staff'].includes(profile.role)) {
    // 'local' ends only the session created by this attempt. The default ('global') would also
    // revoke the customer's genuine sessions on their other devices.
    await supabase.auth.signOut({ scope: 'local' });
    return NextResponse.json(
      { error: 'This account does not have access to the admin area.' },
      { status: 403 }
    );
  }

  return NextResponse.json({ ok: true });
}
