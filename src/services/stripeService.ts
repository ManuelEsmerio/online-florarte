import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';

export const stripeService = {
  async createCheckoutSession(params: {
    orderId: number;
    amountInCents: number;
    successUrl: string;
    cancelUrl: string;
    userId?: number;
    sessionId?: string | null;
  }) {
    const baseMetadata: Record<string, string> = {
      orderId: String(params.orderId),
    };
    if (params.userId) {
      baseMetadata.userId = String(params.userId);
    }
    if (params.sessionId) {
      baseMetadata.sessionId = String(params.sessionId);
    }

    // Expire the session after 30 minutes so Stripe fires checkout.session.expired
    // and we can clean up the order automatically via webhook.
    const expiresAt = Math.floor(Date.now() / 1000) + 30 * 60;

    return stripe.checkout.sessions.create({
      mode: 'payment',
      expires_at: expiresAt,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: `Pedido #${String(params.orderId).padStart(4, '0')}`,
              description: 'Pago de pedido Florarte',
            },
            unit_amount: params.amountInCents,
          },
          quantity: 1,
        },
      ],
      metadata: baseMetadata,
      payment_intent_data: {
        metadata: baseMetadata,
      },
    });
  },

  /**
   * Creates a full refund for a payment intent.
   * Stripe idempotency: passing the same payment_intent returns the same refund if already refunded.
   * @throws Will throw if Stripe returns an error other than "charge_already_refunded".
   */
  async createRefund(params: {
    paymentIntentId: string;
    /** Amount to refund in cents. Omit for full refund. */
    amount?: number;
    reason?: Stripe.RefundCreateParams.Reason;
  }): Promise<Stripe.Refund> {
    return stripe.refunds.create({
      payment_intent: params.paymentIntentId,
      ...(params.amount !== undefined && { amount: params.amount }),
      reason: params.reason ?? 'requested_by_customer',
    });
  },

  async createPaymentIntent(params: {
    orderId: number;
    amountInCents: number;
    userId?: number;
    sessionId?: string | null;
  }) {
    const metadata: Record<string, string> = {
      orderId: String(params.orderId),
    };
    if (params.userId) {
      metadata.userId = String(params.userId);
    }
    if (params.sessionId) {
      metadata.sessionId = String(params.sessionId);
    }

    return stripe.paymentIntents.create({
      amount: params.amountInCents,
      currency: 'mxn',
      automatic_payment_methods: { enabled: true },
      metadata,
    });
  },
};
