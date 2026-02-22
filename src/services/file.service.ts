// src/services/file.service.ts
'use server';

import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

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

/**
 * Guarda la imagen de perfil de un usuario.
 */
export async function saveProfilePicture(file: File, userId: number): Promise<string> {
  return saveImageLocally(file, 'profiles', userId);
}

/**
 * Guarda la imagen de un producto.
 */
export async function saveProductImage(file: File, productId: number | string): Promise<string> {
  return saveImageLocally(file, 'products', productId);
}

/**
 * Guarda la imagen de una categoría.
 */
export async function saveCategoryImage(file: File, categoryId: number): Promise<string> {
  return saveImageLocally(file, 'categories', categoryId);
}

/**
 * Guarda la imagen de una ocasión.
 */
export async function saveOccasionImage(file: File, occasionId: number): Promise<string> {
  return saveImageLocally(file, 'occasions', occasionId);
}

/**
 * Guarda la imagen de un anuncio.
 */
export async function saveAnnouncementImage(file: File, announcementId: string | number): Promise<string> {
  return saveImageLocally(file, 'announcements', announcementId);
}

/**
 * Guarda la foto personalizada de un artículo del carrito.
 * @returns Un objeto con la ruta del archivo y un UUID único para el archivo.
 */
export async function saveCartPhoto(file: File, sessionId: string, productId: number): Promise<{ filePath: string, fileUUID: string }> {
    const webpBuffer = await sharp(Buffer.from(await file.arrayBuffer()))
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
