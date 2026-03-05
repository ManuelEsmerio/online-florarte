import { MercadoPagoConfig } from 'mercadopago';

if (!process.env.MERCADO_PAGO_ACCESS_TOKEN && process.env.NODE_ENV === 'production') {
  throw new Error('[env] MERCADO_PAGO_ACCESS_TOKEN is required in production');
}

const globalForMercadoPago = globalThis as unknown as { mp: MercadoPagoConfig };

export const mercadopago =
  globalForMercadoPago.mp ??
  new MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
  });

if (process.env.NODE_ENV !== 'production') globalForMercadoPago.mp = mercadopago;
