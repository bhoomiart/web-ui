/**
 * GET  /api/admin/homepage/banners — List all banners. Staff.
 * POST /api/admin/homepage/banners — Create a banner. Admin only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi, requireStaffApi } from '@/lib/api/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const auth = await requireStaffApi(request);
  if (auth instanceof NextResponse) return auth;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('banners')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ banners: data });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json()) as Record<string, unknown>;
  if (!(body.image_url as string)?.trim()) {
    return NextResponse.json({ error: 'image_url is required.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('banners')
    .insert({
      image_url: body.image_url as string,
      title: (body.title as string) || null,
      subtitle: (body.subtitle as string) || null,
      cta_text: (body.cta_text as string) || null,
      cta_url: (body.cta_url as string) || null,
      is_active: body.is_active !== false,
      display_order: Number(body.display_order ?? 0),
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ banner: data }, { status: 201 });
}
