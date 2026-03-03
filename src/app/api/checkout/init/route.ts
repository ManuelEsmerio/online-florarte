
// src/app/api/checkout/init/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession } from '@/utils/auth';
import { getSessionId } from '@/utils/session';
import { orderService } from '@/services/orderService';
import Stripe from 'stripe';
import { ZodError } from 'zod';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
  typescript: true,
});


/**
 * POST /api/checkout/init
 * Inicia el proceso de checkout. Llama al SP para validar el carrito,
 * crear la orden en estado 'pendiente_pago', y luego crea un PaymentIntent
 * de Stripe.
 */
export async function POST(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    const sessionId = getSessionId(req);
    if (!session?.dbId && !sessionId) {
      return errorHandler(new Error('No se pudo identificar la sesión para checkout.'), 401);
    }

    const body = await req.json();

    const orderInput = {
        userId: session?.dbId ?? null,
        sessionId,
        ...body,
        gateway: 'stripe',
        currency: 'mxn',
    };
    
    // 1. Llama al SP para validar y crear la orden preliminar
    const { orderId, total, orderToken } = await orderService.initializeCheckout(orderInput);
    
    if(!orderId || !total || !orderToken) {
        throw new Error("No se pudo inicializar la orden en la base de datos.");
    }
    
    // 2. Crea un PaymentIntent en Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: total, // El SP debe devolverlo en centavos
      currency: 'mxn',
      automatic_payment_methods: { enabled: true },
      metadata: {
        order_id: orderId,
        order_token: orderToken, // Para trazabilidad
        ...(session?.dbId ? { user_id: session.dbId } : {}),
      }
    }, {
      idempotencyKey: `pi_init_${orderToken}`,
    });
    
    // 3. Responde solo con el clientSecret y el orderId
    return successResponse({ 
      clientSecret: paymentIntent.client_secret,
      orderId: orderId,
    }, 201);

  } catch (error) {
    if (error instanceof ZodError) {
      return errorHandler(error, 400);
    }
    // Si el SP lanza un error de stock/validación, puede que el servicio lo propague.
    if (error instanceof Error && error.message.includes("inventario")) {
        return errorHandler(error, 409); // 409 Conflict
    }
    console.error('[API_CHECKOUT_INIT_ERROR]', error);
    return errorHandler(error);
  }
}
