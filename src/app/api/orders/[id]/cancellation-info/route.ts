// src/app/api/orders/[id]/cancellation-info/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession } from '@/utils/auth';
import { orderService } from '@/services/orderService';
import { getCancellationInfo } from '@/lib/business-logic/order-logic';

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/orders/[id]/cancellation-info
 * Obtiene la información sobre si un pedido puede ser cancelado y el mensaje correspondiente.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) {
      return errorHandler(new Error('Acceso denegado.'), 401);
    }

    const orderId = parseInt(params.id, 10);
    const order = await orderService.getOrderDetails(orderId);

    if (!order) {
      return errorHandler(new Error('Pedido no encontrado.'), 404);
    }
    
    // Asegurarse de que el usuario solo pueda ver la información de sus propios pedidos
    if (order.userId !== session.dbId) {
        return errorHandler(new Error('Acceso prohibido. No puedes ver este pedido.'), 403);
    }

    const cancellationInfo = getCancellationInfo(order);

    return successResponse(cancellationInfo);
  } catch (error) {
    console.error(`[API_CANCELLATION_INFO_ERROR] ID: ${params.id}`, error);
    return errorHandler(error);
  }
}
