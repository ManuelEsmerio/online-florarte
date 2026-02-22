// src/app/api/coupons/validate/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getIdentity } from '@/utils/request-utils';
import { couponService } from '@/services/couponService';
import { cartService } from '@/services/cartService';
import { ZodError } from 'zod';

/**
 * POST /api/coupons/validate
 * Valida un cupón contra el carrito actual sin aplicarlo permanentemente.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, sessionId } = await getIdentity(req);
    const { couponCode, deliveryDate } = await req.json();

    if (!couponCode) {
      return errorHandler(new Error('El código de cupón es requerido.'), 400);
    }
    
    if (!userId && !sessionId) {
      return errorHandler(new Error('No se pudo identificar el carrito.'), 400);
    }
    
    // Nueva función de servicio que solo valida
    const validCoupon = await couponService.validateCoupon({
      couponCode,
      userId,
      sessionId,
      deliveryDate
    });

    // Devuelve el cupón validado para que el frontend lo use
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
