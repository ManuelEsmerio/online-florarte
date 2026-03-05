// src/app/api/admin/occasions/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession, isAdminRole } from '@/utils/auth';
import { occasionService } from '@/services/occasionService';

/**
 * GET /api/admin/occasions
 * Obtiene todas las ocasiones.
 */
export async function GET(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) return errorHandler(new Error('Acceso denegado.'), 401);
    
        if (!isAdminRole(session.role)) return errorHandler(new Error('Acceso prohibido.'), 403);
    
    const occasions = await occasionService.getAllOccasions();
    return successResponse(occasions);
  } catch (error) {
    console.error('[API_ADMIN_OCCASIONS_GET_ERROR]', error);
    return errorHandler(error);
  }
}

/**
 * POST /api/admin/occasions
 * Crea una nueva ocasión.
 */
export async function POST(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) return errorHandler(new Error('Acceso denegado.'), 401);

        if (!isAdminRole(session.role)) return errorHandler(new Error('Acceso prohibido.'), 403);

    const formData = await req.formData();
    const occasionDataString = formData.get('occasionData') as string;
    const imageFile = formData.get('image') as File | null;

    if (!occasionDataString) {
      return errorHandler(new Error('No se proporcionaron datos de la ocasión.'), 400);
    }
    
    const occasionData = JSON.parse(occasionDataString);

    const newOccasion = await occasionService.createOccasion(occasionData, imageFile, session.dbId);

    return successResponse(newOccasion, 201);
  } catch (error) {
    console.error('[API_ADMIN_OCCASIONS_POST_ERROR]', error);
    return errorHandler(error);
  }
}
