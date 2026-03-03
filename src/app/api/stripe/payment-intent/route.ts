import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession } from '@/utils/auth';
import { getSessionId } from '@/utils/session';
import { orderService } from '@/services/orderService';
import { stripeService } from '@/services/stripeService';
import { paymentTransactionService } from '@/services/paymentTransactionService';

export async function POST(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) {
      return errorHandler(new Error('Acceso denegado. Se requiere autenticación.'), 401);
    }

    const body = await req.json();
    const sessionId = getSessionId(req);

    const { orderId, total } = await orderService.initializeCheckout({
      userId: session.dbId,
      sessionId,
      addressId: body.addressId,
      couponCode: body.couponCode,
      deliveryDate: body.deliveryDate,
      deliveryTimeSlot: body.deliveryTimeSlot,
      dedication: body.dedication,
      isAnonymous: body.isAnonymous,
      signature: body.signature,
      shippingCost: body.shippingCost,
    });

    const amountMajor = Number(total);
    const amountInCents = Math.round(amountMajor * 100);

    if (!amountInCents || amountInCents <= 0) {
      return errorHandler(new Error('Monto inválido para procesar pago.'), 400);
    }

    const paymentIntent = await stripeService.createPaymentIntent({
      orderId,
      amountInCents,
      userId: session.dbId,
      sessionId,
    });

    await paymentTransactionService.upsertTransaction({
      orderId,
      externalPaymentId: paymentIntent.id,
      gateway: 'stripe',
      amount: amountMajor,
      status: 'PENDING',
    });

    return successResponse(
      {
        orderId,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      },
      201,
    );
  } catch (error) {
    console.error('[API_STRIPE_PAYMENT_INTENT_ERROR]', error);
    return errorHandler(error);
  }
}
