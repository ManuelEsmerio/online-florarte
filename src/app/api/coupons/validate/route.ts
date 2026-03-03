// src/app/api/coupons/validate/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getIdentity } from '@/utils/request-utils';
import { cartService } from '@/services/cartService';
import { ZodError } from 'zod';

/**
 * POST /api/coupons/validate
 * Valida y aplica un cupón al carrito activo del usuario autenticado.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, sessionId } = await getIdentity(req);
    const { couponCode, deliveryDate } = await req.json();

    if (!couponCode) {
      return errorHandler(new Error('El código de cupón es requerido.'), 400);
    }

    if (!userId) {
      return errorHandler(new Error('Debes iniciar sesión para aplicar cupones.'), 401);
    }

    if (!sessionId) {
      return errorHandler(new Error('No se pudo identificar la sesión del carrito.'), 400);
    }

    const validCoupon = await cartService.applyCouponToCart({
      couponCode,
      userId,
      sessionId,
      deliveryDate,
    });

    return successResponse({
        coupon: validCoupon
    });

  } catch (error) {
    if (error instanceof ZodError) {
      return errorHandler(error, 400);
    }
    console.error('[API_COUPON_VALIDATE_ERROR]', error);
    return errorHandler(error);
  }
}
