

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { OrderEmailPayload, PaymentSummary } from './types';

interface TemplateProps {
  userName: string;
  order: OrderEmailPayload;
  payment: PaymentSummary;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

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
  const normalizedPaymentStatus = (payment.status ?? '').toLowerCase();
  const paymentStatusLabel = payment.status || 'Pagado';
  const paymentStatusDescription = normalizedPaymentStatus.includes('pend')
    ? 'Estamos validando tu pago y te avisaremos en cuanto esté confirmado.'
    : normalizedPaymentStatus.includes('fall')
      ? 'Hubo un problema con el pago. Si ya lo resolviste, ignora este mensaje; de lo contrario contáctanos para ayudarte.'
      : normalizedPaymentStatus.includes('cancel')
        ? 'Este pedido fue cancelado. Si necesitas más información, estamos para ayudarte.'
        : 'Hemos recibido tu pedido y pronto comenzaremos la preparación.';

  const itemsHtml = order.items.length
    ? order.items
        .map((item) => {
          const safeName = escapeHtml(item.name);
          const fallbackInitial = escapeHtml((item.name?.trim()?.charAt(0) || '#').toUpperCase());
          const variantLine = item.variantName
            ? `<p style="margin:4px 0 0;font-size:13px;color:#94a3b8;">${escapeHtml(item.variantName)}</p>`
            : '';
          const imageBlock = item.imageUrl
            ? `<img src="${item.imageUrl}" alt="Imagen de ${safeName}" width="96" height="96" style="display:block;width:96px;height:96px;border-radius:20px;object-fit:cover;background:#f5f5f5;" />`
            : `<div style="width:96px;height:96px;border-radius:20px;background:#f3f4f6;color:#ec4899;font-weight:700;font-size:26px;display:flex;align-items:center;justify-content:center;">${fallbackInitial}</div>`;

          return `
          <tr>
            <td style="padding:0 0 18px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #f1f1f3;border-radius:24px;background:#fdfbff;padding:16px;">
                <tr>
                  <td width="110" style="vertical-align:top;">
                    ${imageBlock}
                  </td>
                  <td style="padding-left:16px;vertical-align:top;">
                    <p style="margin:0;font-size:15px;font-weight:600;color:#111827;">${safeName}</p>
                    ${variantLine}
                    <div style="margin-top:12px;display:flex;justify-content:space-between;align-items:center;">
                      <span style="font-size:13px;color:#64748b;">Cant: <strong>${item.quantity}</strong></span>
                      <span style="font-size:16px;font-weight:700;color:#ec4899;">${formatCurrency(item.subtotal)}</span>
                    </div>
                    <p style="margin:6px 0 0;font-size:12px;color:#94a3b8;">${formatCurrency(item.unitPrice)} c/u</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        `;
        })
        .join('')
    : `<tr><td style="padding:18px;text-align:center;color:#9ca3af;border:1px dashed #e4e4e7;border-radius:18px;">Sin artículos registrados</td></tr>`;

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
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    body { margin:0; padding:0; background:#f8f6f6; font-family:'Public Sans','Segoe UI',Arial,sans-serif; color:#0f172a; }
    .wrapper { width:100%; padding:32px 12px; box-sizing:border-box; background:#f8f6f6; }
    .card { max-width:640px; margin:0 auto; background:#ffffff; border-radius:36px; overflow:hidden; box-shadow:0 35px 80px rgba(15,23,42,0.25); }
    .hero { background:linear-gradient(135deg,#0f172a,#1b1033); padding:48px 24px; text-align:center; position:relative; }
    .hero::after { content:''; position:absolute; inset:0; opacity:0.18; background-image:radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px); background-size:22px 22px; }
    .hero-content { position:relative; z-index:2; }
    .hero-pill { display:inline-block; padding:14px 22px; border-radius:999px; background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.25); margin-bottom:18px; }
    .hero-pill span { font-size:11px; letter-spacing:0.38em; font-weight:600; color:#ffffff; text-transform:uppercase; }
    .hero h1 { margin:0; font-size:30px; color:#ffffff; }
    .hero p { margin:14px 0 0; color:rgba(255,255,255,0.8); font-size:15px; }
    .content { padding:40px 44px; }
    .status-card { display:flex; gap:18px; padding:18px 20px; border-radius:22px; background:#fff5f8; border:1px solid #ffd4e8; align-items:center; }
    .status-icon { width:52px; height:52px; border-radius:18px; background:linear-gradient(135deg,#ec5b13,#ff2d78); box-shadow:0 15px 30px rgba(236,91,19,0.25); display:flex; align-items:center; justify-content:center; }
    .status-icon svg { width:24px; height:24px; stroke:#ffffff; }
    .status-card h4 { margin:0; font-size:12px; letter-spacing:0.3em; text-transform:uppercase; color:#ec5b13; }
    .status-card p { margin:4px 0 0; font-size:13px; color:#7a1740; }
    .section-title { font-size:15px; font-weight:700; margin:32px 0 14px; color:#0f172a; letter-spacing:0.14em; text-transform:uppercase; }
    .details-table { width:100%; border-collapse:collapse; border:1px solid #f0f0f4; border-radius:26px; overflow:hidden; background:#fff; }
    .details-table tr { border-bottom:1px solid #f4f4f5; }
    .details-table td { padding:16px 20px; font-size:14px; }
    .details-table td:first-child { color:#94a3b8; font-weight:600; text-transform:uppercase; letter-spacing:0.08em; width:48%; }
    .pill-small { display:inline-block; padding:6px 14px; border-radius:999px; background:#f1e8ff; color:#6d28d9; font-size:11px; font-weight:600; letter-spacing:0.18em; text-transform:uppercase; }
    .stack { width:100%; }
    .stack td { width:50%; }
    .summary-box { border:1px solid #ececf2; border-radius:24px; padding:20px; background:#fbf9ff; }
    .summary-box h3 { margin:0 0 10px; font-size:12px; letter-spacing:0.2em; color:#98a2b3; text-transform:uppercase; }
    .summary-box p { margin:6px 0; font-size:14px; color:#0f172a; }
    .items-wrapper { margin:16px 0 0; }
    .totals { border-top:1px dashed #e4e4e7; margin-top:12px; padding-top:18px; text-align:right; }
    .totals p { margin:6px 0; color:#475467; font-size:14px; }
    .totals strong { font-size:22px; color:#ff2d78; }
    .cta { margin:42px 0 12px; text-align:center; }
    .cta a { display:inline-block; background:#ff2d78; color:#ffffff; text-decoration:none; font-weight:700; padding:16px 48px; border-radius:999px; box-shadow:0 22px 45px rgba(255,45,120,0.35); }
    .footer { background:#f3f0f4; padding:30px 20px 36px; text-align:center; color:#98a2b3; font-size:12px; }
    .footer-links a { color:#b0b0c0; text-decoration:none; margin:0 8px; font-size:12px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; }
    @media (max-width:640px) {
      .content { padding:28px 24px; }
      .stack td { display:block; width:100%; padding:0 !important; }
      .summary-box { margin-bottom:16px; }
      .status-card { flex-direction:column; align-items:flex-start; }
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
          <div class="status-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h4>${escapeHtml(paymentStatusLabel)}</h4>
            <p>${paymentStatusDescription}</p>
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
