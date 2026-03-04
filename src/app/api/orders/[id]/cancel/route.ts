import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken } from '@/utils/auth';
import { orderService } from '@/services/orderService';
import { getCancellationInfo } from '@/lib/business-logic/order-logic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getDecodedToken(req);
    if (!session?.dbId) {
      return errorHandler(new Error('No autorizado.'), 401);
    }

    const { id } = await params;
    const orderId = parseInt(id, 10);

    if (isNaN(orderId) || orderId <= 0) {
      return errorHandler(new Error('ID de pedido inválido.'), 400);
    }

    const order = await orderService.getOrderDetails(orderId);
    if (!order) {
      return errorHandler(new Error('Pedido no encontrado.'), 404);
    }

    const ownerUserId = Number((order as any).user_id ?? (order as any).userId ?? 0);
    if (!ownerUserId || ownerUserId !== session.dbId) {
      return errorHandler(new Error('Acceso prohibido.'), 403);
    }

    const { canCancel, message } = getCancellationInfo(order);
    if (!canCancel) {
      return errorHandler(new Error(message), 422);
    }

    await orderService.cancelAbandonedOrder(orderId);

    return successResponse({ message: 'Pedido cancelado exitosamente.' });
  } catch (error) {
    console.error('[API_CANCEL_ORDER_ERROR]', error);
    return errorHandler(error);
  }
}
