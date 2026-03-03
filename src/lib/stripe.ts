import Stripe from 'stripe';

const globalForStripe = globalThis as unknown as {
  stripe?: Stripe;
};

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

export const stripe =
  globalForStripe.stripe ??
  new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-02-25.clover',
    typescript: true,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForStripe.stripe = stripe;
}
