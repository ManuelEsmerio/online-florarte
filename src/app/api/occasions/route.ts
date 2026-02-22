// src/app/api/occasions/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { occasionService } from '@/services/occasionService';

/**
 * GET /api/occasions
 * Endpoint público para obtener todas las ocasiones.
 * No requiere autenticación.
 */
export async function GET(req: NextRequest) {
  try {
    const occasions = await occasionService.getAllOccasions();
    return successResponse(occasions);
  } catch (error) {
    console.error('[API_PUBLIC_OCCASIONS_GET_ERROR]', error);
    return errorHandler(error);
  }
}
