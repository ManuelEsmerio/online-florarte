import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken } from '@/utils/auth';
import { orderService } from '@/services/orderService';
import { orderEmailService } from '@/services/orderEmailService';
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

    // Fetch full order — also performs IDOR check
    const order = await orderService.getOrderDetails(orderId);
    if (!order) {
      return errorHandler(new Error('Pedido no encontrado.'), 404);
    }

    const ownerUserId = Number((order as any).user_id ?? (order as any).userId ?? 0);
    if (!ownerUserId || ownerUserId !== session.dbId) {
      return errorHandler(new Error('Acceso prohibido.'), 403);
    }

    // Business-rule eligibility check (status + 24-hour window)
    const { canCancel, message } = getCancellationInfo(order);
    if (!canCancel) {
      return errorHandler(new Error(message), 422);
    }

    // Execute cancellation with automatic Stripe refund when payment exists
    const result = await orderService.cancelOrderWithRefund(orderId);

    // Fire email asynchronously — failure must never block the HTTP response
    orderEmailService.sendRefundNotificationEmail(orderId, result.refunded).catch((emailError) => {
      console.error('[CANCEL_ORDER_EMAIL_ERROR]', { orderId, error: (emailError as Error).message });
    });

    return successResponse({
      message: 'Pedido cancelado exitosamente.',
      refunded: result.refunded,
    });
  } catch (error) {
    console.error('[API_CANCEL_ORDER_ERROR]', error);
    return errorHandler(error);
  }
}
