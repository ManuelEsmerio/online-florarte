// src/app/api/admin/coupons/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession, isAdminRole } from '@/utils/auth';
import { couponService } from '@/services/couponService';
import { ZodError } from 'zod';

/**
 * GET /api/admin/coupons
 * Endpoint protegido para obtener la lista de cupones con paginación y filtros.
 */
export async function GET(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) {
      return errorHandler(new Error('Acceso denegado.'), 401);
    }
        if (!isAdminRole(session.role)) return errorHandler(new Error('Acceso prohibido.'), 403);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status')?.split(',') || [];
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const withDetails = searchParams.get('withDetails') === 'true';
    
    const result = await couponService.getAllCoupons({ search, status, page, limit, withDetails });
    
    return successResponse(result);
  } catch (error) {
    console.error('[API_ADMIN_COUPONS_GET_ERROR]', error);
    return errorHandler(error);
  }
}

/**
 * POST /api/admin/coupons
 * Endpoint protegido para crear un nuevo cupón.
 */
export async function POST(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) {
      return errorHandler(new Error('Acceso denegado.'), 401);
    }
        if (!isAdminRole(session.role)) return errorHandler(new Error('Acceso prohibido.'), 403);
    
    const body = await req.json();
    const newCoupon = await couponService.createCoupon(body, session.dbId);
    
    return successResponse(newCoupon, 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorHandler(error, 400);
    }
    console.error('[API_ADMIN_COUPONS_POST_ERROR]', error);
    return errorHandler(error);
  }
}

/**
 * DELETE /api/admin/coupons
 * Endpoint protegido para eliminar múltiples cupones.
 */
export async function DELETE(req: NextRequest) {
    try {
        const session: UserSession | null = await getDecodedToken(req);
        if (!session?.dbId) {
            return errorHandler(new Error('Acceso denegado.'), 401);
        }
                if (!isAdminRole(session.role)) return errorHandler(new Error('Acceso prohibido.'), 403);

        const { ids } = await req.json();
        if (!Array.isArray(ids) || ids.length === 0) {
            return errorHandler(new Error('Se requiere un array de IDs.'), 400);
        }
        
        const deletedCount = await couponService.bulkDeleteCoupons(ids, session.dbId);

        return successResponse({ message: `${deletedCount} cupones han sido eliminados.` });

    } catch (error) {
        console.error('[API_ADMIN_COUPONS_BULK_DELETE_ERROR]', error);
        return errorHandler(error);
    }
}
