/**
 * proxy.ts — Next.js 16 route proxy (renamed from middleware.ts).
 *
 * Runs on every request matching the config.matcher.
 * Responsibilities:
 *   1. Refresh Supabase session tokens on every admin request
 *   2. Redirect unauthenticated users away from /admin/* to /admin/login
 *   3. Redirect authenticated admins away from /admin/login to /admin/dashboard
 *
 * IMPORTANT: This is NOT the authorization layer.
 * Cookie presence only proves a session exists — not what role the user has.
 * Every Server Action must call requireAdmin() / requireStaff() independently.
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Build a response we can mutate cookies on ──────────────────────────────
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  // ── Refresh Supabase session (keeps tokens alive) ──────────────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write cookies onto both request and response so the session
          // is visible to Server Components on this request.
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() triggers a token refresh if needed
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdminRoute = pathname.startsWith('/admin');
  const isLoginPage = pathname === '/admin/login';

  // ── Unauthenticated on a protected admin route ─────────────────────────────
  if (isAdminRoute && !isLoginPage && !user) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Staff already signed in on the login page — send to dashboard ─────────
  // Customers share the same Supabase Auth. A customer session must NOT be sent
  // to the dashboard: its own role check would send them straight back here,
  // and the two redirects would loop forever. Only admin and staff are moved on.
  if (isLoginPage && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    if (profile && ['admin', 'staff'].includes(profile.role)) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all /admin/* routes.
     * Exclude static files, _next internals, and the favicon
     * so they never trigger a Supabase token refresh.
     */
    '/admin/:path*',
  ],
};
