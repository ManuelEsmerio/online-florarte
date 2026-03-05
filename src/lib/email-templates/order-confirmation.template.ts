

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
          <td style="padding:12px;border-bottom:1px solid #eee;">
            ${item.name}
          </td>
          <td style="padding:12px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
          <td style="padding:12px;border-bottom:1px solid #eee;text-align:right;">${formatCurrency(item.unitPrice)}</td>
          <td style="padding:12px;border-bottom:1px solid #eee;text-align:right;">${formatCurrency(item.subtotal)}</td>
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
    body { margin: 0; padding: 0; background: #f8f8f8; font-family: 'Segoe UI', Arial, sans-serif; color: #111827; }
    .wrapper { width: 100%; padding: 32px 12px; box-sizing: border-box; }
    .card { max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 28px; overflow: hidden; box-shadow: 0 15px 45px rgba(15, 23, 42, 0.10); }
    .hero { background: radial-gradient(circle at top, #f9a8d4, #c084fc); padding: 32px; text-align: center; color: #fff; }
    .hero h1 { margin: 0; font-size: 26px; letter-spacing: -0.5px; }
    .content { padding: 32px; }
    .info-grid { width: 100%; border-collapse: collapse; margin: 24px 0; border: 1px solid #f3f4f6; border-radius: 18px; overflow: hidden; }
    .info-grid td { padding: 14px 18px; font-size: 14px; border-bottom: 1px solid #f3f4f6; }
    .info-grid td:first-child { color: #6b7280; width: 38%; font-weight: 600; }
    .pill { display: inline-block; padding: 6px 14px; border-radius: 999px; background: rgba(255,255,255,0.16); font-weight: 600; letter-spacing: 0.4px; }
    .section-title { margin: 32px 0 12px; font-size: 16px; color: #111827; letter-spacing: 0.5px; text-transform: uppercase; }
    .stack { display: table; width: 100%; border-spacing: 18px 0; }
    .stack > div { display: table-cell; width: 50%; background: #f9fafb; padding: 18px; border-radius: 18px; vertical-align: top; }
    .stack h3 { margin: 0 0 8px; font-size: 14px; letter-spacing: 0.4px; color: #6b7280; text-transform: uppercase; }
    .stack p { margin: 4px 0; font-size: 14px; color: #111827; }
    .items-table { width: 100%; border-collapse: collapse; margin-top: 12px; border: 1px solid #f3f4f6; border-radius: 18px; overflow: hidden; }
    .items-table th { background: #f3f4f6; padding: 12px; text-align: left; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.4px; }
    .totals { text-align: right; margin-top: 18px; }
    .totals p { margin: 4px 0; font-size: 15px; color: #374151; }
    .totals strong { font-size: 20px; color: #111827; }
    .cta { margin: 36px 0 12px; text-align: center; }
    .cta a { display: inline-block; background: linear-gradient(135deg,#ec4899,#8b5cf6); color: #fff; padding: 15px 34px; border-radius: 999px; text-decoration: none; font-weight: 600; box-shadow: 0 10px 30px rgba(236, 72, 153, 0.35); }
    .footer { text-align: center; padding: 24px; font-size: 12px; color: #9ca3af; background: #f9fafb; }
    @media (max-width: 640px) {
      .card { border-radius: 0; }
      .content { padding: 24px; }
      .stack { display: block; }
      .stack > div { display: block; width: 100%; margin-bottom: 16px; }
      .info-grid td { display: block; width: 100%; box-sizing: border-box; }
      .info-grid td:first-child { border-bottom: none; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="hero">
        <span class="pill">Pedido ${order.code}</span>
        <h1>¡Gracias por tu compra, ${userName}!</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);">Confirmamos tu pedido y comenzamos la preparación.</p>
      </div>
      <div class="content">
        <p style="margin:0 0 12px;color:#4b5563;">Este es el resumen con toda la información importante de tu pedido.</p>

        <table class="info-grid">
          <tr>
            <td>Número de orden</td>
            <td>${order.code}</td>
          </tr>
          <tr>
            <td>Fecha de compra</td>
            <td>${formatDateTimeSafe(order.createdAt, 'Por confirmar')}</td>
          </tr>
          <tr>
            <td>Entrega programada</td>
            <td>${formatDateSafe(order.deliveryDate, 'Fecha por confirmar')} · ${formatTimeSlot(order.deliveryTimeSlot)}</td>
          </tr>
          <tr>
            <td>Destinatario</td>
            <td>${order.address.recipientName || order.customerName}</td>
          </tr>
        </table>

        <div class="stack">
          <div>
            <h3>Pago</h3>
            <p><strong>Método:</strong> ${payment.method}</p>
            <p><strong>Estatus:</strong> ${payment.status}</p>
            ${payment.reference ? `<p><strong>Referencia:</strong> ${payment.reference}</p>` : ''}
            <p><strong>Procesado:</strong> ${formatDateTimeSafe(payment.processedAt ?? order.createdAt, 'En validación')}</p>
          </div>
          <div>
            <h3>Envío</h3>
            <p>${order.address.line1 || 'Dirección por confirmar'}</p>
            ${order.address.recipientPhone ? `<p>Teléfono: ${order.address.recipientPhone}</p>` : ''}
            ${order.address.referenceNotes ? `<p>Referencias: ${order.address.referenceNotes}</p>` : ''}
            ${order.deliveryNotes ? `<p>Notas del pedido: ${order.deliveryNotes}</p>` : ''}
          </div>
        </div>

        ${dedicationBlock}

        <p class="section-title">Productos</p>
        <table class="items-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cant.</th>
              <th>Precio</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml || '<tr><td colspan="4" style="padding:16px;text-align:center;color:#9ca3af;">Sin artículos registrados</td></tr>'}
          </tbody>
        </table>

        <div class="totals">
          <p>Subtotal: ${formatCurrency(order.subtotal)}</p>
          ${discountRow}
          <p>Envío: ${formatCurrency(order.shippingCost)}</p>
          <p style="margin-top:8px;"><strong>Total: ${formatCurrency(order.total)}</strong></p>
        </div>

        <div class="cta">
          <a href="${siteUrl}/orders">Ver estado de mi pedido</a>
        </div>

        <p style="margin:0;color:#9ca3af;font-size:13px;text-align:center;">Si necesitas hacer cambios, responde a este correo o escríbenos vía WhatsApp.</p>
      </div>
      <div class="footer">
        © ${new Date().getFullYear()} Florería Florarte · Todos los derechos reservados · <a href="${siteUrl}" style="color:#ec4899;text-decoration:none;">${siteUrl}</a>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};
