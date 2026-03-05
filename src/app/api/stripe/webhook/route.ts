import Stripe from 'stripe';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
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

      // Fired when a charge is fully or partially refunded.
      // Used to sync Refund.status and recover from DB failures after stripe.refunds.create().
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const refunds = (charge.refunds as Stripe.ApiList<Stripe.Refund> | null)?.data ?? [];

        for (const refund of refunds) {
          const existingRefund = await prisma.refund.findUnique({
            where: { externalRefundId: refund.id },
            select: { id: true, status: true },
          });

          if (existingRefund) {
            // Update status if it changed (pending → succeeded)
            if (existingRefund.status !== refund.status) {
              await prisma.refund.update({
                where: { id: existingRefund.id },
                data: { status: refund.status },
              });
              console.info('[STRIPE_WEBHOOK] refund_status_updated', { stripeRefundId: refund.id, status: refund.status });
            }
          } else {
            // Refund exists in Stripe but not in DB — recover from partial DB failure.
            // Find the PaymentTransaction by the charge's payment_intent.
            const paymentIntentId = typeof charge.payment_intent === 'string'
              ? charge.payment_intent
              : charge.payment_intent?.id ?? null;

            if (paymentIntentId) {
              const paymentTx = await prisma.paymentTransaction.findUnique({
                where: { externalPaymentId: paymentIntentId },
                select: { id: true, orderId: true, amount: true },
              });

              if (paymentTx) {
                try {
                  await prisma.refund.create({
                    data: {
                      paymentTransactionId: paymentTx.id,
                      externalRefundId: refund.id,
                      amount: Number(refund.amount) / 100,
                      status: refund.status,
                      reason: refund.reason ?? 'requested_by_customer',
                    },
                  });
                  await prisma.paymentTransaction.update({
                    where: { id: paymentTx.id },
                    data: { status: 'CANCELED' },
                  });
                  await prisma.order.update({
                    where: { id: paymentTx.orderId },
                    data: { status: 'CANCELLED' },
                  });
                  console.info('[STRIPE_WEBHOOK] refund_db_recovery', {
                    orderId: paymentTx.orderId,
                    externalRefundId: refund.id,
                  });
                } catch (recoveryError: any) {
                  // P2002 = unique constraint (concurrent webhook) — safe to ignore
                  if (recoveryError?.code !== 'P2002') {
                    console.error('[STRIPE_WEBHOOK] refund_recovery_error', recoveryError);
                  }
                }
              }
            }
          }
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
