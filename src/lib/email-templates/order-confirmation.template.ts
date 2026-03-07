

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { OrderEmailPayload, PaymentSummary } from './types';

interface TemplateProps {
  userName: string;
  order: OrderEmailPayload;
  payment: PaymentSummary;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

const formatDateSafe = (value: Date | null, fallback: string) => {
  if (!value) return fallback;
  return format(value as Date, 'PPP', { locale: es });
};

const formatDateTimeSafe = (value: Date | null, fallback: string) => {
  if (!value) return fallback;
  return format(value as Date, "PPP 'a las' p", { locale: es });
};

const formatTimeSlot = (value: string | null) => value?.trim() || 'Horario por confirmar';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://floreriaflorarte.com';

export const renderOrderConfirmationTemplate = ({ userName, order, payment }: TemplateProps): string => {
  const itemsHtml = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:0 0 16px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #f1f1f1;border-radius:18px;padding:16px;background:#faf9fb;">
              <tr>
                <td style="font-weight:600;color:#111111;font-size:15px;">${item.name}</td>
                <td style="text-align:right;font-weight:700;color:#FF2D78;font-size:15px;">${formatCurrency(item.subtotal)}</td>
              </tr>
              <tr>
                <td style="padding-top:4px;color:#6b6b6b;font-size:13px;">Cantidad: ${item.quantity}</td>
                <td style="padding-top:4px;text-align:right;color:#6b6b6b;font-size:13px;">${formatCurrency(item.unitPrice)} c/u</td>
              </tr>
            </table>
          </td>
        </tr>
      `,
    )
    .join('');

  const discountRow = order.couponDiscount > 0
    ? `<p style="margin:4px 0;color:#059669;">Descuento cupón: <strong>-${formatCurrency(order.couponDiscount)}</strong></p>`
    : '';

  const dedicationBlock = order.dedication
    ? `<div style="margin-top:24px;background:#fdf2f8;border-radius:12px;padding:16px;">
        <p style="margin:0 0 6px;font-weight:600;color:#be185d;">Dedicatoria</p>
        <p style="margin:0;color:#6b7280;">${order.dedication}</p>
        <p style="margin:12px 0 0;font-size:13px;color:#9ca3af;">
          Firma: ${order.isAnonymous ? 'Anónimo' : order.signature || 'N/A'}
        </p>
      </div>`
    : '';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Confirmación de pedido ${order.code}</title>
  <style>
    body { margin:0; padding:0; background:#F3F4F6; font-family:'Public Sans','Segoe UI',Arial,sans-serif; color:#101828; }
    .wrapper { width:100%; padding:32px 12px; box-sizing:border-box; }
    .card { max-width:640px; margin:0 auto; background:#ffffff; border-radius:32px; overflow:hidden; box-shadow:0 25px 60px rgba(15,23,42,0.18); }
    .hero { background:#0f0f0f; padding:42px 24px 36px; text-align:center; position:relative; }
    .hero::after { content:''; position:absolute; inset:0; opacity:0.18; background-image:radial-gradient(#ffffff 1px, transparent 1px); background-size:24px 24px; }
    .hero-content { position:relative; z-index:2; }
    .hero-pill { display:inline-block; padding:14px 20px; border-radius:999px; background:#ffffff12; border:1px solid rgba(255,255,255,0.2); margin-bottom:20px; }
    .hero-pill span { font-size:12px; letter-spacing:0.35em; font-weight:600; color:#ffffff; text-transform:uppercase; }
    .hero h1 { margin:0; font-size:28px; color:#ffffff; }
    .hero p { margin:12px 0 0; color:rgba(255,255,255,0.75); font-size:15px; }
    .content { padding:36px 40px; }
    .status-card { display:flex; gap:16px; padding:16px 20px; border-radius:18px; background:#FFE4EF; border:1px solid #FFD2E4; color:#9B1C54; align-items:flex-start; }
    .status-icon { width:36px; height:36px; border-radius:12px; background:#FF2D78; color:#ffffff; font-weight:700; display:flex; align-items:center; justify-content:center; font-size:18px; }
    .section-title { font-size:16px; font-weight:700; margin:32px 0 14px; color:#0f172a; letter-spacing:0.08em; text-transform:uppercase; }
    .details-table { width:100%; border-collapse:collapse; border:1px solid #f0f0f0; border-radius:20px; overflow:hidden; }
    .details-table tr { border-bottom:1px solid #f2f2f2; }
    .details-table td { padding:14px 18px; font-size:14px; }
    .details-table td:first-child { color:#98A2B3; font-weight:600; width:45%; }
    .pill-small { display:inline-block; padding:6px 14px; border-radius:999px; background:#F4F1FF; color:#5B21B6; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.12em; }
    .stack { width:100%; }
    .stack td { width:50%; }
    .summary-box { border:1px solid #f0f0f0; border-radius:20px; padding:18px 20px; background:#fafafa; }
    .summary-box h3 { margin:0 0 10px; font-size:13px; letter-spacing:0.18em; color:#98A2B3; text-transform:uppercase; }
    .summary-box p { margin:6px 0; font-size:14px; color:#0f172a; }
    .items-wrapper { margin:12px 0 0; }
    .totals { border-top:1px dashed #e4e4e7; margin-top:12px; padding-top:16px; text-align:right; }
    .totals p { margin:4px 0; color:#475467; font-size:14px; }
    .totals strong { font-size:22px; color:#FF2D78; }
    .cta { margin:40px 0 10px; text-align:center; }
    .cta a { display:inline-block; background:#FF2D78; color:#ffffff; text-decoration:none; font-weight:700; padding:16px 44px; border-radius:999px; box-shadow:0 18px 35px rgba(255,45,120,0.35); }
    .footer { background:#F7F7F9; padding:28px 18px 36px; text-align:center; color:#98A2B3; font-size:12px; }
    .footer-links a { color:#B0B0C0; text-decoration:none; margin:0 8px; font-size:12px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; }
    @media (max-width:640px) {
      .content { padding:28px 22px; }
      .stack td { display:block; width:100%; }
      .summary-box { margin-bottom:16px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="hero">
        <div class="hero-content">
          <div class="hero-pill"><span>Pedido ${order.code}</span></div>
          <h1>¡Gracias por tu compra, ${userName}!</h1>
          <p>Tu pedido está en manos de nuestros expertos floristas.</p>
        </div>
      </div>
      <div class="content">
        <div class="status-card">
          <div class="status-icon">✓</div>
          <div>
            <p style="margin:0;font-size:13px;letter-spacing:0.28em;text-transform:uppercase;font-weight:700;">${payment.status || 'Confirmado'}</p>
            <p style="margin:6px 0 0;font-size:13px;color:#7A1740;">Hemos recibido tu pedido y pronto comenzaremos la preparación.</p>
          </div>
        </div>

        <p class="section-title">Detalles de tu pedido</p>
        <table class="details-table">
          <tr>
            <td>Número de orden</td>
            <td style="font-family:'Courier New',monospace;font-weight:700;color:#111827;">${order.code}</td>
          </tr>
          <tr>
            <td>Fecha de compra</td>
            <td>${formatDateTimeSafe(order.createdAt, 'Por confirmar')}</td>
          </tr>
          <tr>
            <td>Entrega programada</td>
            <td><span class="pill-small">${formatDateSafe(order.deliveryDate, 'Fecha por confirmar')}</span> · ${formatTimeSlot(order.deliveryTimeSlot)}</td>
          </tr>
          <tr>
            <td>Destinatario</td>
            <td>${order.address.recipientName || order.customerName}</td>
          </tr>
        </table>

        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" class="stack" style="margin-top:28px;">
          <tr>
            <td style="padding-right:12px;">
              <div class="summary-box">
                <h3>Pago</h3>
                <p><strong>Método:</strong> ${payment.method}</p>
                <p><strong>Estatus:</strong> ${payment.status}</p>
                ${payment.reference ? `<p><strong>Referencia:</strong> ${payment.reference}</p>` : ''}
                <p><strong>Procesado:</strong> ${formatDateTimeSafe(payment.processedAt ?? order.createdAt, 'En validación')}</p>
              </div>
            </td>
            <td style="padding-left:12px;">
              <div class="summary-box">
                <h3>Entrega</h3>
                <p>${order.address.line1 || 'Dirección por confirmar'}</p>
                ${order.address.recipientPhone ? `<p>Teléfono: ${order.address.recipientPhone}</p>` : ''}
                ${order.address.referenceNotes ? `<p>Referencias: ${order.address.referenceNotes}</p>` : ''}
                ${order.deliveryNotes ? `<p>Notas: ${order.deliveryNotes}</p>` : ''}
              </div>
            </td>
          </tr>
        </table>

        ${dedicationBlock}

        <p class="section-title">Resumen de productos</p>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" class="items-wrapper">
          ${itemsHtml || `<tr><td style="padding:18px;text-align:center;color:#9ca3af;border:1px dashed #e4e4e7;border-radius:18px;">Sin artículos registrados</td></tr>`}
        </table>

        <div class="totals">
          <p>Subtotal: ${formatCurrency(order.subtotal)}</p>
          ${discountRow}
          <p>Envío: ${formatCurrency(order.shippingCost)}</p>
          <p style="margin-top:10px;"><strong>Total pagado ${formatCurrency(order.total)}</strong></p>
        </div>

        <div class="cta">
          <a href="${siteUrl}/orders">Rastrear mi pedido</a>
        </div>
        <p style="text-align:center;color:#9ca3af;font-size:13px;margin:0 0 12px;">¿Tienes alguna duda? Escríbenos a <a href="mailto:soporte@florarte.com" style="color:#FF2D78;text-decoration:none;">soporte@florarte.com</a></p>
      </div>
      <div class="footer">
        <div class="footer-links">
          <a href="${siteUrl}">Sitio</a>
          <a href="${siteUrl}/privacy">Privacidad</a>
          <a href="${siteUrl}/contacto">Contacto</a>
        </div>
        <p style="margin:18px 0 6px;letter-spacing:0.24em;text-transform:uppercase;">Florarte © ${new Date().getFullYear()} • Arte en cada pétalo</p>
        <p style="margin:0;color:#B0B0C0;font-size:11px;line-height:1.6;">Recibiste este correo porque realizaste una compra en Florarte. Calle de las Flores 123, Guadalajara, Jalisco.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};
