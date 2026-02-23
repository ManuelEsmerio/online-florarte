// src/app/api/coupons/remove/route.ts
import { type NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getIdentity } from '@/utils/request-utils';
import { cartRepository } from '@/repositories/cartRepository';

/**
 * POST /api/coupons/remove
 * Elimina la aplicación de un cupón de la sesión o carrito de usuario actual.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, sessionId } = await getIdentity(req);

    if (!sessionId && !userId) {
      // No hay carrito al cual quitarle el cupón
      return successResponse({ message: 'No hay sesión activa.' });
    }

    await cartRepository.removeCartCoupon({ userId, sessionId });

    return successResponse({ message: 'Cupón eliminado del carrito.' });

  } catch (error: any) {
    return errorHandler(error);
  }
}
