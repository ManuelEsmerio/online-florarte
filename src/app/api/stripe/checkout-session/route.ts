import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession } from '@/utils/auth';
import { getSessionId } from '@/utils/session';
import { orderService } from '@/services/orderService';
import { stripeService } from '@/services/stripeService';

export async function POST(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    const body = await req.json();
    const sessionId = getSessionId(req);

    if (!session?.dbId && !sessionId) {
      return errorHandler(new Error('No se pudo identificar la sesión para checkout.'), 401);
    }

    const { orderId, total } = await orderService.initializeCheckout({
      userId: session?.dbId ?? null,
      sessionId,
      addressId: body.addressId,
      recipientName: body.recipientName,
      recipientPhone: body.recipientPhone,
      guestName: body.guestName,
      guestEmail: body.guestEmail,
      guestPhone: body.guestPhone,
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

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

    const checkoutSession = await stripeService.createCheckoutSession({
      orderId,
      amountInCents,
      successUrl: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancelUrl: `${origin}/checkout/cancel?order_id=${orderId}`,
      userId: session?.dbId,
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
    console.error('[API_STRIPE_CHECKOUT_SESSION_ERROR]', error);
    return errorHandler(error);
  }
}
