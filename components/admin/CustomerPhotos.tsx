/**
 * CustomerPhotos: thumbnails of customer-uploaded photos for admin screens.
 * Server component. Signs the stored paths, and each thumbnail opens the full photo.
 */
import { signPhotoPaths } from '@/lib/uploads';

export async function CustomerPhotos({ paths }: { paths: string[] | null | undefined }) {
  const urls = await signPhotoPaths(paths);
  if (urls.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2 mt-2">
      {urls.map((url, i) => (
        <li key={url}>
          <a href={url} target="_blank" rel="noopener noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`Customer photo ${i + 1}`}
              className="w-16 h-16 object-cover rounded-[var(--radius-md)] border border-[var(--color-earth-200)]"
            />
          </a>
        </li>
      ))}
    </ul>
  );
}
