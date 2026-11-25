/**
 * POST /api/admin/subcategories — Create a subcategory. Admin only.
 * GET  /api/admin/subcategories — List subcategories (optionally filtered by category_id). Staff.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi, requireStaffApi } from '@/lib/api/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { slugify } from '@/lib/api/slugify';

export async function GET(request: NextRequest) {
  const auth = await requireStaffApi(request);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('category_id');

  const admin = createAdminClient();
  let query = admin.from('subcategories').select('*').order('display_order', { ascending: true });
  if (categoryId) query = query.eq('category_id', categoryId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ subcategories: data });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json()) as Record<string, unknown>;
  const name = body.name as string;
  const categoryId = body.category_id as string;

  if (!name?.trim()) return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
  if (!categoryId?.trim())
    return NextResponse.json({ error: 'category_id is required.' }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('subcategories')
    .insert({
      name,
      slug: (body.slug as string) || slugify(name),
      category_id: categoryId,
      description: (body.description as string) || null,
      is_visible: body.is_visible !== false,
      display_order: Number(body.display_order ?? 0),
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ subcategory: data }, { status: 201 });
}
