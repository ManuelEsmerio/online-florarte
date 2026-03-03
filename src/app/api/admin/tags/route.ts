// src/app/api/admin/tags/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession, isAdminRole } from '@/utils/auth';
import { userService } from '@/services/userService';
import { tagService } from '@/services/tagService';

/**
 * GET /api/admin/tags
 * Obtiene todas las etiquetas.
 */
export async function GET(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) return errorHandler(new Error('Acceso denegado.'), 401);
    
    const user = await userService.getUserById(session.dbId);
    if (!isAdminRole(user?.role)) return errorHandler(new Error('Acceso prohibido.'), 403);
    
    const tags = await tagService.getAllTags();
    return successResponse(tags);
  } catch (error) {
    console.error('[API_ADMIN_TAGS_GET_ERROR]', error);
    return errorHandler(error);
  }
}

/**
 * POST /api/admin/tags
 * Crea una nueva etiqueta.
 */
export async function POST(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) return errorHandler(new Error('Acceso denegado.'), 401);

    const user = await userService.getUserById(session.dbId);
    if (!isAdminRole(user?.role)) return errorHandler(new Error('Acceso prohibido.'), 403);

    const body = await req.json();
    const newTag = await tagService.createTag(body, session.dbId);

    return successResponse(newTag, 201);
  } catch (error) {
    console.error('[API_ADMIN_TAGS_POST_ERROR]', error);
    return errorHandler(error);
  }
}
