// src/app/api/webhooks/paypal/route.ts
import { Buffer } from 'node:buffer';
import { NextRequest } from 'next/server';
import { orderService } from '@/services/orderService';
import { errorHandler, successResponse } from '@/utils/api-utils';

const PAYPAL_API_BASE = process.env.PAYPAL_API_BASE ?? (process.env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com');

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PAYPAL_CLIENT_ID o PAYPAL_CLIENT_SECRET no configurados.');
  }

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description ?? 'No se pudo obtener el token de PayPal.');
  }

  return data.access_token as string;
}

async function verifyPayPalWebhookSignature(headers: Headers, _rawBody: string, event: any): Promise<boolean> {
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    console.error('[PAYPAL_WEBHOOK] PAYPAL_WEBHOOK_ID no configurado.');
    return false;
  }

  const authAlgo = headers.get('paypal-auth-algo');
  const certUrl = headers.get('paypal-cert-url');
  const transmissionId = headers.get('paypal-transmission-id');
  const transmissionSig = headers.get('paypal-transmission-sig');
  const transmissionTime = headers.get('paypal-transmission-time');

  if (!authAlgo || !certUrl || !transmissionId || !transmissionSig || !transmissionTime) {
    return false;
  }

  const accessToken = await getPayPalAccessToken();

  const verificationResponse = await fetch(`${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_sig: transmissionSig,
      transmission_time: transmissionTime,
      webhook_id: webhookId,
      webhook_event: event,
    }),
  });

  const verificationData = await verificationResponse.json();
  if (!verificationResponse.ok) {
    console.error('[PAYPAL_WEBHOOK_VERIFY_ERROR]', verificationData);
    return false;
  }

  return verificationData.verification_status === 'SUCCESS';
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch (error) {
    return errorHandler(new Error('Formato de payload inválido.'), 400);
  }

  const isVerified = await verifyPayPalWebhookSignature(req.headers, rawBody, event);
  if (!isVerified) {
    return errorHandler(new Error('Firma de webhook de PayPal no válida.'), 401);
  }

  try {
    let result;
    // El evento principal a escuchar es PAYMENT.CAPTURE.COMPLETED
    if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const capture = event.resource;
      const orderId = Number(capture.custom_id);
      const amount = Number(capture.amount?.value ?? 0);

      if (!Number.isFinite(orderId) || orderId <= 0) {
        throw new Error('orderId inválido en el webhook de PayPal.');
      }

      await orderService.finalizeSuccessfulPaymentFromWebhook({
        orderId,
        externalPaymentId: capture.id,
        gateway: 'paypal',
        amount,
      });

      result = { success: true, orderId };

    } else if (event.event_type === 'PAYMENT.CAPTURE.DENIED') {
        const capture = event.resource;
        const orderId = Number(capture.custom_id);

        if (!Number.isFinite(orderId) || orderId <= 0) {
          throw new Error('orderId inválido en el webhook de PayPal.');
        }

        await orderService.registerFailedPaymentFromWebhook({
          orderId,
          externalPaymentId: capture.id,
          gateway: 'paypal',
          amount: 0,
        });

        result = { success: true, orderId };
    }

    return successResponse({ received: true, ...result });

  } catch (error: any) {
    return errorHandler(error);
  }
}
