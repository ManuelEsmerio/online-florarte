
// src/app/api/checkout/init/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession } from '@/utils/auth';
import { getSessionId } from '@/utils/session';
import { orderService } from '@/services/orderService';
import Stripe from 'stripe';
import { ZodError } from 'zod';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
});

// Implementa la lógica para crear una orden de PayPal aquí si es necesario
// const paypalClient = ...

/**
 * POST /api/checkout/init
 * Inicia el proceso de checkout. Llama al SP para validar el carrito,
 * crear la orden en estado 'pendiente_pago', y luego crea un PaymentIntent
 * de Stripe o una Order de PayPal.
 */
export async function POST(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) {
      return errorHandler(new Error('Acceso denegado. Se requiere autenticación.'), 401);
    }

    const sessionId = getSessionId(req);
    const body = await req.json();

    const orderInput = {
        userId: session.dbId,
        sessionId,
        ...body,
        currency: body.currency || 'MXN',
    };
    
    const { orderId, total } = await orderService.initializeCheckout(orderInput);
    
    let stripeClientSecret: string | null = null;
    let stripePaymentIntentId: string | null = null;
    let payPalOrderId: string | null = null;

    if (body.gateway === 'stripe') {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(total * 100), // Stripe usa centavos
        currency: 'mxn',
        metadata: {
          order_id: orderId,
          user_id: session.dbId,
        },
      });
      stripeClientSecret = paymentIntent.client_secret;
      stripePaymentIntentId = paymentIntent.id;

      // Aquí deberías actualizar tu tabla de `payments` con el paymentIntent.id
      // await paymentRepository.updateIntentId(orderId, paymentIntent.id);

    } else if (body.gateway === 'paypal') {
      // Lógica para crear una orden de PayPal
      // const payPalOrder = await createPayPalOrder(total);
      // payPalOrderId = payPalOrder.id;
      // await paymentRepository.updateIntentId(orderId, payPalOrder.id);
    }
    
    return successResponse({ 
      orderId, 
      total, 
      stripeClientSecret,
      stripePaymentIntentId,
      payPalOrderId 
    }, 201);

  } catch (error) {
    if (error instanceof ZodError) {
      return errorHandler(error, 400);
    }
    console.error('[API_CHECKOUT_INIT_ERROR]', error);
    return errorHandler(error);
  }
}
