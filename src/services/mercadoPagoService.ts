import { Preference } from 'mercadopago';
import { mercadopago } from '@/lib/mercadopago';
import type { CreateCheckoutParams, CheckoutResult, PaymentProvider } from '@/lib/payment/types';

export const mercadoPagoService: PaymentProvider = {
  async createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutResult> {
    const preference = new Preference(mercadopago);

    // Preferencia con campos mínimos para aislar errores de política de MP.
    // TODO (producción): Reactivar back_urls, auto_return, external_reference y notification_url
    // una vez que las credenciales de producción estén configuradas.
    const response = await preference.create({
      body: {
        items: [
          {
            id: String(params.orderId),
            title: `Pedido #${String(params.orderId).padStart(4, '0')}`,
            description: 'Pago de pedido Florarte',
            quantity: 1,
            unit_price: params.amount,
            currency_id: 'MXN',
          },
        ],
        back_urls: {
          success: params.successUrl,
          failure: params.cancelUrl,
          pending: params.pendingUrl ?? params.successUrl,
        },
        auto_return: 'approved',
        external_reference: String(params.orderId),
        ...(params.notificationUrl && { notification_url: params.notificationUrl }),
      },
    });

    return {
      checkoutUrl: response.init_point!,
      externalSessionId: response.id!,
    };
  },
};
