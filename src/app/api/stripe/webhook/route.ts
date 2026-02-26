import Stripe from 'stripe';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { orderService } from '@/services/orderService';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const requestHeaders = await headers();
  const signature = requestHeaders.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Webhook signature/config missing.' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json({ error: `Webhook Error: ${(error as Error).message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = Number(session.metadata?.orderId);
        const paymentIntentId =
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id;
        const amount = (session.amount_total ?? 0) / 100;

        if (orderId > 0 && paymentIntentId) {
          await orderService.finalizeSuccessfulPaymentFromWebhook({
            orderId,
            amount,
            externalPaymentId: paymentIntentId,
            gateway: 'stripe',
          });
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = Number(paymentIntent.metadata?.orderId);
        const amount = (paymentIntent.amount_received ?? paymentIntent.amount ?? 0) / 100;

        if (orderId > 0) {
          await orderService.finalizeSuccessfulPaymentFromWebhook({
            orderId,
            amount,
            externalPaymentId: paymentIntent.id,
            gateway: 'stripe',
          });
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = Number(paymentIntent.metadata?.orderId);
        const amount = (paymentIntent.amount ?? 0) / 100;

        if (orderId > 0) {
          await orderService.registerFailedPaymentFromWebhook({
            orderId,
            amount,
            externalPaymentId: paymentIntent.id,
            gateway: 'stripe',
          });
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[API_STRIPE_WEBHOOK_HANDLER_ERROR]', error);
    return NextResponse.json({ error: 'Webhook handler failed.' }, { status: 500 });
  }
}
