import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession } from '@/utils/auth';
import { orderService } from '@/services/orderService';
import { stripeService } from '@/services/stripeService';

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

    const ownerUserId = Number((order as any).user_id ?? (order as any).userId ?? 0);
    if (!ownerUserId || ownerUserId !== session.dbId) {
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

    const amountMajor = Number((order as any).total ?? 0);
    const amountInCents = Math.round(amountMajor * 100);

    if (!amountInCents || amountInCents <= 0) {
      return errorHandler(new Error('Monto inválido para procesar pago.'), 400);
    }

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

    const checkoutSession = await stripeService.createCheckoutSession({
      orderId,
      amountInCents,
      successUrl: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancelUrl: `${origin}/checkout/cancel?order_id=${orderId}`,
      userId: session.dbId,
    });

    return successResponse(
      {
        orderId,
        checkoutSessionId: checkoutSession.id,
        checkoutUrl: checkoutSession.url,
      },
      201,
    );
  } catch (error) {
    console.error('[API_STRIPE_CHECKOUT_SESSION_ORDER_ERROR]', error);
    return errorHandler(error);
  }
}
