import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { Payment } from 'mercadopago';
import { mercadopago } from '@/lib/mercadopago';
import { orderService } from '@/services/orderService';

export const runtime = 'nodejs';

function verifyWebhookSignature(
  xSignature: string,
  xRequestId: string,
  dataId: string,
  secret: string,
): boolean {
  // MP signature format: ts=<timestamp>,v1=<hash>
  const parts = xSignature.split(',');
  const tsPart = parts.find((p) => p.startsWith('ts='));
  const v1Part = parts.find((p) => p.startsWith('v1='));

  if (!tsPart || !v1Part) return false;

  const ts = tsPart.split('=')[1];
  const v1 = v1Part.split('=')[1];

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const expected = createHmac('sha256', secret).update(manifest).digest('hex');

  const expectedBuffer = Buffer.from(expected, 'hex');
  const signatureBuffer = Buffer.from(v1, 'hex');

  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, signatureBuffer);
}

export async function POST(req: Request) {
  const webhookSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;

  // En producción el secreto es OBLIGATORIO — sin él rechazamos todas las peticiones
  if (!webhookSecret && process.env.NODE_ENV === 'production') {
    console.error('[MERCADOPAGO_WEBHOOK] MERCADO_PAGO_WEBHOOK_SECRET no configurado en producción');
    return NextResponse.json({ error: 'Webhook not configured.' }, { status: 500 });
  }

  const xSignature = req.headers.get('x-signature') ?? '';
  const xRequestId = req.headers.get('x-request-id') ?? '';

  let body: { type?: string; data?: { id?: string }; topic?: string; resource?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const dataId = body?.data?.id ?? '';

  // Verificar firma cuando el secreto está disponible
  if (webhookSecret && dataId) {
    const isValid = verifyWebhookSignature(xSignature, xRequestId, dataId, webhookSecret);
    if (!isValid) {
      console.error('[MERCADOPAGO_WEBHOOK] Invalid signature');
      return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 });
    }
  }

  // Handle both "payment" topic and "payment" type
  const isPaymentEvent =
    body?.type === 'payment' || body?.topic === 'payment';

  if (!isPaymentEvent || !dataId) {
    // Acknowledge non-payment events without processing
    return NextResponse.json({ received: true });
  }

  try {
    const paymentClient = new Payment(mercadopago);
    const payment = await paymentClient.get({ id: dataId });

    const orderId = Number(payment.external_reference);
    const mpPaymentId = String(payment.id);
    const amount = payment.transaction_amount ?? 0;
    const status = payment.status; // 'approved' | 'rejected' | 'cancelled' | 'in_process' | 'pending' | ...

    if (!orderId || orderId <= 0) {
      console.warn('[MERCADOPAGO_WEBHOOK] Missing or invalid external_reference', { dataId });
      return NextResponse.json({ received: true });
    }

    if (status === 'approved') {
      await orderService.finalizeSuccessfulPaymentFromWebhook({
        orderId,
        externalPaymentId: mpPaymentId,
        gateway: 'mercadopago',
        amount,
      });
    } else if (status === 'rejected' || status === 'cancelled') {
      await orderService.registerFailedPaymentFromWebhook({
        orderId,
        externalPaymentId: mpPaymentId,
        gateway: 'mercadopago',
        amount,
      });
    } else {
      // in_process, pending — no DB update needed, payment still in flight
      console.info('[MERCADOPAGO_WEBHOOK] Payment in intermediate state', { orderId, status });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[MERCADOPAGO_WEBHOOK_HANDLER_ERROR]', error);
    return NextResponse.json({ error: 'Webhook handler failed.' }, { status: 500 });
  }
}
