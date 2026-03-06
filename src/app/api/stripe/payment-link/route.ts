// src/app/api/stripe/payment-link/route.ts
//
// Creates a Stripe Payment Link for a new order.
// Flow: auth check → create PENDING order → generate Payment Link → save linkId → return URL.
// Webhook checkout.session.completed (already existing) handles payment confirmation.
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession } from '@/utils/auth';
import { getSessionId } from '@/utils/session';
import { orderService } from '@/services/orderService';
import { stripeService } from '@/services/stripeService';
import { resolveShippingCost } from '@/lib/checkout/resolveShippingCost';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    const sessionId = getSessionId(req);

    if (!session?.dbId && !sessionId) {
      return errorHandler(new Error('No se pudo identificar la sesión para checkout.'), 401);
    }

    const body = await req.json();

    const shippingCost = await resolveShippingCost(body.addressId, body.guestPostalCode);

    // Create the PENDING order (same as Checkout Session flow)
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
      shippingCost,
    });

    const amountInCents = Math.round(Number(total) * 100);
    if (!amountInCents || amountInCents <= 0) {
      return errorHandler(new Error('Monto inválido para procesar pago.'), 400);
    }

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

    // Generate Stripe Payment Link
    const paymentLink = await stripeService.createPaymentLink({
      orderId,
      amountInCents,
      successUrl: `${origin}/order/processing?orderId=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
      userId: session?.dbId,
    });

    // Persist the Payment Link ID for deactivation on order expiry/cancellation
    await prisma.order.update({
      where: { id: orderId },
      data: { stripePaymentLinkId: paymentLink.id },
    });

    return successResponse(
      {
        orderId,
        checkoutSessionId: paymentLink.id,
        checkoutUrl: paymentLink.url,
      },
      201,
    );
  } catch (error) {
    console.error('[API_STRIPE_PAYMENT_LINK_ERROR]', error);
    return errorHandler(error);
  }
}
