

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
const formatDateSafe = (value: Date | null, fallback: string) => (value ? format(value, 'PPP', { locale: es }) : fallback);
const formatCurrency = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://floreriaflorarte.com').replace(/\/$/, '');
const logoUrl = `${siteUrl}/Logo_Flor.svg`;

export const renderOrderStatusUpdateTemplate = ({ userName, order, newStatus, updatedAt }: TemplateProps): string => {
  const details = statusDetails[newStatus];
  if (!details) return '';
  const firstItem = order.items?.[0];
  const firstItemPrice = firstItem ? formatCurrency(firstItem.subtotal) : null;
  const deliveryDateLabel = formatDateSafe(order.deliveryDate, 'Fecha por confirmar');
  const deliverySlot = order.deliveryTimeSlot || 'Horario por confirmar';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Actualización de estado · ${order.code}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap');
    body { margin:0; padding:0; background:#f4f5f7; font-family:'Public Sans','Segoe UI',Arial,sans-serif; color:#0f172a; }
    .wrapper { padding:32px 12px; }
    .card { max-width:640px; margin:0 auto; background:#ffffff; border-radius:32px; overflow:hidden; box-shadow:0 22px 60px rgba(15,23,42,0.18); }
    .header { display:flex; align-items:center; justify-content:space-between; padding:28px 32px; border-bottom:1px solid #f0f0f0; }
    .header img { width:120px; height:auto; }
    .hero { text-align:center; padding:36px 32px 12px; }
    .status-icon { width:80px; height:80px; border-radius:24px; margin:0 auto 18px; display:flex; align-items:center; justify-content:center; font-size:32px; font-weight:700; }
    .status-pill { display:inline-block; padding:6px 18px; border-radius:999px; font-size:12px; letter-spacing:0.18em; text-transform:uppercase; font-weight:600; }
    .content { padding:0 40px 40px; }
    .card-section { margin-top:28px; border:1px solid #f0f0f0; border-radius:22px; padding:22px; background:#fdfdff; }
    .card-section h3 { margin:0 0 14px; font-size:13px; letter-spacing:0.3em; color:#98a2b3; text-transform:uppercase; }
    .info-row { display:flex; justify-content:space-between; margin-bottom:12px; }
    .info-row span { font-size:14px; color:#475467; }
    .info-row strong { font-size:15px; color:#0f172a; }
    .product-card { margin-top:18px; border:1px solid #f0f0f0; border-radius:20px; padding:18px; display:flex; gap:16px; background:#fbfbfd; }
    .product-avatar { width:64px; height:64px; border-radius:18px; background:#ffe4ef; color:#ff2d78; font-weight:700; display:flex; align-items:center; justify-content:center; font-size:24px; }
    .totals { margin-top:20px; border-top:1px dashed #e2e2ea; padding-top:14px; text-align:right; }
    .totals p { margin:4px 0; font-size:14px; color:#475467; }
    .totals strong { font-size:22px; color:#ff2d78; }
    .cta { text-align:center; margin-top:32px; }
    .cta a { display:inline-block; background:#ff2d78; color:#ffffff; text-decoration:none; font-weight:700; padding:16px 46px; border-radius:999px; box-shadow:0 18px 32px rgba(255,45,120,0.35); }
    .footer { background:#f7f8fc; padding:24px 18px 32px; text-align:center; color:#98a2b3; font-size:12px; }
    .footer a { color:#b0b0c0; text-decoration:none; margin:0 8px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; font-size:12px; }
    @media (max-width:640px) {
      .content { padding:0 24px 32px; }
      .header { flex-direction:column; gap:12px; text-align:center; }
      .info-row { flex-direction:column; gap:4px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <img src="${logoUrl}" alt="Florarte" />
        <span style="font-weight:600;color:#94a3b8;letter-spacing:0.3em;text-transform:uppercase;font-size:11px;">${order.code}</span>
      </div>
      <div class="hero">
        <div class="status-icon" style="background:${details.bg};color:${details.accent};">
          ${newStatus === 'DELIVERED' ? '✓' : '⚘'}
        </div>
        <div class="status-pill" style="background:${details.bg};color:${details.accent};">${newStatus}</div>
        <h1 style="margin:14px 0 6px;font-size:28px;color:#0f172a;">${details.title}</h1>
        <p style="margin:0;color:#475467;">Hola ${userName}, ${details.message}</p>
        <p style="margin:6px 0 0;color:#98a2b3;font-size:13px;">Actualizado el ${formatDateTime(updatedAt)}</p>
      </div>
      <div class="content">
        <div class="card-section">
          <h3>Detalles de la orden</h3>
          <div class="info-row">
            <span>Número de pedido</span>
            <strong>${order.code}</strong>
          </div>
          <div class="info-row">
            <span>Entrega programada</span>
            <strong>${deliveryDateLabel} · ${deliverySlot}</strong>
          </div>
          <div class="info-row">
            <span>Destinatario</span>
            <strong>${order.address.recipientName || order.customerName}</strong>
          </div>
          <div class="info-row" style="margin-bottom:0;">
            <span>Dirección</span>
            <strong>${order.address.line1 || 'Por confirmar'}</strong>
          </div>
        </div>

        <div class="product-card">
          <div class="product-avatar">${firstItem ? firstItem.name.charAt(0).toUpperCase() : 'F'}</div>
          <div style="flex:1;text-align:left;">
            <p style="margin:0;font-weight:600;color:#0f172a;">${firstItem ? firstItem.name : 'Selecciona productos Florarte'}</p>
            <p style="margin:6px 0;color:#98a2b3;font-size:13px;">${firstItem ? `Cantidad: ${firstItem.quantity}` : 'Tu arreglo sigue en preparación.'}</p>
            ${firstItemPrice ? `<p style="margin:0;color:#ff2d78;font-weight:700;">${firstItemPrice}</p>` : ''}
          </div>
        </div>

        <div class="card-section" style="margin-top:24px; background:#ffffff;">
          <h3>Resumen de pago</h3>
          <div class="info-row"><span>Subtotal</span><strong>${formatCurrency(order.subtotal)}</strong></div>
          ${order.couponDiscount > 0 ? `<div class="info-row"><span>Descuento</span><strong>- ${formatCurrency(order.couponDiscount)}</strong></div>` : ''}
          <div class="info-row"><span>Envío</span><strong>${formatCurrency(order.shippingCost)}</strong></div>
          <div class="totals">
            <p style="margin:0;color:#98a2b3;font-size:13px;">Estado actual: ${details.title}</p>
            <strong>${formatCurrency(order.total)}</strong>
          </div>
        </div>

        <div class="cta">
          <a href="${siteUrl}/orders">Ver seguimiento completo</a>
        </div>
      </div>
      <div class="footer">
        <div style="margin-bottom:12px;">
          <a href="${siteUrl}">Sitio</a>
          <a href="${siteUrl}/privacy">Privacidad</a>
          <a href="${siteUrl}/contacto">Soporte</a>
        </div>
        <p style="margin:0;color:#b0b4c3;font-size:11px;">© ${new Date().getFullYear()} Florarte · Este es un correo automático.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};
