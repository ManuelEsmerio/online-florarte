// src/app/api/admin/categories/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession } from '@/utils/auth';
import { userService } from '@/services/userService';
import { categoryService } from '@/services/categoryService';

/**
 * GET /api/admin/categories
 * Obtiene todas las categorías.
 */
export async function GET(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) return errorHandler(new Error('Acceso denegado.'), 401);
    
    const user = await userService.getUserById(session.dbId);
    if (user?.role !== 'admin') return errorHandler(new Error('Acceso prohibido.'), 403);
    
    const categories = await categoryService.getAllCategories();
    return successResponse(categories);
  } catch (error) {
    console.error('[API_ADMIN_CATEGORIES_GET_ERROR]', error);
    return errorHandler(error);
  }
}

/**
 * POST /api/admin/categories
 * Crea una nueva categoría.
 */
export async function POST(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) return errorHandler(new Error('Acceso denegado.'), 401);

    const user = await userService.getUserById(session.dbId);
    if (user?.role !== 'admin') return errorHandler(new Error('Acceso prohibido.'), 403);

    const formData = await req.formData();
    const categoryDataString = formData.get('categoryData') as string;
    const imageFile = formData.get('image') as File | null;

    if (!categoryDataString) {
      return errorHandler(new Error('No se proporcionaron datos de la categoría.'), 400);
    }

    const categoryData = JSON.parse(categoryDataString);
    const newCategory = await categoryService.createCategory(categoryData, imageFile, session.dbId);

    return successResponse(newCategory, 201);
  } catch (error) {
    console.error('[API_ADMIN_CATEGORIES_POST_ERROR]', error);
    return errorHandler(error);
  }
}
