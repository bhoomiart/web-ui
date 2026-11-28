/**
 * POST /api/uploads  (multipart/form-data)
 *
 * Customer photo upload. Fields: `file` (jpeg, png or webp, up to 5 MB) and
 * `kind` ('customization' or 'return').
 *
 * - customization: signed-in customers only (checkout needs an account anyway).
 * - return: signed-in customers, or guests (guests track orders by phone).
 *
 * Returns { path }. The path is sent back with the checkout or return request,
 * where the server checks it belongs to the caller before saving it.
 */
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { getCustomer } from '@/lib/auth/customer';
import { clientIp, rateLimit } from '@/lib/api/rateLimit';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  MAX_UPLOAD_BYTES,
  UPLOAD_BUCKET,
  extensionFor,
  matchesImageSignature,
  uploadPrefix,
  type UploadKind,
} from '@/lib/uploads';

function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: NextRequest) {
  const customer = await getCustomer();

  const limitKey = customer ? `upload:${customer.id}` : `upload:ip:${clientIp(request)}`;
  if (!rateLimit(limitKey, 30, 10 * 60_000)) {
    return fail(429, 'Too many uploads. Please wait a few minutes and try again.');
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail(400, 'Invalid upload.');
  }

  const kind = form.get('kind');
  if (kind !== 'customization' && kind !== 'return') return fail(400, 'Invalid upload.');
  if (kind === 'customization' && !customer) {
    return fail(401, 'Please sign in to continue.');
  }

  const file = form.get('file');
  if (!(file instanceof File)) return fail(400, 'Choose a photo to upload.');
  if (file.size === 0) return fail(400, 'That file is empty.');
  if (file.size > MAX_UPLOAD_BYTES) return fail(413, 'Each photo must be 5 MB or smaller.');

  const ext = extensionFor(file.type);
  if (!ext) return fail(415, 'Only JPG, PNG or WebP photos are allowed.');

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!matchesImageSignature(bytes, file.type)) {
    return fail(415, 'That file is not a valid photo.');
  }

  const path = `${uploadPrefix(kind as UploadKind, customer?.id ?? null)}${randomUUID()}.${ext}`;
  const admin = createAdminClient();
  const { error } = await admin.storage
    .from(UPLOAD_BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: false });
  if (error) {
    console.error('uploads: storage upload failed', { kind });
    return fail(500, 'We could not upload that photo. Please try again.');
  }

  return NextResponse.json({ path }, { status: 201 });
}
