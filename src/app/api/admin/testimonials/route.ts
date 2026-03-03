// src/app/api/admin/testimonials/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession, isAdminRole } from '@/utils/auth';
import { userService } from '@/services/userService';
import { testimonialService } from '@/services/testimonialService';

/**
 * GET /api/admin/testimonials
 * Obtiene todos los testimonios para el panel de administración.
 */
export async function GET(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) return errorHandler(new Error('Acceso denegado.'), 401);

    const user = await userService.getUserById(session.dbId);
    if (!isAdminRole(user?.role)) return errorHandler(new Error('Acceso prohibido.'), 403);

    const testimonials = await testimonialService.getAllTestimonials();
    return successResponse(testimonials);
  } catch (error) {
    console.error('[API_ADMIN_TESTIMONIALS_GET_ERROR]', error);
    return errorHandler(error);
  }
}
