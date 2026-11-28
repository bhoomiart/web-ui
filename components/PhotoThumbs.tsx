/**
 * PhotoThumbs: row of clickable thumbnails. Each opens the full photo in a new tab.
 */
export function PhotoThumbs({ urls, label = 'Photo' }: { urls: string[]; label?: string }) {
  if (urls.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2 mt-2">
      {urls.map((url, i) => (
        <li key={url}>
          <a href={url} target="_blank" rel="noopener noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`${label} ${i + 1}`}
              className="w-16 h-16 object-cover rounded-[var(--radius-md)] border border-[var(--color-earth-200)]"
            />
          </a>
        </li>
      ))}
    </ul>
  );
}
