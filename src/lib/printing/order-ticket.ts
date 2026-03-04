import type { AdminOrderDetailsDTO } from '@/lib/definitions';
import { formatTimeSlotForUI } from '@/lib/utils';

const statusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  PROCESSING: 'En proceso',
  SHIPPED: 'En camino',
  DELIVERED: 'Completado',
  CANCELLED: 'Cancelado',
};

const paymentStatusLabels: Record<string, string> = {
  SUCCEEDED: 'Pagado',
  COMPLETED: 'Pagado',
  PENDING: 'Pago pendiente',
  PROCESSING: 'Pago en validación',
  FAILED: 'Pago rechazado',
  CANCELED: 'Pago cancelado',
  CANCELLED: 'Pago cancelado',
  REFUNDED: 'Pago reembolsado',
};

const gatewayLabels: Record<string, string> = {
  stripe: 'Stripe',
  mercadopago: 'Mercado Pago',
  mercado_pago: 'Mercado Pago',
  'mercado-pago': 'Mercado Pago',
  mp: 'Mercado Pago',
  paypal: 'PayPal',
  openpay: 'Openpay',
  conekta: 'Conekta',
  transferencia: 'Transferencia bancaria',
  transfer: 'Transferencia bancaria',
  bank_transfer: 'Transferencia bancaria',
  cash: 'Efectivo',
  efectivo: 'Efectivo',
};

const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return 'N/A';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#039;');

const formatDateEs = (value: string | null | undefined): string => {
  if (!value) return 'N/A';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
};

const formatDateOnlyEs = (value: string | null | undefined): string => {
  if (!value) return 'N/A';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(parsed);
};

const toAbsoluteAssetUrl = (value: string | null | undefined, origin: string): string | null => {
  const raw = String(value ?? '').trim();
  if (!raw) return null;

  if (/^data:/i.test(raw)) return raw;

  const normalized = raw.replace(/\\/g, '/');
  if (/^https?:\/\//i.test(normalized)) return normalized;

  const path = normalized.startsWith('/') ? normalized : `/${normalized}`;
  return `${origin}${path}`;
};

export const printOrderTicket = (order: AdminOrderDetailsDTO): void => {
  if (typeof window === 'undefined') return;

  const ticketWindow = window.open('', '_blank', 'width=980,height=760');
  if (!ticketWindow) return;
  const baseOrigin = window.location.origin;

  const safeOrderNumber = `ORD${String(order.id).padStart(4, '0')}`;
  const statusLabel = statusLabels[String(order.status ?? '').toUpperCase()] ?? String(order.status ?? 'N/A');
  const createdAtLabel = formatDateEs(order.createdAt);
  const deliveryDateLabel = formatDateOnlyEs(order.deliveryDate);
  const deliveryTimeSlotLabel = formatTimeSlotForUI(order.deliveryTimeSlot);
  const normalizedGateway = String(order.paymentGateway ?? '').trim().toLowerCase();
  const paymentPlatformLabel = normalizedGateway
    ? gatewayLabels[normalizedGateway] ?? 'Otra plataforma'
    : 'N/A';
  const hasPaymentRecord = Boolean((order as any)?.hasPaymentTransaction ?? (order as any)?.has_payment_transaction ?? false);
  const paymentStatusRaw = String(order.paymentStatus ?? (order as any)?.payment_status ?? '').trim().toUpperCase();
  const paymentStatusLabel = paymentStatusRaw
    ? paymentStatusLabels[paymentStatusRaw] ?? paymentStatusRaw
    : hasPaymentRecord
      ? 'Pago registrado'
      : 'Sin registro';
  const deliveryNotesLabel = (order.deliveryNotes ?? '').trim() || 'Sin notas';

  const itemsRows = (order.items ?? [])
    .map((item) => {
      const productName = escapeHtml(item.productNameSnap || 'Producto');
      const variant = item.variantNameSnap ? `<div class=\"variant\">${escapeHtml(item.variantNameSnap)}</div>` : '';
      const imageUrl = toAbsoluteAssetUrl(item.imageSnap ?? null, baseOrigin);
      const image = imageUrl
        ? `<img src=\"${escapeHtml(imageUrl)}\" alt=\"${productName}\" class=\"thumb\" />`
        : '<div class=\"thumb thumb-fallback\">Sin imagen</div>';

      return `
        <tr>
          <td>
            <div class=\"product-cell\">${image}<div>${productName}${variant}</div></div>
          </td>
          <td class=\"num\">${item.quantity}</td>
          <td class=\"num\">${formatCurrency(item.unitPrice)}</td>
          <td class=\"num\">${formatCurrency(item.unitPrice * item.quantity)}</td>
        </tr>
      `;
    })
    .join('');

  const html = `
    <!doctype html>
    <html lang=\"es\">
      <head>
        <meta charset=\"UTF-8\" />
        <title>Ticket ${safeOrderNumber}</title>
        <style>
          @page { size: A4; margin: 14mm; }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
            color: #0f172a;
            background: #f1f5f9;
          }
          h1, h2, h3, p { margin: 0; }
          .sheet {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 24px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 16px;
            margin-bottom: 20px;
            padding-bottom: 14px;
            border-bottom: 1px solid #e2e8f0;
          }
          .brand {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: .12em;
            color: #6b7280;
            margin-bottom: 6px;
            font-weight: 700;
          }
          .brand-row {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 6px;
          }
          .logo {
            width: 110px;
            height: auto;
            object-fit: contain;
          }
          .title {
            font-size: 26px;
            font-weight: 800;
            line-height: 1.15;
            color: #111827;
          }
          .order-id {
            font-size: 14px;
            font-weight: 700;
            color: #4b5563;
            margin-top: 6px;
          }
          .meta { margin-top: 10px; display: grid; gap: 4px; }
          .muted { color: #64748b; font-size: 12px; }
          .status-chip {
            display: inline-flex;
            align-items: center;
            border-radius: 999px;
            padding: 8px 12px;
            background: #dbeafe;
            border: 1px solid #93c5fd;
            color: #1d4ed8;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: .06em;
          }
          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
            margin-bottom: 18px;
          }
          .card {
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 14px;
            background: #fff;
          }
          .card h3 {
            font-size: 11px;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: .09em;
            color: #334155;
            font-weight: 800;
          }
          .card p {
            font-size: 13px;
            margin-bottom: 7px;
            line-height: 1.45;
            color: #1f2937;
          }
          .products-title {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: .09em;
            color: #334155;
            font-weight: 800;
            margin-bottom: 10px;
          }
          table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin-top: 8px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
          }
          th, td {
            padding: 11px;
            font-size: 12.5px;
            text-align: left;
            vertical-align: top;
            border-bottom: 1px solid #e5e7eb;
          }
          tbody tr:last-child td { border-bottom: none; }
          th {
            background: #e2e8f0;
            color: #334155;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: .03em;
            font-size: 11px;
          }
          .product-cell { display: flex; align-items: center; gap: 10px; min-width: 220px; }
          .thumb { width: 56px; height: 56px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e7eb; }
          .thumb-fallback { display: flex; align-items: center; justify-content: center; font-size: 10px; color: #6b7280; background: #f3f4f6; }
          .variant { color: #64748b; font-size: 11px; margin-top: 3px; }
          .num { text-align: right; white-space: nowrap; }
          .totals {
            margin-top: 14px;
            margin-left: auto;
            width: 320px;
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            padding: 10px 12px;
            background: #eef2ff;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            border-bottom: 1px dashed #cbd5e1;
            padding: 7px 0;
            font-size: 13px;
          }
          .total-row:last-child { border-bottom: none; }
          .grand-total { font-size: 19px; font-weight: 800; color: #0f172a; }
          .footer-note {
            margin-top: 16px;
            font-size: 11px;
            color: #64748b;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
          }
          @media print {
            body { background: #fff; }
            .sheet { border: none; border-radius: 0; padding: 0; }
          }
        </style>
      </head>
      <body>
        <main class=\"sheet\">
          <div class=\"header\">
            <div>
              <div class=\"brand-row\">
                <img src=\"${escapeHtml(`${baseOrigin}/logo_completo.svg`)}\" alt=\"Florarte\" class=\"logo\" />
                <p class=\"brand\">Florarte · Comprobante de Pedido</p>
              </div>
              <h1 class=\"title\">Ticket de compra</h1>
              <p class=\"order-id\">${safeOrderNumber}</p>
              <div class=\"meta\">
                <p class=\"muted\">Fecha de creación: ${escapeHtml(createdAtLabel)}</p>
                <p class=\"muted\">Cliente: ${escapeHtml(order.customerName || 'N/A')}</p>
                <p class=\"muted\">Plataforma de pago: ${escapeHtml(paymentPlatformLabel)}</p>
                <p class="muted">Estatus de pago: ${escapeHtml(paymentStatusLabel)}</p>
              </div>
            </div>
            <div class=\"status-chip\">${escapeHtml(statusLabel)}</div>
          </div>

          <div class=\"grid\">
            <section class=\"card\">
              <h3>Datos del cliente</h3>
              <p><strong>Nombre:</strong> ${escapeHtml(order.customerName || 'N/A')}</p>
              <p><strong>Email:</strong> ${escapeHtml(order.customerEmail || 'N/A')}</p>
              <p><strong>Teléfono:</strong> ${escapeHtml(order.customerPhone || 'N/A')}</p>
            </section>

            <section class=\"card\">
              <h3>Datos de entrega</h3>
              <p><strong>Dirigido a:</strong> ${escapeHtml(order.recipientName || order.customerName || 'N/A')}</p>
              <p><strong>Teléfono receptor:</strong> ${escapeHtml(order.recipientPhone || order.customerPhone || 'N/A')}</p>
              <p><strong>Dirección:</strong> ${escapeHtml(order.shippingAddress || 'N/A')}</p>
              <p><strong>Fecha:</strong> ${escapeHtml(deliveryDateLabel)}</p>
              <p><strong>Horario:</strong> ${escapeHtml(deliveryTimeSlotLabel || 'N/A')}</p>
              <p><strong>Notas:</strong> ${escapeHtml(deliveryNotesLabel)}</p>
            </section>
          </div>

          <section class=\"card\">
            <h3 class=\"products-title\">Productos</h3>
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th class=\"num\">Cantidad</th>
                  <th class=\"num\">Precio unitario</th>
                  <th class=\"num\">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows || '<tr><td colspan=\"4\">No hay productos.</td></tr>'}
              </tbody>
            </table>

            <div class=\"totals\">
              <div class=\"total-row\"><span>Subtotal</span><span>${formatCurrency(order.subtotal)}</span></div>
              <div class=\"total-row\"><span>Descuento</span><span>-${formatCurrency(order.couponDiscount)}</span></div>
              <div class=\"total-row\"><span>Envío</span><span>${formatCurrency(order.shippingCost)}</span></div>
              <div class=\"total-row grand-total\"><span>Total</span><span>${formatCurrency(order.total)}</span></div>
            </div>
          </section>

          <p class=\"footer-note\">Gracias por tu compra · Florarte</p>
        </main>

        <script>
          (function () {
            const waitForImages = async () => {
              const images = Array.from(document.images || []);
              await Promise.all(images.map((img) => {
                if (img.complete) return Promise.resolve();
                return new Promise((resolve) => {
                  img.onload = () => resolve();
                  img.onerror = () => resolve();
                });
              }));
            };

            window.onload = async function () {
              await waitForImages();
              setTimeout(() => window.print(), 120);
            };
          })();
        </script>
      </body>
    </html>
  `;

  ticketWindow.document.open();
  ticketWindow.document.write(html);
  ticketWindow.document.close();
};
