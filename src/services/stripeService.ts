import { stripe } from '@/lib/stripe';

export const stripeService = {
  async createCheckoutSession(params: {
    orderId: number;
    amountInCents: number;
    successUrl: string;
    cancelUrl: string;
    userId: number;
  }) {
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
      metadata: {
        orderId: String(params.orderId),
        userId: String(params.userId),
      },
      payment_intent_data: {
        metadata: {
          orderId: String(params.orderId),
          userId: String(params.userId),
        },
      },
    });
  },

  async createPaymentIntent(params: {
    orderId: number;
    amountInCents: number;
    userId: number;
  }) {
    return stripe.paymentIntents.create({
      amount: params.amountInCents,
      currency: 'mxn',
      automatic_payment_methods: { enabled: true },
      metadata: {
        orderId: String(params.orderId),
        userId: String(params.userId),
      },
    });
  },
};
