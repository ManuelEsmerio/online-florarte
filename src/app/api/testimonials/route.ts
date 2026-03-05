// src/app/api/testimonials/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession } from '@/utils/auth';
import { z, ZodError } from 'zod';
import { testimonialService } from '@/services/testimonialService';
import { prisma } from '@/lib/prisma';

const submitTestimonialSchema = z.object({
  orderId: z.number().int().positive(),
  rating: z.number().min(1).max(5),
  comment: z.string().min(10, 'El comentario debe tener al menos 10 caracteres.'),
});

/**
 * POST /api/testimonials
 * Endpoint protegido para que un usuario envíe o actualice un testimonio sobre un pedido.
 * Si ya existe un testimonio para la orden en estado 'pendiente', lo actualiza.
 * Si no existe, lo crea.
 */
export async function POST(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) {
      return errorHandler(new Error('Acceso denegado. Se requiere autenticación.'), 401);
    }

    const body = await req.json();
    const { orderId, rating, comment } = submitTestimonialSchema.parse(body);

    const order = await prisma.order.findUnique({ where: { id: orderId }, select: { userId: true } });
    if (!order || order.userId !== session.dbId) {
      return errorHandler(new Error('No puedes dejar una reseña para este pedido.'), 403);
    }

    const existing = await testimonialService.getTestimonialByOrder(orderId);
    let isUpdate = false;
    let result: { id: number };
    if (existing) {
      result = await prisma.testimonial.update({ where: { orderId }, data: { rating, comment, status: 'PENDING' } });
      isUpdate = true;
    } else {
      result = await testimonialService.createTestimonial({ userId: session.dbId, orderId, rating, comment });
    }

    return successResponse({
      testimonialId: result.id,
      message: isUpdate
        ? 'Tu reseña ha sido actualizada y sigue pendiente de aprobación.'
        : 'Tu testimonio ha sido enviado y está pendiente de aprobación. ¡Gracias por tus comentarios!',
    }, isUpdate ? 200 : 201);

  } catch (error) {
    if (error instanceof ZodError) {
      return errorHandler(error, 400);
    }
    console.error('[API_TESTIMONIALS_POST_ERROR]', error);
    return errorHandler(error);
  }
}
