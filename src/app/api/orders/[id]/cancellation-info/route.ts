// src/app/api/orders/[id]/cancellation-info/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession } from '@/utils/auth';
import { orderService } from '@/services/orderService';
import { getCancellationInfo } from '@/lib/business-logic/order-logic';
import { assertOrderOwnership } from '@/utils/order-utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/orders/[id]/cancellation-info
 * Obtiene la información sobre si un pedido puede ser cancelado y el mensaje correspondiente.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  let routeOrderId = '';

  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) {
      return errorHandler(new Error('Acceso denegado.'), 401);
    }

    const { id } = await params;
    routeOrderId = id;

    const orderId = parseInt(id, 10);
    const order = await orderService.getOrderDetails(orderId);

    if (!order) {
      return errorHandler(new Error('Pedido no encontrado.'), 404);
    }

    if (!assertOrderOwnership(order, session.dbId)) {
      return errorHandler(new Error('Acceso prohibido. No puedes ver este pedido.'), 403);
    }

    const cancellationInfo = getCancellationInfo(order);

    return successResponse(cancellationInfo);
  } catch (error) {
    console.error(`[API_CANCELLATION_INFO_ERROR] ID: ${routeOrderId}`, error);
    return errorHandler(error);
  }
}
