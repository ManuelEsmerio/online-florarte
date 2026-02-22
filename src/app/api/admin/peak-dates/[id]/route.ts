// src/app/api/admin/peak-dates/[id]/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession } from '@/utils/auth';
import { userService } from '@/services/userService';
import { peakDateService } from '@/services/peakDateService';

interface RouteParams {
  params: { id: string };
}

/**
 * PUT /api/admin/peak-dates/[id]
 * Actualiza una fecha pico existente.
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) return errorHandler(new Error('Acceso denegado.'), 401);

    const user = await userService.getUserById(session.dbId);
    if (user?.role !== 'admin') return errorHandler(new Error('Acceso prohibido.'), 403);

    const peakDateId = parseInt(params.id, 10);
    const body = await req.json();

    const updatedPeakDate = await peakDateService.updatePeakDate(peakDateId, body, session.dbId);

    return successResponse(updatedPeakDate);
  } catch (error) {
    console.error(`[API_ADMIN_PEAK_DATES_PUT_ERROR] ID: ${params.id}`, error);
    return errorHandler(error);
  }
}

/**
 * DELETE /api/admin/peak-dates/[id]
 * Elimina una fecha pico.
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) return errorHandler(new Error('Acceso denegado.'), 401);

    const user = await userService.getUserById(session.dbId);
    if (user?.role !== 'admin') return errorHandler(new Error('Acceso prohibido.'), 403);

    const peakDateId = parseInt(params.id, 10);
    await peakDateService.deletePeakDate(peakDateId, session.dbId);

    return successResponse({ message: 'Fecha Pico eliminada correctamente.' });
  } catch (error) {
    console.error(`[API_ADMIN_PEAK_DATES_DELETE_ERROR] ID: ${params.id}`, error);
    return errorHandler(error);
  }
}
