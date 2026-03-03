// src/app/api/admin/categories/[id]/toggle-visibility/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession, isAdminRole } from '@/utils/auth';
import { userService } from '@/services/userService';
import { categoryService } from '@/services/categoryService';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/admin/categories/[id]/toggle-visibility
 * Actualiza solo el campo `show_on_home` de una categoría.
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  let routeCategoryId = '';

  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) return errorHandler(new Error('Acceso denegado.'), 401);

    const user = await userService.getUserById(session.dbId);
    if (!isAdminRole(user?.role)) return errorHandler(new Error('Acceso prohibido.'), 403);

    const { id } = await params;
    routeCategoryId = id;

    const categoryId = parseInt(id, 10);
    const { show_on_home } = await req.json();

    if (typeof show_on_home !== 'boolean') {
      return errorHandler(new Error('El valor de `show_on_home` debe ser booleano.'), 400);
    }
    
    await categoryService.toggleCategoryShowOnHome(categoryId, show_on_home, session.dbId);

    return successResponse({ message: 'Visibilidad actualizada correctamente.' });
  } catch (error) {
    console.error(`[API_ADMIN_CATEGORIES_TOGGLE_ERROR] ID: ${routeCategoryId}`, error);
    return errorHandler(error);
  }
}
