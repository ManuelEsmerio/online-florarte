// src/app/api/home/recommended/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { productService } from '@/services/productService';

/**
 * GET /api/home/recommended
 * Endpoint público para obtener una lista de productos recomendados.
 */
export async function GET(req: NextRequest) {
  try {
    const recommendedProducts = await productService.getRecommendedProducts();
    return successResponse(recommendedProducts);
  } catch (error) {
    console.error('[API_HOME_RECOMMENDED_GET_ERROR]', error);
    return errorHandler(error);
  }
}
