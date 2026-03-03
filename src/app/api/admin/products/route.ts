// src/app/api/admin/products/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession, isAdminRole } from '@/utils/auth';
import { userService } from '@/services/userService';
import { productService } from '@/services/productService';
import { ZodError } from 'zod';


/**
 * GET /api/admin/products
 * Endpoint protegido para administradores.
 * Obtiene la lista completa de todos los productos que no están marcados como eliminados.
 */
export async function GET(req: NextRequest) {
  try {
    const includeMetaParam = req.nextUrl.searchParams.get('includeMeta');
    const includeMeta = includeMetaParam == null ? true : includeMetaParam !== 'false' && includeMetaParam !== '0';

    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) {
      return errorHandler(new Error('Acceso denegado. Se requiere autenticación.'), 401);
    }
    
    // Verificar que el usuario sea administrador
    const user = await userService.getUserById(session.dbId);
    if (!isAdminRole(user?.role)) {
      return errorHandler(new Error('Acceso prohibido. No tienes permisos de administrador.'), 403);
    }

    const adminProductData = await productService.getAdminProductList(includeMeta);
    // Filtramos para devolver solo los que no están eliminados lógicamente
    const activeProducts = adminProductData.products.filter(p => !p.is_deleted);

    return successResponse({
      products: activeProducts,
      categories: adminProductData.categories,
      occasions: adminProductData.occasions,
      tags: adminProductData.tags,
    });

  } catch (error) {
    console.error('[API_ADMIN_PRODUCTS_GET_ERROR]', error);
    return errorHandler(error);
  }
}

/**
 * POST /api/admin/products
 * Endpoint protegido para crear un nuevo producto.
 */
export async function POST(req: NextRequest) {
    try {
        const session: UserSession | null = await getDecodedToken(req);
        if (!session?.dbId) {
            return errorHandler(new Error('Acceso denegado.'), 401);
        }
        const user = await userService.getUserById(session.dbId);
        if (!isAdminRole(user?.role)) {
            return errorHandler(new Error('Acceso prohibido.'), 403);
        }

        const formData = await req.formData();
        const productDataString = formData.get('productData') as string;
        
        if (!productDataString) {
            return errorHandler(new Error('No se proporcionaron datos del producto.'), 400);
        }
        const productData = JSON.parse(productDataString);
        
        // Capturar todas las imágenes y asociarlas a sus variantes
        const imageFiles: { main: File[], variants: { index: number, files: File[] }[] } = {
            main: formData.getAll('images') as File[],
            variants: []
        };

        productData.variants?.forEach((variant: any, index: number) => {
            const variantImages = formData.getAll(`variant_${index}_images`) as File[];
            if (variantImages.length > 0) {
                imageFiles.variants.push({ index, files: variantImages });
            }
        });

        const upsertResult = await productService.createProduct(productData, imageFiles, session.dbId);
        
        return successResponse({
          product: {
            id: upsertResult.id,
            slug: upsertResult.slug,
            code: upsertResult.code,
          },
          dbResult: {
            result: upsertResult.result,
            message: upsertResult.message,
          }
        }, 201);

    } catch (error) {
        if (error instanceof ZodError) {
          return errorHandler(error, 400);
        }
        if (error instanceof SyntaxError) { // JSON.parse error
          return errorHandler(new Error('Los datos del producto tienen un formato JSON inválido.'), 400);
        }
        console.error('[API_ADMIN_PRODUCTS_POST_ERROR]', error);
        return errorHandler(error);
    }
}


/**
 * PUT /api/admin/products
 * Endpoint protegido para actualizar en lote el estado de varios productos.
 */
export async function PUT(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (session?.dbId === undefined) {
      return errorHandler(new Error('Acceso denegado. Se requiere autenticación.'), 401);
    }

    const user = await userService.getUserById(session.dbId);
    if (!isAdminRole(user?.role)) {
      return errorHandler(new Error('Acceso prohibido. No tienes permisos de administrador.'), 403);
    }

    const body = await req.json();
    const { slugs, status } = body;

    if (!Array.isArray(slugs) || slugs.length === 0 || !status) {
      return errorHandler(new Error('Datos inválidos. Se requiere un array de slugs y un estado.'), 400);
    }

    await productService.bulkUpdateStatus(slugs, status, session.dbId);

    return successResponse({ message: 'Productos actualizados correctamente.' });

  } catch (error) {
    console.error('[API_ADMIN_PRODUCTS_BULK_UPDATE_ERROR]', error);
    return errorHandler(error);
  }
}

/**
 * DELETE /api/admin/products
 * Endpoint protegido para realizar un borrado lógico de múltiples productos.
 */
export async function DELETE(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) {
      return errorHandler(new Error('Acceso denegado.'), 401);
    }
    const user = await userService.getUserById(session.dbId);
    if (!isAdminRole(user?.role)) {
      return errorHandler(new Error('Acceso prohibido.'), 403);
    }

    const { slugs } = await req.json();
    if (!Array.isArray(slugs) || slugs.length === 0) {
      return errorHandler(new Error('Se requiere un array de slugs de productos.'), 400);
    }

    const deletedCount = await productService.bulkSoftDelete(slugs, session.dbId);

    return successResponse({ message: `${deletedCount} productos han sido eliminados.` });
  } catch (error) {
    console.error('[API_ADMIN_PRODUCTS_BULK_DELETE_ERROR]', error);
    return errorHandler(error);
  }
}
