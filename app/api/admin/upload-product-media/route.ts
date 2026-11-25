/**
 * POST /api/admin/upload-product-media
 *
 * Receives a multipart form with `file` and `productId`,
 * uploads to Supabase Storage (product-media bucket),
 * inserts a product_media row, and returns the public URL.
 *
 * Protected: requires admin/staff session via cookie.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  // ── Auth check ────────────────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();

  if (!profile || !['admin', 'staff'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // ── Parse form data ───────────────────────────────────────────────────────
  const form = await request.formData();
  const file = form.get('file') as File | null;
  const productId = form.get('productId') as string | null;

  if (!file || !productId) {
    return NextResponse.json({ error: 'file and productId are required.' }, { status: 400 });
  }

  if (file.size > 52_428_800) {
    return NextResponse.json({ error: 'File exceeds 50MB limit.' }, { status: 400 });
  }

  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  if (!isImage && !isVideo) {
    return NextResponse.json({ error: 'Unsupported file type.' }, { status: 400 });
  }

  // ── Upload to storage ─────────────────────────────────────────────────────
  const ext = file.name.split('.').pop() ?? 'jpg';
  const timestamp = Date.now();
  const path = `products/${productId}/${timestamp}.${ext}`;

  const buffer = await file.arrayBuffer();
  const { error: uploadError } = await admin.storage
    .from('product-media')
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = admin.storage.from('product-media').getPublicUrl(path);

  // ── Get current max display_order ─────────────────────────────────────────
  const { data: existing } = await admin
    .from('product_media')
    .select('display_order')
    .eq('product_id', productId)
    .order('display_order', { ascending: false })
    .limit(1);

  const nextOrder = existing?.[0] ? existing[0].display_order + 1 : 0;

  // ── Insert product_media row ──────────────────────────────────────────────
  const { data: mediaRow, error: dbError } = await admin
    .from('product_media')
    .insert({
      product_id: productId,
      url: publicUrl,
      media_type: isVideo ? 'video' : 'image',
      display_order: nextOrder,
    })
    .select('id')
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ url: publicUrl, id: mediaRow.id });
}
