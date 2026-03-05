import type { RefundParams, RefundResult, RefundProvider } from './types';
import { stripeService } from '@/services/stripeService';
import { mercadopago } from '@/lib/mercadopago';

/** Stripe adapter */
const stripeRefundProvider: RefundProvider = {
  async createRefund(params: RefundParams): Promise<RefundResult> {
    const refund = await stripeService.createRefund({
      paymentIntentId: params.externalPaymentId,
      ...(params.amount !== undefined && { amount: Math.round(params.amount * 100) }),
    });
    return {
      externalRefundId: refund.id,
      status: refund.status ?? 'pending',
      amount: (refund.amount ?? 0) / 100,
    };
  },
};

/** Mercado Pago adapter */
const mpRefundProvider: RefundProvider = {
  async createRefund(params: RefundParams): Promise<RefundResult> {
    const { Refund } = await import('mercadopago');
    const refundApi = new Refund(mercadopago);

    const body: Record<string, unknown> = {};
    if (params.amount !== undefined) {
      body.amount = params.amount;
    }

    const result = await refundApi.create({
      payment_id: Number(params.externalPaymentId),
      body: body as any,
    });

    return {
      externalRefundId: String(result.id),
      status: result.status ?? 'pending',
      amount: Number(result.amount ?? params.amount ?? 0),
    };
  },
};

/** Routes to the correct provider based on the gateway stored in PaymentTransaction. */
export function getRefundProvider(gateway: string): RefundProvider {
  const key = gateway.toLowerCase();
  if (key === 'mercadopago') return mpRefundProvider;
  return stripeRefundProvider; // default to Stripe
}
