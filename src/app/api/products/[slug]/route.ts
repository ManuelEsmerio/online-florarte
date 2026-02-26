// src/app/api/products/[slug]/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession } from '@/utils/auth';
import { userService } from '@/services/userService';
import { productService } from '@/services/productService';
import type { ProductStatus } from '@/lib/definitions';
import { ZodError } from 'zod';

interface RouteParams {
  params: Promise<{ slug: string }>;
}


/**
 * GET /api/products/[slug]
 * Endpoint público para obtener los detalles de un producto por su slug.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  let slug = '';
  try {
    const resolvedParams = await params;
    slug = resolvedParams.slug;
    const product = await productService.getCompleteProductDetailsBySlug(slug);

    if (!product || product.status === 'HIDDEN' || product.status === 'DRAFT') {
      const session: UserSession | null = await getDecodedToken(req);
      if(!session?.dbId) {
        return errorHandler(new Error('Producto no encontrado o no disponible.'), 404);
      }
      const user = await userService.getUserById(session.dbId);
      if (user?.role !== 'ADMIN') {
         return errorHandler(new Error('Producto no encontrado o no disponible.'), 404);
      }
    }

    if (!product) {
      return errorHandler(new Error('Producto no encontrado o no disponible.'), 404);
    }
    
    const relatedProducts = await productService.findRelatedProducts(product.category.id, product.id);

    return successResponse({
      product,
      relatedProducts,
    });
  } catch (error) {
    console.error(`[API_PRODUCT_GET_ERROR] Slug: ${slug}`, error);
    return errorHandler(error);
  }
}
