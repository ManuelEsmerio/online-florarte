import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession } from '@/utils/auth';
import { getSessionId } from '@/utils/session';
import { orderService } from '@/services/orderService';
import { mercadoPagoService } from '@/services/mercadoPagoService';

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
      guestAddressAlias: body.guestAddressAlias,
      guestStreetName: body.guestStreetName,
      guestStreetNumber: body.guestStreetNumber,
      guestInteriorNumber: body.guestInteriorNumber,
      guestNeighborhood: body.guestNeighborhood,
      guestCity: body.guestCity,
      guestState: body.guestState,
      guestPostalCode: body.guestPostalCode,
      guestReferenceNotes: body.guestReferenceNotes,
      couponCode: body.couponCode,
      deliveryDate: body.deliveryDate,
      deliveryTimeSlot: body.deliveryTimeSlot,
      dedication: body.dedication,
      isAnonymous: body.isAnonymous,
      signature: body.signature,
      shippingCost: body.shippingCost,
    });

    const amount = Number(total);
    if (!amount || amount <= 0) {
      return errorHandler(new Error('Monto inválido para procesar pago.'), 400);
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || req.headers.get('origin') || '';

    const isPublicUrl = origin.startsWith('https://') && !origin.includes('localhost');

    const result = await mercadoPagoService.createCheckoutSession({
      orderId,
      amount,
      userId: session?.dbId,
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
    console.error('[API_MERCADOPAGO_CHECKOUT_SESSION_ERROR]', error);
    return errorHandler(error);
  }
}
