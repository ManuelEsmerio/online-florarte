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

    return stripe.checkout.sessions.create({
      mode: 'payment',
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
