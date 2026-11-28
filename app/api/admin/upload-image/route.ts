/**
 * POST /api/admin/upload-image  (multipart/form-data)
 *
 * Staff-only image upload for catalogue records (category and subcategory images).
 * Fields: `file` (jpeg, png or webp, up to 10 MB) and `folder` ('categories' or 'subcategories').
 * Stores the file in the public product-media bucket and returns { url }.
 */
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { requireStaffApi } from '@/lib/api/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { extensionFor, matchesImageSignature } from '@/lib/uploads';

const FOLDERS = ['categories', 'subcategories'];
const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const auth = await requireStaffApi(request);
  if (auth instanceof NextResponse) return auth;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid upload.' }, { status: 400 });
  }
  const file = form.get('file');
  const folder = form.get('folder');
  if (!(file instanceof File) || typeof folder !== 'string' || !FOLDERS.includes(folder)) {
    return NextResponse.json({ error: 'file and folder are required.' }, { status: 400 });
  }
  if (file.size === 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image must be 10 MB or smaller.' }, { status: 400 });
  }
  const ext = extensionFor(file.type);
  if (!ext) {
    return NextResponse.json(
      { error: 'Only JPG, PNG or WebP images are allowed.' },
      { status: 415 }
    );
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!matchesImageSignature(bytes, file.type)) {
    return NextResponse.json({ error: 'That file is not a valid image.' }, { status: 415 });
  }

  const admin = createAdminClient();
  const path = `${folder}/${randomUUID()}.${ext}`;
  const { error } = await admin.storage
    .from('product-media')
    .upload(path, bytes, { contentType: file.type, upsert: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = admin.storage.from('product-media').getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl }, { status: 201 });
}
