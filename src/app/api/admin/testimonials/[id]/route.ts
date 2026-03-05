// src/app/api/admin/testimonials/[id]/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession, isAdminRole } from '@/utils/auth';
import { testimonialService } from '@/services/testimonialService';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/admin/testimonials/[id]
 * Actualiza el estado de un testimonio (APPROVED, REJECTED, PENDING).
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) return errorHandler(new Error('Acceso denegado.'), 401);

        if (!isAdminRole(session.role)) return errorHandler(new Error('Acceso prohibido.'), 403);

    const { id } = await params;
    const testimonialId = parseInt(id, 10);
    const { status } = await req.json();

    if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return errorHandler(new Error('Estado inválido.'), 400);
    }

    const updated = await testimonialService.updateStatus(testimonialId, status);
    return successResponse(updated);
  } catch (error) {
    console.error('[API_ADMIN_TESTIMONIALS_PUT_ERROR]', error);
    return errorHandler(error);
  }
}

/**
 * DELETE /api/admin/testimonials/[id]
 * Elimina un testimonio.
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) return errorHandler(new Error('Acceso denegado.'), 401);

        if (!isAdminRole(session.role)) return errorHandler(new Error('Acceso prohibido.'), 403);

    const { id } = await params;
    const testimonialId = parseInt(id, 10);

    await testimonialService.deleteTestimonial(testimonialId);
    return successResponse({ message: 'Testimonio eliminado correctamente.' });
  } catch (error) {
    console.error('[API_ADMIN_TESTIMONIALS_DELETE_ERROR]', error);
    return errorHandler(error);
  }
}
