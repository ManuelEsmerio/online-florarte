// src/app/api/users/coupons/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession } from '@/utils/auth';
import { couponService } from '@/services/couponService';

/**
 * GET /api/users/coupons
 * Obtiene los cupones para el usuario autenticado.
 */
export async function GET(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) {
      return errorHandler(new Error('Acceso denegado. Se requiere autenticación.'), 401);
    }
    
    const coupons = await couponService.getUserCoupons(session.dbId);
    
    return successResponse(coupons);
  } catch (error) {
    console.error('[API_USER_COUPONS_GET_ERROR]', error);
    return errorHandler(error);
  }
}
