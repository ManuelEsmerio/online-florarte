

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { OrderEmailPayload, PaymentSummary } from './types';

interface TemplateProps {
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

const adminBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://floreriaflorarte.com';

export const renderNewOrderNotificationTemplate = ({ order, payment }: TemplateProps): string => {
  const adminUrl = `${adminBaseUrl}/admin/orders/${order.id}`;
  const discountRow = order.couponDiscount > 0
    ? `<p style="margin:4px 0;color:#16a34a;">Descuento: -${formatCurrency(order.couponDiscount)}</p>`
    : '';

  const itemsHtml = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px;border-bottom:1px solid #e5e7eb;">${item.name}</td>
          <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
          <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCurrency(item.subtotal)}</td>
        </tr>
      `,
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Nuevo pedido ${order.code}</title>
  <style>
    body { margin:0; padding:0; background:#0f172a; font-family:'Segoe UI', Arial, sans-serif; color:#0f172a; }
    .wrapper { padding:32px 12px; }
    .card { max-width:720px; margin:0 auto; background:#ffffff; border-radius:28px; overflow:hidden; box-shadow:0 20px 60px rgba(15, 23, 42, 0.5); }
    .hero { background:#0f172a; color:#fff; padding:32px; }
    .hero h1 { margin:0; font-size:28px; }
    .hero p { margin:8px 0 0; color:rgba(255,255,255,0.65); }
    .status-pill { display:inline-flex; padding:6px 16px; border-radius:999px; background:rgba(255,255,255,0.12); font-size:13px; margin-bottom:12px; letter-spacing:0.6px; }
    .content { padding:32px; }
    .grid { display:table; width:100%; border-spacing:20px 0; }
    .grid > div { display:table-cell; width:50%; background:#f9fafb; border-radius:20px; padding:20px; vertical-align:top; }
    .grid h3 { margin:0 0 10px; font-size:14px; letter-spacing:0.5px; color:#6b7280; text-transform:uppercase; }
    .grid p { margin:4px 0; font-size:14px; color:#111827; }
    .items-table { width:100%; border-collapse:collapse; margin-top:16px; border-radius:18px; overflow:hidden; border:1px solid #e5e7eb; }
    .items-table th { background:#f3f4f6; padding:12px; text-align:left; font-size:13px; color:#6b7280; letter-spacing:0.5px; text-transform:uppercase; }
    .totals { text-align:right; margin-top:18px; font-size:15px; }
    .totals p { margin:4px 0; }
    .totals strong { font-size:20px; }
    .cta { margin:32px 0 0; text-align:center; }
    .cta a { display:inline-block; background:#0f172a; color:#fff; padding:15px 36px; border-radius:999px; text-decoration:none; font-weight:600; letter-spacing:0.4px; }
    .footer { background:#0f172a; color:rgba(255,255,255,0.6); text-align:center; font-size:12px; padding:18px; }
    @media (max-width:720px) {
      .card { border-radius:0; }
      .grid { display:block; }
      .grid > div { display:block; width:100%; margin-bottom:16px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="hero">
        <div class="status-pill">Nueva orden confirmada</div>
        <h1>${order.code}</h1>
        <p>Generado el ${formatDateTimeSafe(order.createdAt, 'Por confirmar')}</p>
      </div>
      <div class="content">
        <div class="grid">
          <div>
            <h3>Cliente</h3>
            <p><strong>${order.customerName}</strong></p>
            <p>Email: ${order.customerEmail || 'N/A'}</p>
            ${order.customerPhone ? `<p>Tel: ${order.customerPhone}</p>` : ''}
            <p>Pago: ${payment.method} · ${payment.status}</p>
            ${payment.reference ? `<p>Ref: ${payment.reference}</p>` : ''}
            <p>Procesado: ${formatDateTimeSafe(payment.processedAt ?? order.createdAt, 'Pendiente')}</p>
          </div>
          <div>
            <h3>Envío</h3>
            <p>${order.address.recipientName || '—'} · ${order.address.recipientPhone || 'Sin teléfono'}</p>
            <p>${order.address.line1 || 'Dirección por confirmar'}</p>
            <p>Entrega: ${formatDateSafe(order.deliveryDate, 'Fecha por confirmar')} · ${order.deliveryTimeSlot || 'Horario por confirmar'}</p>
            ${order.address.referenceNotes ? `<p>Referencias: ${order.address.referenceNotes}</p>` : ''}
            ${order.dedication ? `<p>Dedicatoria: ${order.dedication}</p>` : ''}
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cant.</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml || '<tr><td colspan="3" style="padding:16px;text-align:center;color:#9ca3af;">Sin artículos</td></tr>'}
          </tbody>
        </table>

        <div class="totals">
          <p>Subtotal: ${formatCurrency(order.subtotal)}</p>
          ${discountRow}
          <p>Envío: ${formatCurrency(order.shippingCost)}</p>
          <p><strong>Total: ${formatCurrency(order.total)}</strong></p>
        </div>

        <div class="cta">
          <a href="${adminUrl}">Revisar pedido en el panel</a>
        </div>
      </div>
      <div class="footer">
        Florería Florarte · Notificación automática · ${adminBaseUrl}
      </div>
    </div>
  </div>
</body>
</html>
  `;
};
