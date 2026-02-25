// src/app/api/categories/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { categoryService } from '@/services/categoryService';

// Las categorías raramente cambian. Next.js cachea la respuesta 1 hora
// y la regenera en background sin bloquear requests.
export const revalidate = 3600;

/**
 * GET /api/categories
 * Endpoint público para obtener todas las categorías.
 * No requiere autenticación.
 */
export async function GET(req: NextRequest) {
  try {
    const categories = await categoryService.getAllCategories();
    return successResponse(categories);
  } catch (error) {
    console.error('[API_PUBLIC_CATEGORIES_GET_ERROR]', error);
    return errorHandler(error);
  }
}
