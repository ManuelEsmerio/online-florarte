// src/app/api/categories/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { categoryService } from '@/services/categoryService';

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
