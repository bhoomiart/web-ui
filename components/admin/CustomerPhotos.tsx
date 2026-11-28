/**
 * CustomerPhotos: thumbnails of customer-uploaded photos for admin screens.
 * Server component. Signs the stored paths, and each thumbnail opens the full photo.
 */
import { signPhotoPaths } from '@/lib/uploads';
import { PhotoThumbs } from '@/components/PhotoThumbs';

export async function CustomerPhotos({ paths }: { paths: string[] | null | undefined }) {
  const urls = await signPhotoPaths(paths);
  return <PhotoThumbs urls={urls} label="Customer photo" />;
}
