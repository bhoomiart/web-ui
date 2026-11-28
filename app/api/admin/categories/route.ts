/**
 * POST /api/admin/categories — Create a category. Admin only.
 * GET  /api/admin/categories — List all categories. Staff.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi, requireStaffApi } from '@/lib/api/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseImageUrl } from '@/lib/api/imageUrl';
import { slugify } from '@/lib/api/slugify';

export async function GET(request: NextRequest) {
  const auth = await requireStaffApi(request);
  if (auth instanceof NextResponse) return auth;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ categories: data });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json()) as Record<string, unknown>;
  const name = body.name as string;
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required.' }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('categories')
    .insert({
      name,
      slug: (body.slug as string) || slugify(name),
      description: (body.description as string) || null,
      is_visible: body.is_visible !== false,
      display_order: Number(body.display_order ?? 0),
      image_url: parseImageUrl(body.image_url),
      seo_title: (body.seo_title as string) || null,
      seo_description: (body.seo_description as string) || null,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ category: data }, { status: 201 });
}
