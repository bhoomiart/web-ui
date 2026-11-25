/**
 * GET  /api/admin/pages — List all pages. Staff.
 * POST /api/admin/pages — Create or update a page. Admin only.
 *   body: { id? } — if id present, update; else create.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi, requireStaffApi } from '@/lib/api/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const auth = await requireStaffApi(request);
  if (auth instanceof NextResponse) return auth;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('pages')
    .select('id, slug, title, is_published, updated_at')
    .order('title');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pages: data });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json()) as Record<string, unknown>;
  const { id, slug, title, body: pageBody, is_published, seo_title, seo_description } = body;

  if (!slug || !title) {
    return NextResponse.json({ error: 'slug and title are required.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const payload = {
    slug: slug as string,
    title: title as string,
    body: (pageBody as string) || null,
    is_published: is_published === true,
    seo_title: (seo_title as string) || null,
    seo_description: (seo_description as string) || null,
  };

  let error;
  if (id) {
    ({ error } = await admin
      .from('pages')
      .update(payload as never)
      .eq('id', id as string));
  } else {
    ({ error } = await admin.from('pages').insert(payload));
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
