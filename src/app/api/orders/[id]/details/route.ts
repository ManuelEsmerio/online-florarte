import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession } from '@/utils/auth';
import { orderService } from '@/services/orderService';
import { getCancellationInfo } from '@/lib/business-logic/order-logic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

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
    if (Number.isNaN(orderId) || orderId <= 0) {
      return errorHandler(new Error('ID de pedido inválido.'), 400);
    }

    const order = await orderService.getOrderDetails(orderId);
    if (!order) {
      return errorHandler(new Error('Pedido no encontrado.'), 404);
    }

    const ownerUserId = Number((order as any).user_id ?? (order as any).userId ?? 0);
    if (!ownerUserId || ownerUserId !== session.dbId) {
      return errorHandler(new Error('Acceso prohibido. No puedes ver este pedido.'), 403);
    }

    const cancellationInfo = getCancellationInfo(order as any);

    return successResponse({
      order,
      cancellationInfo,
    });
  } catch (error) {
    console.error(`[API_ORDER_DETAILS_ERROR] ID: ${routeOrderId}`, error);
    return errorHandler(error);
  }
}
