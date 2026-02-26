// src/app/api/admin/tags/[id]/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession } from '@/utils/auth';
import { userService } from '@/services/userService';
import { tagService } from '@/services/tagService';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/admin/tags/[id]
 * Actualiza una etiqueta existente.
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  let routeTagId = '';

  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) return errorHandler(new Error('Acceso denegado.'), 401);

    const user = await userService.getUserById(session.dbId);
    if (user?.role !== 'admin') return errorHandler(new Error('Acceso prohibido.'), 403);

    const { id } = await params;
    routeTagId = id;

    const tagId = parseInt(id, 10);
    const body = await req.json();

    const updatedTag = await tagService.updateTag(tagId, body, session.dbId);

    return successResponse(updatedTag);
  } catch (error) {
    console.error(`[API_ADMIN_TAGS_PUT_ERROR] ID: ${routeTagId}`, error);
    return errorHandler(error);
  }
}

/**
 * DELETE /api/admin/tags/[id]
 * Elimina una etiqueta.
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  let routeTagId = '';

  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) return errorHandler(new Error('Acceso denegado.'), 401);

    const user = await userService.getUserById(session.dbId);
    if (user?.role !== 'admin') return errorHandler(new Error('Acceso prohibido.'), 403);

    const { id } = await params;
    routeTagId = id;

    const tagId = parseInt(id, 10);
    await tagService.deleteTag(tagId, session.dbId);

    return successResponse({ message: 'Etiqueta eliminada correctamente.' });
  } catch (error) {
    console.error(`[API_ADMIN_TAGS_DELETE_ERROR] ID: ${routeTagId}`, error);
    return errorHandler(error);
  }
}
