// src/services/file.service.ts
'use server';

import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { cloudinary } from '@/lib/cloudinary';
import { UserFacingError } from '@/utils/errors';

const MAX_CUSTOM_PHOTO_PIXELS = 20_000_000; // ~20MP, evita imágenes gigantes

/**
 * Asegura que un directorio exista, creándolo si es necesario.
 * @param dirPath La ruta del directorio a verificar/crear.
 */
async function ensureDirectoryExists(dirPath: string) {
  try {
    await fs.access(dirPath);
  } catch (error) {
    // Si el directorio no existe, lo creamos recursivamente.
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Procesa y guarda un archivo de imagen en el sistema de archivos local.
 * Convierte la imagen a formato .webp, la comprime y la guarda en la ruta especificada.
 *
 * @param file El archivo de imagen (File) a procesar.
 * @param entityType El tipo de entidad (ej. 'products', 'categories').
 * @param entityId El ID de la entidad para crear una carpeta específica.
 * @returns La ruta relativa del archivo guardado (desde /public).
 */
async function saveImageLocally(file: File, entityType: 'products' | 'categories' | 'occasions' | 'profiles' | 'announcements' | 'carts', entityId: string | number): Promise<string> {
  const imageBuffer = Buffer.from(await file.arrayBuffer());

  // Procesa la imagen con Sharp: convierte a webp y comprime.
  const webpBuffer = await sharp(imageBuffer)
    .webp({ quality: 80 })
    .toBuffer();

  // Define la ruta de guardado.
  const uniqueFilename = `${uuidv4()}.webp`;
  const publicDir = path.join(process.cwd(), 'public', 'images', entityType, String(entityId));
  const filePath = path.join(publicDir, uniqueFilename);
  
  // Asegura que el directorio de destino exista.
  await ensureDirectoryExists(publicDir);

  // Guarda el archivo procesado.
  await fs.writeFile(filePath, webpBuffer);

  // Devuelve la ruta relativa para ser almacenada en la base de datos.
  return `images/${entityType}/${entityId}/${uniqueFilename}`;
}

async function uploadImageToCloudinary(file: File, folder: string, publicId?: string): Promise<string> {
  if (!process.env.CLOUDINARY_URL) {
    throw new Error('CLOUDINARY_URL no está configurado');
  }

  const imageBuffer = Buffer.from(await file.arrayBuffer());
  const webpBuffer = await sharp(imageBuffer).webp({ quality: 82 }).toBuffer();
  const dataUri = `data:image/webp;base64,${webpBuffer.toString('base64')}`;

  const uploaded = await cloudinary.uploader.upload(dataUri, {
    folder,
    public_id: publicId,
    overwrite: !!publicId,
    invalidate: !!publicId,
    resource_type: 'image',
    format: 'webp',
  });

  return uploaded.secure_url;
}

function extractCloudinaryPublicId(url: string): string | null {
  try {
    if (!url.includes('/upload/')) return null;

    const withoutQuery = url.split('?')[0];
    const afterUpload = withoutQuery.split('/upload/')[1];
    if (!afterUpload) return null;

    const segments = afterUpload.split('/').filter(Boolean);
    if (segments.length === 0) return null;

    const noVersion = /^v\d+$/.test(segments[0]) ? segments.slice(1) : segments;
    if (noVersion.length === 0) return null;

    const fullPath = noVersion.join('/');
    const dotIndex = fullPath.lastIndexOf('.');
    return dotIndex > -1 ? fullPath.slice(0, dotIndex) : fullPath;
  } catch {
    return null;
  }
}

/**
 * Guarda la imagen de perfil de un usuario.
 */
export async function saveProfilePicture(
  userId: number,
  base64: string
) {
  if (!base64 || typeof base64 !== 'string' || !base64.startsWith('data:image')) {
    throw new Error('Formato inválido');
  }

  if (!process.env.CLOUDINARY_URL) {
    throw new Error('CLOUDINARY_URL no está configurado');
  }

  const uploaded = await cloudinary.uploader.upload(base64, {
    folder: 'online-florarte/profiles',
    format: 'webp',
    quality_analysis: true,
    public_id: `user-${userId}-avatar`,
    overwrite: true,
    invalidate: true,
    resource_type: 'image',
  });

  return uploaded.secure_url;
}

/**
 * Guarda la imagen de un producto.
 */
export async function saveProductImage(file: File, productId: number | string): Promise<string> {
  return uploadImageToCloudinary(
    file,
    `online-florarte/products/${productId}`,
    `main-${uuidv4()}`,
  );
}

/**
 * Guarda la imagen de una variante de producto.
 */
export async function saveProductVariantImage(
  file: File,
  productId: number | string,
  variantId: number | string,
): Promise<string> {
  return uploadImageToCloudinary(
    file,
    `online-florarte/products/${productId}/variants/${variantId}`,
    `variant-${uuidv4()}`,
  );
}

/**
 * Guarda la imagen de una categoría.
 */
export async function saveCategoryImage(file: File, categoryId: number): Promise<string> {
  return uploadImageToCloudinary(file, 'online-florarte/categories', `category-${categoryId}`);
}

/**
 * Guarda la imagen de una ocasión.
 */
export async function saveOccasionImage(file: File, occasionId: number): Promise<string> {
  return uploadImageToCloudinary(file, 'online-florarte/occasions', `occasion-${occasionId}`);
}

/**
 * Guarda la imagen de un anuncio.
 */
export async function saveAnnouncementImage(file: File, announcementId: string | number): Promise<string> {
  return uploadImageToCloudinary(file, 'online-florarte/announcements', `announcement-${announcementId}-${uuidv4()}`);
}

/**
 * Guarda la foto personalizada de un artículo del carrito.
 * @returns Un objeto con la ruta del archivo y un UUID único para el archivo.
 */
export async function saveCartPhoto(file: File, sessionId: string, productId: number): Promise<{ filePath: string, fileUUID: string }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const webpBuffer = await sharp(Buffer.from(arrayBuffer), { limitInputPixels: MAX_CUSTOM_PHOTO_PIXELS })
      .rotate()
      .webp({ quality: 75 })
      .toBuffer();
        
    const fileUUID = uuidv4();
    const uniqueFilename = `photo-${productId}-${fileUUID}.webp`;
    const publicDir = path.join(process.cwd(), 'public', 'images', 'carts', sessionId);
    const filePath = path.join(publicDir, uniqueFilename);

    await ensureDirectoryExists(publicDir);
    await fs.writeFile(filePath, webpBuffer);

    const relativePath = `images/carts/${sessionId}/${uniqueFilename}`;
    return { filePath: relativePath, fileUUID };
  } catch (error) {
    console.error('[saveCartPhoto] Error procesando la foto personalizada', error);
    throw new UserFacingError('No pudimos procesar la fotografía personalizada. Inténtalo con otra imagen.');
  }
}


/**
 * Elimina un archivo del sistema de archivos público.
 * @param relativePath La ruta relativa desde /public (ej. 'images/products/1/file.webp').
 */
export async function deleteLocalFile(relativePath: string): Promise<void> {
    if (!relativePath) return;
    try {
        const fullPath = path.join(process.cwd(), 'public', relativePath);
        await fs.unlink(fullPath);
    } catch (error: any) {
        // Ignoramos el error si el archivo no existe (puede haber sido borrado antes).
        if (error.code !== 'ENOENT') {
            console.error(`Error al eliminar el archivo local ${relativePath}:`, error);
        }
    }
}

export async function deleteManagedFile(pathOrUrl: string): Promise<void> {
  if (!pathOrUrl) return;

  const asText = String(pathOrUrl).trim();
  if (!asText) return;

  if (asText.startsWith('http://') || asText.startsWith('https://')) {
    const publicId = extractCloudinaryPublicId(asText);
    if (!publicId) return;

    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: 'image',
        invalidate: true,
      });
    } catch (error) {
      console.error(`Error al eliminar archivo de Cloudinary (${publicId}):`, error);
    }
    return;
  }

  await deleteLocalFile(asText);
}
