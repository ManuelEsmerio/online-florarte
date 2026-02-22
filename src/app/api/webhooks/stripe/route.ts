// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { orderService } from '@/services/orderService';
import { errorHandler, successResponse } from '@/utils/api-utils';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// Deshabilitar el bodyParser por defecto de Next.js para este endpoint,
// ya que Stripe necesita el raw body para verificar la firma.
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Lee el stream de la petición y lo convierte a un Buffer.
 * @param req La petición NextRequest.
 * @returns Un Buffer con el cuerpo raw de la petición.
 */
async function streamToBuffer(req: NextRequest): Promise<Buffer> {
    const reader = req.body!.getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
    }

    return Buffer.concat(chunks);
}


export async function POST(req: NextRequest) {
  const buf = await streamToBuffer(req);
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error('Stripe webhook secret or signature missing.');
    return errorHandler(new Error('Falta la firma de Stripe o el secreto del webhook.'), 400);
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Error en la verificación del webhook: ${err.message}`);
    return errorHandler(new Error(`Error en la verificación del webhook: ${err.message}`), 400);
  }
  
  try {
    let result;
    
    // Lógica para manejar diferentes tipos de eventos
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntentSucceeded = event.data.object;
        const orderIdSuccess = paymentIntentSucceeded.metadata.order_id;
        
        if (!orderIdSuccess) {
            throw new Error(`Webhook Error: Falta order_id en metadata para el PaymentIntent ${paymentIntentSucceeded.id}`);
        }
        
        console.log(`Procesando payment_intent.succeeded para order_id: ${orderIdSuccess}`);

        // Llamar a sp_Checkout_Run para finalizar la orden
        result = await orderService.finalizeOrderFromWebhook({
          gateway: 'stripe',
          orderId: parseInt(orderIdSuccess, 10),
          transactionId: paymentIntentSucceeded.id,
          status: 'exitoso',
          amountCaptured: paymentIntentSucceeded.amount_received, // Stripe lo da en centavos
          currency: paymentIntentSucceeded.currency,
          rawEvent: JSON.stringify(event),
        });
        break;

      case 'payment_intent.payment_failed':
        const paymentIntentFailed = event.data.object;
        const orderIdFailed = paymentIntentFailed.metadata.order_id;
        
        if (!orderIdFailed) {
            console.warn(`Webhook Warning: Falta order_id en metadata para el PaymentIntent fallido ${paymentIntentFailed.id}`);
            // Aún así respondemos 200 para que Stripe no reintente.
            return successResponse({ received: true, message: "Evento de fallo sin order_id ignorado." });
        }
        
        console.log(`Procesando payment_intent.payment_failed para order_id: ${orderIdFailed}`);

        // Llamar a sp_Checkout_Run para registrar el fallo
        result = await orderService.finalizeOrderFromWebhook({
          gateway: 'stripe',
          orderId: parseInt(orderIdFailed, 10),
          transactionId: paymentIntentFailed.id,
          status: 'fallido',
          amountCaptured: 0,
          currency: paymentIntentFailed.currency,
          rawEvent: JSON.stringify(event),
        });
        break;
      
      default:
        console.log(`Evento de webhook no manejado: ${event.type}`);
    }
    
    return successResponse({ received: true, ...result });

  } catch (error: any) {
      // Devolver un error 500 para que Stripe reintente el webhook si hay un error de procesamiento.
      console.error(`Error procesando webhook ${event.id}:`, error.message);
      return errorHandler(error, 500);
  }
}

