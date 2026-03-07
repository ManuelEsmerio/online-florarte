

import type { OrderStatus } from '@/lib/definitions';
import type { OrderEmailPayload } from './types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TemplateProps {
  userName: string;
  order: OrderEmailPayload;
  newStatus: OrderStatus;
  updatedAt: Date;
}

const statusDetails: Record<OrderStatus, { title: string; message: string; accent: string; bg: string }> = {
  PENDING: {
    title: 'Pedido recibido',
    message: 'Estamos validando el pago y preparando tu orden para comenzar la producción.',
    accent: '#fbbf24',
    bg: 'rgba(251,191,36,0.12)',
  },
  PROCESSING: {
    title: 'Tu pedido está en preparación',
    message: 'Nuestro taller floral está elaborando tu arreglo. Te avisaremos antes de salir a ruta.',
    accent: '#6366f1',
    bg: 'rgba(99,102,241,0.12)',
  },
  SHIPPED: {
    title: '¡Tu pedido va en camino!',
    message: 'El repartidor salió con tu pedido y se dirige al destino acordado.',
    accent: '#0ea5e9',
    bg: 'rgba(14,165,233,0.12)',
  },
  DELIVERED: {
    title: 'Pedido entregado',
    message: 'Confirmamos que la entrega se realizó con éxito. Gracias por confiar en Florarte.',
    accent: '#22c55e',
    bg: 'rgba(34,197,94,0.12)',
  },
  CANCELLED: {
    title: 'Pedido cancelado',
    message: 'El pedido fue cancelado según tu solicitud. Si procede un reembolso, lo verás reflejado pronto.',
    accent: '#ef4444',
    bg: 'rgba(239,68,68,0.12)',
  },
  PAYMENT_FAILED: {
    title: 'Pago no procesado',
    message: 'No pudimos procesar tu pago. Puedes intentarlo de nuevo o contactar a soporte.',
    accent: '#ef4444',
    bg: 'rgba(239,68,68,0.12)',
  },
  EXPIRED: {
    title: 'Pedido expirado',
    message: 'Tu pedido expiró porque no se completó el pago a tiempo. Crea un nuevo pedido cuando lo desees.',
    accent: '#94a3b8',
    bg: 'rgba(148,163,184,0.12)',
  },
};

const formatDateTime = (value: Date) => format(value, "PPP 'a las' p", { locale: es });
const formatCurrency = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://floreriaflorarte.com';

export const renderOrderStatusUpdateTemplate = ({ userName, order, newStatus, updatedAt }: TemplateProps): string => {
  const details = statusDetails[newStatus];
  if (!details) return '';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Actualización de estado · ${order.code}</title>
  <style>
    body { margin:0; padding:0; background:#f4f4f5; font-family:'Segoe UI', Arial, sans-serif; color:#0f172a; }
    .wrapper { padding:32px 12px; }
    .card { max-width:620px; margin:0 auto; border-radius:28px; overflow:hidden; background:#fff; box-shadow:0 15px 45px rgba(15,23,42,0.15); }
    .hero { padding:28px; text-align:center; }
    .badge { display:inline-flex; align-items:center; gap:8px; padding:6px 16px; border-radius:999px; font-weight:600; letter-spacing:0.5px; }
    .hero h1 { margin:16px 0 6px; font-size:26px; }
    .hero p { margin:0; color:#475569; }
    .content { padding:0 32px 32px; }
    .info-box { background:#f8fafc; border-radius:20px; padding:20px; margin-top:20px; }
    .info-box h3 { margin:0 0 10px; font-size:14px; letter-spacing:0.4px; color:#64748b; text-transform:uppercase; }
    .info-box p { margin:6px 0; color:#0f172a; font-size:14px; }
    .totals { margin-top:16px; font-size:15px; color:#475569; }
    .totals p { margin:4px 0; }
    .cta { margin:28px 0 0; text-align:center; }
    .cta a { display:inline-block; background:#0f172a; color:#fff; padding:14px 32px; text-decoration:none; border-radius:999px; font-weight:600; }
    .footer { text-align:center; padding:20px; font-size:12px; color:#94a3b8; border-top:1px solid #e2e8f0; }
    @media (max-width:640px) {
      .card { border-radius:0; }
      .content { padding:0 20px 24px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="hero" style="background:${details.bg};">
        <div class="badge" style="color:${details.accent};background:#fff;">${newStatus}</div>
        <h1>${details.title}</h1>
        <p>Actualizado el ${formatDateTime(updatedAt)}</p>
      </div>
      <div class="content">
        <p style="margin:24px 0 0;color:#475569;">Hola ${userName},</p>
        <p style="margin:8px 0 20px;color:#475569;">${details.message}</p>

        <div class="info-box">
          <h3>Resumen del pedido</h3>
          <p><strong>Orden:</strong> ${order.code}</p>
          <p><strong>Entrega:</strong> ${order.deliveryDate ? format(order.deliveryDate, 'PPP', { locale: es }) : 'Por confirmar'} · ${order.deliveryTimeSlot || 'Horario por confirmar'}</p>
          <p><strong>Destinatario:</strong> ${order.address.recipientName || order.customerName}</p>
          <p><strong>Dirección:</strong> ${order.address.line1 || 'Por confirmar'}</p>
        </div>

        <div class="info-box">
          <h3>Estado y monto</h3>
          <p><strong>Estado actual:</strong> ${details.title}</p>
          <div class="totals">
            <p>Subtotal: ${formatCurrency(order.subtotal)}</p>
            ${order.couponDiscount > 0 ? `<p>Descuento: -${formatCurrency(order.couponDiscount)}</p>` : ''}
            <p>Envío: ${formatCurrency(order.shippingCost)}</p>
            <p><strong>Total: ${formatCurrency(order.total)}</strong></p>
          </div>
        </div>

        <div class="cta">
          <a href="${siteUrl}/orders">Ver seguimiento completo</a>
        </div>
      </div>
      <div class="footer">
        Florería Florarte · ${siteUrl}
      </div>
    </div>
  </div>
</body>
</html>
  `;
};
