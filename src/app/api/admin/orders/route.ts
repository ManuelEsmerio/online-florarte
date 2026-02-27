// src/app/api/admin/orders/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession, isAdminRole } from '@/utils/auth';
import { userService } from '@/services/userService';
import { orderService } from '@/services/orderService';

/**
 * GET /api/admin/orders
 * Endpoint protegido para obtener todos los pedidos para el panel de administración.
 */
export async function GET(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) {
      return errorHandler(new Error('Acceso denegado.'), 401);
    }
    const user = await userService.getUserById(session.dbId);
    if (!isAdminRole(user?.role)) {
      return errorHandler(new Error('Acceso prohibido.'), 403);
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status')?.split(',').filter(Boolean) || [];
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    
    const { orders, total } = await orderService.getAllOrdersForAdmin({ search, status, page, limit });
    
    return successResponse({ orders, total });
  } catch (error) {
    console.error('[API_ADMIN_ORDERS_GET_ERROR]', error);
    return errorHandler(error);
  }
}
