import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession } from '@/utils/auth';
import { orderService } from '@/services/orderService';
import { mercadoPagoService } from '@/services/mercadoPagoService';
import { assertOrderOwnership } from '@/utils/order-utils';

export async function POST(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) {
      return errorHandler(new Error('Acceso denegado. Se requiere autenticación.'), 401);
    }

    const body = await req.json();
    const orderId = Number(body?.orderId);

    if (!Number.isFinite(orderId) || orderId <= 0) {
      return errorHandler(new Error('ID de pedido inválido.'), 400);
    }

    const order = await orderService.getOrderDetails(orderId);
    if (!order) {
      return errorHandler(new Error('Pedido no encontrado.'), 404);
    }

    if (!assertOrderOwnership(order, session.dbId)) {
      return errorHandler(new Error('Acceso prohibido. No puedes pagar este pedido.'), 403);
    }

    const orderStatus = String((order as any).status ?? '');
    if (orderStatus === 'cancelado' || orderStatus === 'CANCELLED') {
      return errorHandler(new Error('No se puede pagar un pedido cancelado.'), 400);
    }

    const paymentStatus = String((order as any).payment_status ?? 'PENDING');
    if (paymentStatus === 'SUCCEEDED') {
      return errorHandler(new Error('Este pedido ya fue pagado.'), 400);
    }

    const amount = Number((order as any).total ?? 0);
    if (!amount || amount <= 0) {
      return errorHandler(new Error('Monto inválido para procesar pago.'), 400);
    }

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
    const isPublicUrl = origin.startsWith('https://') && !origin.includes('localhost');

    const result = await mercadoPagoService.createCheckoutSession({
      orderId,
      amount,
      userId: session.dbId,
      successUrl: `${origin}/checkout/success?order_id=${orderId}`,
      cancelUrl: `${origin}/checkout/cancel?order_id=${orderId}`,
      pendingUrl: `${origin}/checkout/pending?order_id=${orderId}`,
      notificationUrl: isPublicUrl ? `${origin}/api/mercadopago/webhook` : undefined,
    });

    return successResponse(
      {
        orderId,
        checkoutSessionId: result.externalSessionId,
        checkoutUrl: result.checkoutUrl,
      },
      201,
    );
  } catch (error) {
    console.error('[API_MERCADOPAGO_CHECKOUT_SESSION_ORDER_ERROR]', error);
    return errorHandler(error);
  }
}
