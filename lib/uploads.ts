/**
 * lib/uploads.ts
 *
 * Server-only helpers for customer photo uploads (customization references and
 * return photos). Files live in the private `customer-uploads` bucket. The database
 * stores storage paths, and admin screens turn them into short-lived signed URLs.
 */
import { createAdminClient } from '@/lib/supabase/admin';

export const UPLOAD_BUCKET = 'customer-uploads';
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_PHOTOS = 5;

export type UploadKind = 'customization' | 'return';

const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export function extensionFor(type: string): string | null {
  return EXT_BY_TYPE[type] ?? null;
}

/** Checks the file's first bytes, so a renamed non-image cannot get in. */
export function matchesImageSignature(bytes: Uint8Array, type: string): boolean {
  if (type === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === 'image/png') {
    return [0x89, 0x50, 0x4e, 0x47].every((b, i) => bytes[i] === b);
  }
  if (type === 'image/webp') {
    const tag = (from: number) => String.fromCharCode(...bytes.slice(from, from + 4));
    return tag(0) === 'RIFF' && tag(8) === 'WEBP';
  }
  return false;
}

/** Folder a caller may upload to and later reference. */
export function uploadPrefix(kind: UploadKind, ownerId: string | null): string {
  return `${kind}/${ownerId ?? 'guest'}/`;
}

/**
 * Keeps only paths the caller is allowed to reference: right kind, right owner,
 * no traversal. Returns null when the input is malformed or has too many entries.
 */
export function parsePhotoPaths(
  input: unknown,
  kind: UploadKind,
  ownerId: string | null
): string[] | null {
  if (input == null) return [];
  if (!Array.isArray(input) || input.length > MAX_PHOTOS) return null;
  const prefix = uploadPrefix(kind, ownerId);
  const out: string[] = [];
  for (const p of input) {
    if (
      typeof p !== 'string' ||
      p.length > 200 ||
      !p.startsWith(prefix) ||
      p.includes('..') ||
      p.slice(prefix.length).includes('/')
    ) {
      return null;
    }
    if (!out.includes(p)) out.push(p);
  }
  return out;
}

/** Signed URLs (1 hour) for stored paths. Paths that fail to sign are skipped. */
export async function signPhotoPaths(paths: string[] | null | undefined): Promise<string[]> {
  if (!paths?.length) return [];
  const admin = createAdminClient();
  const { data } = await admin.storage.from(UPLOAD_BUCKET).createSignedUrls(paths, 3600);
  return (data ?? []).flatMap((d) => (d.signedUrl ? [d.signedUrl] : []));
}
