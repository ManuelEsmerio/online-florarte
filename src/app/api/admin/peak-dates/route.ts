// src/app/api/admin/peak-dates/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession, isAdminRole } from '@/utils/auth';
import { peakDateService } from '@/services/peakDateService';

/**
 * GET /api/admin/peak-dates
 * Obtiene todas las fechas pico.
 */
export async function GET(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) return errorHandler(new Error('Acceso denegado.'), 401);
    
        if (!isAdminRole(session.role)) return errorHandler(new Error('Acceso prohibido.'), 403);
    
    const peakDates = await peakDateService.getAllPeakDates();
    return successResponse(peakDates);
  } catch (error) {
    console.error('[API_ADMIN_PEAK_DATES_GET_ERROR]', error);
    return errorHandler(error);
  }
}

/**
 * POST /api/admin/peak-dates
 * Crea una nueva fecha pico.
 */
export async function POST(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) return errorHandler(new Error('Acceso denegado.'), 401);

        if (!isAdminRole(session.role)) return errorHandler(new Error('Acceso prohibido.'), 403);

    const body = await req.json();
    const newPeakDate = await peakDateService.createPeakDate(body, session.dbId);

    return successResponse(newPeakDate, 201);
  } catch (error) {
    console.error('[API_ADMIN_PEAK_DATES_POST_ERROR]', error);
    return errorHandler(error);
  }
}
