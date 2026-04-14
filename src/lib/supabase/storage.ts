import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

const BUCKET_NAME = 'generated-images';

/**
 * Uploads a base64 data-URL image to Supabase Storage and returns the public URL.
 * Uses the admin client (service role) so it bypasses RLS.
 */
export async function uploadImageToStorage(base64DataUrl: string, userId: string): Promise<string> {
  // Parse "data:image/png;base64,..." or "data:image/jpeg;base64,..."
  const match = base64DataUrl.match(/^data:(image\/\w+);base64,(.+)$/);

  if (!match) {
    throw new Error('Invalid base64 data URL format');
  }

  const mimeType = match[1];
  const base64Data = match[2];
  const extension = mimeType.split('/')[1]; // png, jpeg, webp, etc.
  const fileName = `${userId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  // Decode base64 to binary
  const binaryData = Buffer.from(base64Data, 'base64');

  const admin = createAdminClient();

  const { error } = await admin.storage.from(BUCKET_NAME).upload(fileName, binaryData, {
    contentType: mimeType,
    upsert: false,
  });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data: publicUrl } = admin.storage.from(BUCKET_NAME).getPublicUrl(fileName);

  return publicUrl.publicUrl;
}

/**
 * Deletes images from Supabase Storage given an array of public URLs.
 * Silently logs errors — storage cleanup failure should never block the caller.
 */
export async function deleteImagesFromStorage(publicUrls: string[]): Promise<void> {
  if (publicUrls.length === 0) return;

  const marker = `/object/public/${BUCKET_NAME}/`;

  const paths = publicUrls
    .map((url) => {
      const idx = url.indexOf(marker);
      return idx !== -1 ? url.slice(idx + marker.length) : null;
    })
    .filter((p): p is string => p !== null);

  if (paths.length === 0) return;

  const admin = createAdminClient();
  const { error } = await admin.storage.from(BUCKET_NAME).remove(paths);

  if (error) {
    console.error('[storage] Failed to delete images:', error.message);
  }
}
