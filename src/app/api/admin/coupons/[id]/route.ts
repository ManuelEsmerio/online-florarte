// src/app/api/admin/coupons/[id]/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession } from '@/utils/auth';
import { userService } from '@/services/userService';
import { couponService } from '@/services/couponService';
import { ZodError } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}


/**
 * GET /api/admin/coupons/[id]
 * Endpoint protegido para obtener un cupón por su ID con sus relaciones.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  let routeCouponId = '';

  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) return errorHandler(new Error('Acceso denegado.'), 401);
    
    const adminUser = await userService.getUserById(session.dbId);
    if (adminUser?.role !== 'admin') return errorHandler(new Error('Acceso prohibido.'), 403);
    
    const { id } = await params;
    routeCouponId = id;

    const couponId = parseInt(id, 10);
    const coupon = await couponService.getCouponById(couponId);
    
    if (!coupon) return errorHandler(new Error('Cupón no encontrado.'), 404);
    
    return successResponse(coupon);

  } catch (error) {
        console.error(`[API_ADMIN_COUPON_GET_ERROR] ID: ${routeCouponId}`, error);
    return errorHandler(error);
  }
}

/**
 * PUT /api/admin/coupons/[id]
 * Endpoint protegido para actualizar un cupón por su ID.
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  let routeCouponId = '';

  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) {
      return errorHandler(new Error('Acceso denegado.'), 401);
    }
    const adminUser = await userService.getUserById(session.dbId);
    if (adminUser?.role !== 'admin') {
      return errorHandler(new Error('Acceso prohibido.'), 403);
    }

    const { id } = await params;
    routeCouponId = id;

    const couponId = parseInt(id, 10);
    const body = await req.json();

    const updatedCoupon = await couponService.updateCoupon(couponId, body, session.dbId);
    
    return successResponse(updatedCoupon);

  } catch (error) {
    if (error instanceof ZodError) {
      return errorHandler(error, 400);
    }
    if (error instanceof Error && error.message.includes('Ya existe')) {
      return errorHandler(error, 409); // Conflict
    }
    console.error(`[API_ADMIN_COUPON_UPDATE_ERROR] ID: ${routeCouponId}`, error);
    return errorHandler(error);
  }
}

/**
 * DELETE /api/admin/coupons/[id]
 * Endpoint protegido para eliminar un cupón.
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  let routeCouponId = '';

  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) {
      return errorHandler(new Error('Acceso denegado.'), 401);
    }
    const adminUser = await userService.getUserById(session.dbId);
    if (adminUser?.role !== 'admin') {
      return errorHandler(new Error('Acceso prohibido.'), 403);
    }
    
    const { id } = await params;
    routeCouponId = id;

    const couponId = parseInt(id, 10);
    const success = await couponService.deleteCoupon(couponId, session.dbId);
    
    if(!success) {
        return errorHandler(new Error('No se pudo eliminar el cupón o no fue encontrado.'), 404);
    }

    return successResponse({ message: 'Cupón eliminado correctamente.' });
  } catch (error) {
    console.error(`[API_ADMIN_COUPON_DELETE_ERROR] ID: ${routeCouponId}`, error);
    return errorHandler(error);
  }
}
