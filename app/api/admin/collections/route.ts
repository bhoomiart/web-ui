/**
 * GET  /api/admin/collections — List all collections. Staff.
 * POST /api/admin/collections — Create a collection. Admin only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi, requireStaffApi } from '@/lib/api/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const auth = await requireStaffApi(request);
  if (auth instanceof NextResponse) return auth;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('collections')
    .select('*, collection_products(product_id)')
    .order('type');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ collections: data });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json()) as Record<string, unknown>;
  if (!(body.name as string)?.trim()) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('collections')
    .insert({
      name: body.name as string,
      slug: body.slug as string,
      type: body.type as never,
      description: (body.description as string) || null,
      is_visible: body.is_visible !== false,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ collection: data }, { status: 201 });
}
