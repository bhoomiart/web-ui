/**
 * lib/supabase/storage.ts
 *
 * Storage helper utilities.
 * Called from Server Actions only — never from client components directly.
 */

import { createAdminClient } from './admin';

type BucketId = 'product-media' | 'review-media' | 'brand-assets';

/**
 * Upload a file and return the public URL (for public buckets)
 * or a signed URL (for private buckets).
 */
export async function uploadFile({
  bucket,
  path,
  file,
  contentType,
}: {
  bucket: BucketId;
  path: string; // e.g. 'products/abc123/image-1.jpg'
  file: Buffer | Uint8Array | ArrayBuffer | Blob;
  contentType: string;
}): Promise<string> {
  const admin = createAdminClient();

  const { error } = await admin.storage
    .from(bucket)
    .upload(path, file, { contentType, upsert: true });

  if (error) throw new Error(`uploadFile (${bucket}/${path}): ${error.message}`);

  // Public buckets return a stable URL
  if (bucket === 'product-media' || bucket === 'brand-assets') {
    const { data } = admin.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  // Private buckets (review-media) return a signed URL valid for 1 hour
  const { data, error: signError } = await admin.storage.from(bucket).createSignedUrl(path, 3600);

  if (signError) throw new Error(`createSignedUrl: ${signError.message}`);
  return data.signedUrl;
}

/**
 * Delete a file from storage.
 */
export async function deleteFile(bucket: BucketId, path: string) {
  const admin = createAdminClient();
  const { error } = await admin.storage.from(bucket).remove([path]);
  if (error) throw new Error(`deleteFile (${bucket}/${path}): ${error.message}`);
}

/**
 * Get a fresh signed URL for a private file.
 */
export async function getSignedUrl(bucket: BucketId, path: string, expiresIn = 3600) {
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(bucket).createSignedUrl(path, expiresIn);

  if (error) throw new Error(`getSignedUrl: ${error.message}`);
  return data.signedUrl;
}
