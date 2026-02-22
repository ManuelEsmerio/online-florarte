// src/utils/file-utils.ts
import { storage as adminStorage } from '@/lib/firebase-admin';
import sharp from 'sharp';

/**
 * Constructs the public URL for a file in a Firebase Storage bucket.
 * @param filePath The path to the file in the bucket (e.g., "users/123/profile.webp").
 * @returns The permanent, publicly accessible URL.
 */
export function getPublicUrlForPath(filePath: string): string {
    if (!filePath || !filePath.includes('/')) return ""; // Basic check for valid path
    const bucketName = adminStorage.bucket().name;
    // Note: Standard public URL format, requires object to be publicly accessible.
    return `https://storage.googleapis.com/${bucketName}/${filePath}`;
}
