// src/utils/file-utils.ts

/**
 * Constructs the public URL for a file stored in the /public directory or an external URL.
 * En modo demo, simplemente devuelve la ruta relativa para ser servida desde la carpeta public.
 *
 * @param relativePath La ruta relativa desde /public (ej. 'images/products/1/file.webp') o una URL completa.
 * @returns La URL pública accesible (ej. '/images/products/1/file.webp').
 */
export function getPublicUrlForPath(relativePath: string | null | undefined): string {
    if (!relativePath) {
        return "";
    }

    const pathStr = String(relativePath).trim();

    // Si ya es una URL absoluta, la devolvemos tal cual.
    if (pathStr.startsWith('http://') || pathStr.startsWith('https://') || pathStr.startsWith('data:')) {
        return pathStr;
    }

    // Si ya comienza con una barra, la ruta es correcta.
    if (pathStr.startsWith('/')) {
        return pathStr;
    }

    // Si no comienza con una barra, la añadimos para que sea relativa a la raíz del sitio.
    return `/${pathStr}`;
}
