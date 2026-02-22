// src/app/api/products/[slug]/complements/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { productService } from '@/services/productService';

interface RouteParams {
  params: { slug: string };
}

/**
 * GET /api/products/[slug]/complements
 * Obtiene una lista de productos complementarios sugeridos para un producto principal.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = params;
    
    // Obtener el producto principal para analizar sus etiquetas y ocasiones
    const mainProduct = await productService.getCompleteProductDetailsBySlug(slug);
    if (!mainProduct) {
      // Si el producto no existe, devolvemos complementos genéricos
      const genericComplements = await productService.getComplementProducts();
      return successResponse({ complements: genericComplements });
    }
    
    // Obtener los complementos sugeridos basados en el producto principal
    const complementProducts = await productService.findComplementProducts(mainProduct);
    
    return successResponse({ complements: complementProducts });
  } catch (error) {
    console.error(`[API_COMPLEMENTS_GET_ERROR] Slug: ${params.slug}`, error);
    return errorHandler(error);
  }
}
