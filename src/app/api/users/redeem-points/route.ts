// src/app/api/users/redeem-points/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession } from '@/utils/auth';
import { userService } from '@/services/userService';
import { couponService } from '@/services/couponService';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

/**
 * POST /api/users/redeem-points
 * Endpoint protegido para que un usuario canjee sus puntos de lealtad por cupones.
 */
export async function POST(req: NextRequest) {
  // 5 canjes por hora por IP — protege contra abuso masivo de puntos
  const ip = getClientIp(req);
  const rl = await checkRateLimit(`redeem_points:${ip}`, 5, 60 * 60 * 1000);
  if (!rl.allowed) {
    return errorHandler(new Error('Demasiadas solicitudes. Intenta de nuevo más tarde.'), 429);
  }

  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) {
      return errorHandler(new Error('Acceso denegado. Se requiere autenticación.'), 401);
    }
    
    const body = await req.json();
    const quantity = parseInt(body.quantity, 10);

    if (isNaN(quantity) || quantity < 1) {
      return errorHandler(new Error('La cantidad de cupones a canjear no es válida.'), 400);
    }

    const { coupons_created, new_coupon_ids } = await userService.redeemLoyaltyPoints(session.dbId, quantity);
    
    const createdCoupons = await couponService.getCouponsByIds(new_coupon_ids);

    return successResponse({ 
      message: `¡Felicidades! Has canjeado ${coupons_created} cupón(es) exitosamente.`,
      coupons: createdCoupons,
    });

  } catch (error) {
    console.error('[API_REDEEM_POINTS_ERROR]', error);
    return errorHandler(error);
  }
}
