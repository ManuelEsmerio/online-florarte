import type { AdminOrderDetailsDTO } from '@/lib/definitions';
import { formatTimeSlotForUI } from '@/lib/utils';

const orderStatusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  PROCESSING: 'En proceso',
  SHIPPED: 'En reparto',
  DELIVERED: 'Completado',
  CANCELLED: 'Cancelado',
};

const paymentStatusLabels: Record<string, string> = {
  SUCCEEDED: 'Pagado',
  COMPLETED: 'Pagado',
  PROCESSING: 'En validación',
  PENDING: 'Pendiente',
  FAILED: 'Rechazado',
  CANCELED: 'Cancelado',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
};

const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '$0.00';
  }
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(Number(value));
};

const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
};

const formatDate = (value: string | null | undefined): string => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(parsed);
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export const printMonochromeOrderTicket = (order: AdminOrderDetailsDTO): void => {
  if (typeof window === 'undefined') return;
  const ticketWindow = window.open('', '_blank', 'width=420,height=780');
  if (!ticketWindow) return;

  const orderNumber = `ORD#${String(order.id).padStart(4, '0')}`;
  const createdAt = formatDateTime(order.createdAt);
  const deliveryDate = formatDate(order.deliveryDate);
  const deliverySlot = formatTimeSlotForUI(order.deliveryTimeSlot ?? '');
  const statusKey = String(order.status ?? 'PENDING').toUpperCase();
  const paymentStatusKey = String(order.paymentStatus ?? 'PENDING').toUpperCase();
  const statusLabel = orderStatusLabels[statusKey] ?? statusKey;
  const paymentStatusLabel = paymentStatusLabels[paymentStatusKey] ?? paymentStatusKey;

  const itemsRows = (order.items ?? [])
    .map(item => {
      const name = escapeHtml(item.productNameSnap ?? 'Producto');
      const variant = item.variantNameSnap ? `<div class="muted">${escapeHtml(item.variantNameSnap)}</div>` : '';
      const quantity = Number(item.quantity ?? 0);
      const lineTotal = Number(item.unitPrice ?? 0) * quantity;
      return `
        <tr>
          <td>
            <div class="item-name">${name}</div>
            ${variant}
          </td>
          <td class="qty">x${quantity}</td>
          <td class="price">${formatCurrency(lineTotal)}</td>
        </tr>
      `;
    })
    .join('');

  const html = `
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>${orderNumber} · Ticket</title>
        <style>
          @page { size: 80mm auto; margin: 6mm; }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: 'IBM Plex Mono', 'SFMono-Regular', 'Courier New', monospace;
            font-size: 12px;
            margin: 0;
            padding: 0;
            color: #0a0a0a;
            background: #ffffff;
          }
          .ticket {
            width: 68mm;
            margin: 0 auto;
            padding: 4mm 0;
          }
          h1, h2, h3, p {
            margin: 0;
          }
          .brand {
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            font-size: 11px;
            margin-bottom: 6px;
            font-weight: 600;
          }
          .headline {
            text-align: center;
            font-size: 15px;
            font-weight: 700;
            margin-bottom: 2px;
          }
          .order-number {
            text-align: center;
            font-size: 13px;
            margin-bottom: 8px;
          }
          .section-title {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            margin: 10px 0 4px;
            border-top: 1px solid #000;
            padding-top: 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          td {
            padding: 4px 0;
            vertical-align: top;
          }
          .item-name {
            font-weight: 600;
          }
          .muted {
            color: #3d3d3d;
            font-size: 10px;
          }
          .qty {
            width: 32px;
            text-align: right;
          }
          .price {
            width: 70px;
            text-align: right;
          }
          .divider {
            border-top: 1px dashed #000;
            margin: 8px 0;
          }
          .totals {
            width: 100%;
            margin-top: 8px;
          }
          .totals-row {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            padding: 2px 0;
          }
          .totals-row--grand {
            font-size: 14px;
            font-weight: 700;
            border-top: 1px solid #000;
            margin-top: 6px;
            padding-top: 6px;
          }
          .meta {
            font-size: 11px;
            line-height: 1.5;
          }
          .note {
            text-align: center;
            font-size: 10px;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <main class="ticket">
          <p class="brand">Florarte</p>
          <p class="headline">Ticket de Venta</p>
          <p class="order-number">${escapeHtml(orderNumber)}</p>
          <p class="meta">Emitido: ${escapeHtml(createdAt)}</p>
          <p class="meta">Estado: ${escapeHtml(statusLabel)}</p>
          <p class="meta">Pago: ${escapeHtml(paymentStatusLabel)}</p>
          <div class="section-title">Cliente</div>
          <p class="meta">${escapeHtml(order.customerName || 'Cliente invitado')}</p>
          <p class="meta">${escapeHtml(order.customerEmail || '—')}</p>
          <div class="section-title">Entrega</div>
          <p class="meta">${escapeHtml(deliveryDate)}</p>
          <p class="meta">${escapeHtml(deliverySlot || 'Horario por confirmar')}</p>
          <p class="meta">${escapeHtml(order.shippingAddress || 'Dirección pendiente')}</p>
          <div class="section-title">Artículos</div>
          <table>
            ${itemsRows || '<tr><td colspan="3">Sin artículos.</td></tr>'}
          </table>
          <div class="divider"></div>
          <div class="totals">
            <div class="totals-row"><span>Subtotal</span><span>${formatCurrency(order.subtotal)}</span></div>
            <div class="totals-row"><span>Descuento</span><span>-${formatCurrency(order.couponDiscount)}</span></div>
            <div class="totals-row"><span>Envío</span><span>${formatCurrency(order.shippingCost)}</span></div>
            <div class="totals-row totals-row--grand"><span>Total</span><span>${formatCurrency(order.total)}</span></div>
          </div>
          <p class="note">Gracias por tu compra</p>
        </main>
        <script>
          window.onload = function () {
            setTimeout(() => {
              window.print();
            }, 150);
          };
        </script>
      </body>
    </html>
  `;

  ticketWindow.document.open();
  ticketWindow.document.write(html);
  ticketWindow.document.close();
};
