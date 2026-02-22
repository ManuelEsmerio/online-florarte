// src/app/api/webhooks/paypal/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { orderService } from '@/services/orderService';
import { errorHandler, successResponse } from '@/utils/api-utils';

async function verifyPayPalWebhookSignature(req: NextRequest): Promise<boolean> {
  // Esta función es compleja y requiere la librería de PayPal o una implementación manual
  // que valide la cadena de certificados. Por ahora, devolvemos true en desarrollo.
  // En producción, ESTO DEBE SER IMPLEMENTADO CORRECTAMENTE.
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  // TODO: Implementar la verificación de la firma del webhook de PayPal en producción
  // 1. Obtener los headers: PAYPAL_AUTH_ALGO, PAYPAL_CERT_URL, PAYPAL_TRANSMISSION_ID, PAYPAL_TRANSMISSION_SIG, PAYPAL_TRANSMISSION_TIME
  // 2. Obtener el webhook ID de tu configuración de PayPal.
  // 3. Construir el 'expected_signature' con: transmission_id | transmission_time | webhook_id | CRC32(body)
  // 4. Descargar y validar el certificado de PAYPAL_CERT_URL.
  // 5. Usar la clave pública del certificado para verificar que PAYPAL_TRANSMISSION_SIG es una firma válida de 'expected_signature'.
  return false;
}

export async function POST(req: NextRequest) {
  const isVerified = await verifyPayPalWebhookSignature(req);
  if (!isVerified) {
    return errorHandler(new Error('Firma de webhook de PayPal no válida.'), 401);
  }

  const event = await req.json();

  try {
    let result;
    // El evento principal a escuchar es PAYMENT.CAPTURE.COMPLETED
    if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const capture = event.resource;
      const orderId = capture.custom_id; // Asumimos que guardamos nuestro order_id aquí
      
      result = await orderService.finalizeOrderFromWebhook({
        gateway: 'paypal',
        intentId: orderId, // El ID de la orden de PayPal
        transactionId: capture.id, // El ID de la captura
        status: 'exitoso',
        amountCaptured: parseFloat(capture.amount.value),
        currency: capture.amount.currency_code,
        rawEvent: JSON.stringify(event),
      });

    } else if (event.event_type === 'PAYMENT.CAPTURE.DENIED') {
        const capture = event.resource;
        const orderId = capture.custom_id;

         result = await orderService.finalizeOrderFromWebhook({
            gateway: 'paypal',
            intentId: orderId,
            transactionId: capture.id,
            status: 'fallido',
            amountCaptured: 0,
            currency: capture.amount.currency_code,
            rawEvent: JSON.stringify(event),
        });
    }

    return successResponse({ received: true, ...result });

  } catch (error: any) {
    return errorHandler(error);
  }
}
