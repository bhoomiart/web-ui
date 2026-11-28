/**
 * PATCH /api/admin/products/[id] — Update a product. Admin and staff.
 * DELETE /api/admin/products/[id] — Archive a product (soft delete). Admin and staff.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireStaffApi } from '@/lib/api/auth';
import { createAdminClient } from '@/lib/supabase/admin';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireStaffApi(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;

  const admin = createAdminClient();

  const { error } = await admin
    .from('products')
    .update({
      name: body.name,
      slug: body.slug,
      short_description: (body.short_description as string) || null,
      long_description: (body.long_description as string) || null,
      materials: (body.materials as string) || null,
      care_instructions: (body.care_instructions as string) || null,
      story_content: (body.story_content as string) || null,
      price: body.price != null ? Number(body.price) : null,
      sku: (body.sku as string) || null,
      availability_type: body.availability_type,
      preparation_time: (body.preparation_time as string) || null,
      status: body.status,
      is_featured: body.is_featured === true,
      is_signature: body.is_signature === true,
      is_bestseller: body.is_bestseller === true,
      is_new_arrival: body.is_new_arrival === true,
      seo_title: (body.seo_title as string) || null,
      seo_description: (body.seo_description as string) || null,
      seo_slug: (body.seo_slug as string) || null,
      og_image_url: (body.og_image_url as string) || null,
    } as never)
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from('audit_logs').insert({
    actor_id: auth.user.id,
    action: 'product.update',
    table_name: 'products',
    record_id: id,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireStaffApi(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const admin = createAdminClient();

  const { error } = await admin
    .from('products')
    .update({ status: 'archived' } as never)
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from('audit_logs').insert({
    actor_id: auth.user.id,
    action: 'product.archive',
    table_name: 'products',
    record_id: id,
  });

  return NextResponse.json({ ok: true });
}
