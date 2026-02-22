// src/app/api/orders/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession } from '@/utils/auth';
import { orderService } from '@/services/orderService';


/**
 * GET /api/orders
 * Endpoint protegido para que un usuario obtenga su historial de pedidos.
 */
export async function GET(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) {
      return errorHandler(new Error('Acceso denegado. Se requiere autenticación.'), 401);
    }
    
    const orders = await orderService.getOrdersForUser(session.dbId);
    
    return successResponse(orders);
  } catch (error) {
    console.error('[API_USER_ORDERS_GET_ERROR]', error);
    return errorHandler(error);
  }
}
