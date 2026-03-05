import type { OrderEmailPayload } from './types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface RefundTemplateProps {
  userName: string;
  order: OrderEmailPayload;
  refunded: boolean; // false = cancelled without payment; true = Stripe refund initiated
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://floreriaflorarte.com';
const supportUrl = `${siteUrl}/customer-service`;

export function renderRefundNotificationTemplate({ userName, order, refunded }: RefundTemplateProps): string {
  const title = refunded ? 'Tu reembolso está en proceso' : 'Tu pedido fue cancelado';
  const subtitle = refunded
    ? 'Hemos iniciado el reembolso al método de pago original.'
    : 'Tu pedido fue cancelado correctamente. No se realizó ningún cargo.';
  const accent = '#ef4444';
  const bg = 'rgba(239,68,68,0.10)';

  const refundBlock = refunded
    ? `
      <div style="background:#f0fdf4;border-radius:16px;padding:20px;margin-top:20px;border-left:4px solid #22c55e;">
        <p style="margin:0 0 6px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#15803d;">
          Información del reembolso
        </p>
        <p style="margin:4px 0;font-size:14px;color:#166534;">
          El monto de <strong>${formatCurrency(order.total)}</strong> será devuelto al método de pago original.
        </p>
        <p style="margin:4px 0;font-size:14px;color:#166534;">
          El proceso puede tardar entre <strong>5 y 12 días hábiles</strong> dependiendo de tu institución bancaria.
        </p>
      </div>`
    : `
      <div style="background:#f8fafc;border-radius:16px;padding:20px;margin-top:20px;">
        <p style="margin:0;font-size:14px;color:#475569;">
          No se realizó ningún cargo a tu método de pago ya que el pedido no había sido pagado.
        </p>
      </div>`;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} · ${order.code}</title>
  <style>
    body { margin:0; padding:0; background:#f4f4f5; font-family:'Segoe UI', Arial, sans-serif; color:#0f172a; }
    .wrapper { padding:32px 12px; }
    .card { max-width:620px; margin:0 auto; border-radius:28px; overflow:hidden; background:#fff; box-shadow:0 15px 45px rgba(15,23,42,0.15); }
    .hero { padding:32px; text-align:center; background:${bg}; }
    .hero-icon { display:inline-flex; align-items:center; justify-content:center; width:56px; height:56px; border-radius:50%; background:#fff; margin-bottom:16px; }
    .hero h1 { margin:0 0 8px; font-size:24px; color:#0f172a; }
    .hero p { margin:0; color:#475569; font-size:15px; }
    .content { padding:28px 32px 36px; }
    .info-box { background:#f8fafc; border-radius:16px; padding:20px; margin-top:20px; }
    .info-box h3 { margin:0 0 10px; font-size:12px; letter-spacing:0.5px; color:#64748b; text-transform:uppercase; font-weight:700; }
    .info-box p { margin:4px 0; color:#0f172a; font-size:14px; }
    .cta { margin:28px 0 0; text-align:center; }
    .cta a { display:inline-block; background:#0f172a; color:#fff; padding:14px 32px; text-decoration:none; border-radius:999px; font-weight:700; font-size:14px; }
    .footer { text-align:center; padding:20px; font-size:12px; color:#94a3b8; border-top:1px solid #e2e8f0; }
    @media (max-width:640px) {
      .card { border-radius:0; }
      .content { padding:20px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="hero">
        <div class="hero-icon">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="${accent}" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 5.636A9 9 0 1 1 5.636 18.364 9 9 0 0 1 18.364 5.636zM9 9l6 6m0-6L9 15"/>
          </svg>
        </div>
        <h1>${title}</h1>
        <p>${subtitle}</p>
      </div>

      <div class="content">
        <p style="margin:0 0 4px;color:#475569;">Hola <strong>${userName}</strong>,</p>
        <p style="margin:0 0 16px;color:#475569;font-size:15px;">
          ${
            refunded
              ? 'Hemos recibido tu solicitud de cancelación y tu reembolso ya está en proceso. A continuación encontrarás el resumen del pedido cancelado.'
              : 'Tu pedido fue cancelado correctamente. Como no se había realizado ningún pago, no se generará ningún reembolso.'
          }
        </p>

        ${refundBlock}

        <div class="info-box" style="margin-top:20px;">
          <h3>Resumen del pedido cancelado</h3>
          <p><strong>Orden:</strong> ${order.code}</p>
          <p><strong>Fecha de entrega programada:</strong> ${order.deliveryDate ? format(order.deliveryDate, 'PPP', { locale: es }) : 'No especificada'}</p>
          <p><strong>Destinatario:</strong> ${order.address.recipientName ?? order.customerName}</p>
          <p><strong>Dirección:</strong> ${order.address.line1 ?? 'No especificada'}</p>
        </div>

        <div class="info-box" style="margin-top:16px;">
          <h3>Desglose de pago</h3>
          <p>Subtotal: ${formatCurrency(order.subtotal)}</p>
          ${order.couponDiscount > 0 ? `<p>Descuento: -${formatCurrency(order.couponDiscount)}</p>` : ''}
          <p>Envío: ${formatCurrency(order.shippingCost)}</p>
          <p><strong>Total cancelado: ${formatCurrency(order.total)}</strong></p>
        </div>

        ${
          refunded
            ? `<p style="margin:20px 0 0;font-size:13px;color:#94a3b8;text-align:center;">
                Si el reembolso tarda más de 12 días hábiles, contacta a nuestro equipo de soporte.
               </p>`
            : ''
        }

        <div class="cta">
          <a href="${supportUrl}">Contactar soporte</a>
        </div>
      </div>

      <div class="footer">Florería Florarte · <a href="${siteUrl}" style="color:#94a3b8;">${siteUrl}</a></div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
