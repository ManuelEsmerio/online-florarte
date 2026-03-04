import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken } from '@/utils/auth';
import { getSessionId } from '@/utils/session';
import { prisma } from '@/lib/prisma';
import { orderService } from '@/services/orderService';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';
import { Payment } from 'mercadopago';
import { mercadopago } from '@/lib/mercadopago';

const paymentClient = new Payment(mercadopago);

type Gateway = 'stripe' | 'mercadopago';

type StripePayload = {
  gateway: 'stripe';
  orderId: number;
  sessionId: string;
};

type MercadoPagoPayload = {
  gateway: 'mercadopago';
  orderId: number;
  paymentId?: string;
  collectionId?: string;
};

type ReconcilePayload = StripePayload | MercadoPagoPayload;

async function assertOrderOwnership(orderId: number, userId?: number, sessionId?: string | null) {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      OR: [
        ...(userId ? [{ userId }] : []),
        ...(sessionId ? [{ sessionId }] : []),
      ],
    },
    select: { id: true },
  });

  if (!order) {
    throw new Error('Pedido no encontrado o sin autorización.');
  }
}

async function reconcileStripePayment(payload: StripePayload) {
  if (!payload.sessionId) {
    throw new Error('Falta el identificador de la sesión de Stripe.');
  }
  const checkoutSession = await stripe.checkout.sessions.retrieve(payload.sessionId, {
    expand: ['payment_intent'],
  });

  if (!checkoutSession || Number(checkoutSession.metadata?.orderId) !== payload.orderId) {
    throw new Error('La sesión de pago no coincide con el pedido.');
  }

  if (checkoutSession.payment_status !== 'paid') {
    return { reconciled: false, status: checkoutSession.payment_status };
  }

  let paymentIntent: Stripe.PaymentIntent | null = null;
  if (typeof checkoutSession.payment_intent === 'string') {
    paymentIntent = await stripe.paymentIntents.retrieve(checkoutSession.payment_intent);
  } else {
    paymentIntent = checkoutSession.payment_intent;
  }

  const externalPaymentId = paymentIntent?.id ?? (typeof checkoutSession.payment_intent === 'string' ? checkoutSession.payment_intent : null);
  if (!externalPaymentId) {
    throw new Error('No se pudo determinar el identificador del pago.');
  }

  const amountCents = checkoutSession.amount_total
    ?? paymentIntent?.amount_received
    ?? paymentIntent?.amount
    ?? 0;
  const amount = amountCents / 100;

  await orderService.finalizeSuccessfulPaymentFromWebhook({
    orderId: payload.orderId,
    externalPaymentId,
    gateway: 'stripe',
    amount,
  });

  return { reconciled: true, status: 'paid' as const };
}

async function reconcileMercadoPagoPayment(payload: MercadoPagoPayload) {
  const referenceId = payload.paymentId ?? payload.collectionId;
  if (!referenceId) {
    throw new Error('Falta el identificador del pago de Mercado Pago.');
  }

  const payment = await paymentClient.get({ id: referenceId });

  if (!payment || Number(payment.external_reference) !== payload.orderId) {
    throw new Error('El pago obtenido no corresponde al pedido.');
  }

  if (payment.status !== 'approved') {
    return { reconciled: false, status: payment.status };
  }

  await orderService.finalizeSuccessfulPaymentFromWebhook({
    orderId: payload.orderId,
    externalPaymentId: String(payment.id),
    gateway: 'mercadopago',
    amount: payment.transaction_amount ?? 0,
  });

  return { reconciled: true, status: payment.status };
}

export async function POST(req: NextRequest) {
  try {
    const session = await getDecodedToken(req);
    const sessionId = getSessionId(req);

    if (!session?.dbId && !sessionId) {
      return errorHandler(new Error('Debes iniciar sesión para validar el pago.'), 401);
    }

    const body = (await req.json()) as Partial<ReconcilePayload>;
    const orderId = Number(body.orderId);
    const gateway = String(body.gateway || '').toLowerCase() as Gateway;

    if (!Number.isFinite(orderId) || orderId <= 0) {
      return errorHandler(new Error('ID de pedido inválido.'), 400);
    }

    if (gateway !== 'stripe' && gateway !== 'mercadopago') {
      return errorHandler(new Error('Pasarela de pago desconocida.'), 400);
    }

    await assertOrderOwnership(orderId, session?.dbId, sessionId);

    const result = gateway === 'stripe'
      ? await reconcileStripePayment({
          gateway: 'stripe',
          orderId,
          sessionId: String(body.sessionId || '').trim(),
        })
      : await reconcileMercadoPagoPayment({
          gateway: 'mercadopago',
          orderId,
          paymentId: body.paymentId ? String(body.paymentId) : undefined,
          collectionId: body.collectionId ? String(body.collectionId) : undefined,
        });

    return successResponse(result);
  } catch (error) {
    console.error('[API_ORDER_RECONCILE_PAYMENT_ERROR]', error);
    return errorHandler(error);
  }
}
