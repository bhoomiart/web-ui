/**
 * POST /api/admin/products
 * Create a new product. Admin and staff.
 * Body: JSON product fields
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireStaffApi } from '@/lib/api/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { slugify } from '@/lib/api/slugify';

export async function POST(request: NextRequest) {
  const auth = await requireStaffApi(request);
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json()) as Record<string, unknown>;

  const name = body.name as string;
  if (!name?.trim()) {
    return NextResponse.json({ error: 'Product name is required.' }, { status: 400 });
  }

  const slug = (body.slug as string | undefined)?.trim() || slugify(name);

  const admin = createAdminClient();

  const { data: product, error } = await admin
    .from('products')
    .insert({
      name,
      slug,
      short_description: (body.short_description as string) || null,
      long_description: (body.long_description as string) || null,
      materials: (body.materials as string) || null,
      care_instructions: (body.care_instructions as string) || null,
      story_content: (body.story_content as string) || null,
      price: body.price != null ? Number(body.price) : null,
      sku: (body.sku as string) || null,
      availability_type: ((body.availability_type as string | undefined) ??
        'ready_to_ship') as never,
      preparation_time: (body.preparation_time as string) || null,
      status: ((body.status as string | undefined) ?? 'draft') as never,
      is_featured: body.is_featured === true,
      is_signature: body.is_signature === true,
      is_bestseller: body.is_bestseller === true,
      is_new_arrival: body.is_new_arrival === true,
      seo_title: (body.seo_title as string) || null,
      seo_description: (body.seo_description as string) || null,
      seo_slug: (body.seo_slug as string) || null,
      og_image_url: (body.og_image_url as string) || null,
    })
    .select('id, slug')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit log
  await admin.from('audit_logs').insert({
    actor_id: auth.user.id,
    action: 'product.create',
    table_name: 'products',
    record_id: product.id,
  });

  return NextResponse.json({ product }, { status: 201 });
}
