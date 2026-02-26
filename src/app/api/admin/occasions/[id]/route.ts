// src/app/api/admin/occasions/[id]/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession } from '@/utils/auth';
import { userService } from '@/services/userService';
import { occasionService } from '@/services/occasionService';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/admin/occasions/[id]
 * Actualiza una ocasión existente.
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  let routeOccasionId = '';

  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) return errorHandler(new Error('Acceso denegado.'), 401);

    const user = await userService.getUserById(session.dbId);
    if (user?.role !== 'admin') return errorHandler(new Error('Acceso prohibido.'), 403);

    const { id } = await params;
    routeOccasionId = id;

    const occasionId = parseInt(id, 10);
    
    const formData = await req.formData();
    const occasionDataString = formData.get('occasionData') as string;
    const imageFile = formData.get('image') as File | null;

    if (!occasionDataString) {
      return errorHandler(new Error('No se proporcionaron datos de la ocasión.'), 400);
    }

    const occasionData = JSON.parse(occasionDataString);
    const updatedOccasion = await occasionService.updateOccasion(occasionId, occasionData, imageFile, session.dbId);

    return successResponse(updatedOccasion);
  } catch (error) {
    console.error(`[API_ADMIN_OCCASIONS_PUT_ERROR] ID: ${routeOccasionId}`, error);
    return errorHandler(error);
  }
}

/**
 * DELETE /api/admin/occasions/[id]
 * Elimina una ocasión.
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  let routeOccasionId = '';

  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) return errorHandler(new Error('Acceso denegado.'), 401);

    const user = await userService.getUserById(session.dbId);
    if (user?.role !== 'admin') return errorHandler(new Error('Acceso prohibido.'), 403);

    const { id } = await params;
    routeOccasionId = id;

    const occasionId = parseInt(id, 10);
    await occasionService.deleteOccasion(occasionId, session.dbId);

    return successResponse({ message: 'Ocasión eliminada correctamente.' });
  } catch (error) {
    console.error(`[API_ADMIN_OCCASions_DELETE_ERROR] ID: ${routeOccasionId}`, error);
    return errorHandler(error);
  }
}
