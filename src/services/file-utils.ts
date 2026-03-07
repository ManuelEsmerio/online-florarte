// src/services/file-utils.ts
// Images are stored in Cloudinary (absolute URLs) or as relative paths.
// This helper passes them through unchanged.

/**
 * Returns the public URL for a file path.
 * Cloudinary and other absolute URLs are returned as-is.
 * Relative paths are returned unchanged for Next.js Image to resolve.
 */
export function getPublicUrlForPath(filePath: string): string {
  return filePath ?? '';
}
