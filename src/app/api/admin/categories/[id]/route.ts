// src/app/api/admin/categories/[id]/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession, isAdminRole } from '@/utils/auth';
import { categoryService } from '@/services/categoryService';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/admin/categories/[id]
 * Actualiza una categoría existente.
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  let routeCategoryId = '';

  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) return errorHandler(new Error('Acceso denegado.'), 401);

        if (!isAdminRole(session.role)) return errorHandler(new Error('Acceso prohibido.'), 403);

    const { id } = await params;
    routeCategoryId = id;

    const categoryId = parseInt(id, 10);
    const formData = await req.formData();
    const categoryDataString = formData.get('categoryData') as string;
    const imageFile = formData.get('image') as File | null;

    if (!categoryDataString) {
      return errorHandler(new Error('No se proporcionaron datos de la categoría.'), 400);
    }
    
    const categoryData = JSON.parse(categoryDataString);
    const updatedCategory = await categoryService.updateCategory(categoryId, categoryData, imageFile, session.dbId);

    return successResponse(updatedCategory);
  } catch (error) {
    console.error(`[API_ADMIN_CATEGORIES_PUT_ERROR] ID: ${routeCategoryId}`, error);
    return errorHandler(error);
  }
}

/**
 * DELETE /api/admin/categories/[id]
 * Elimina una categoría.
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  let routeCategoryId = '';

  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) return errorHandler(new Error('Acceso denegado.'), 401);

        if (!isAdminRole(session.role)) return errorHandler(new Error('Acceso prohibido.'), 403);

    const { id } = await params;
    routeCategoryId = id;

    const categoryId = parseInt(id, 10);
    await categoryService.deleteCategory(categoryId, session.dbId);

    return successResponse({ message: 'Categoría eliminada correctamente.' });
  } catch (error) {
    console.error(`[API_ADMIN_CATEGORIES_DELETE_ERROR] ID: ${routeCategoryId}`, error);
    return errorHandler(error);
  }
}
