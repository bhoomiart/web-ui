/** Accepts an https image URL from an admin form, or null to clear it. */
export function parseImageUrl(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const url = v.trim();
  return /^https:\/\/\S{1,2000}$/.test(url) ? url : null;
}
