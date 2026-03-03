import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

type OrderWithRelations = {
  id: number;
  status: string;
  subtotal: any;
  shippingCost: any;
  total: any;
  deliveryDate: Date;
  deliveryTimeSlot: string;
  dedication: string | null;
  isAnonymous: boolean;
  signature: string | null;
  createdAt: Date;
  guestName: string | null;
  guestEmail: string | null;
  user: { name: string; email: string } | null;
  orderAddress: {
    recipientName: string;
    recipientPhone: string | null;
    formattedAddress: string;
    referenceNotes: string | null;
  } | null;
  items: Array<{
    productNameSnap: string;
    quantity: number;
    unitPrice: any;
  }>;
  paymentTransactions: Array<{
    status: string;
    gateway: string;
    externalPaymentId: string;
    amount: any;
    createdAt: Date;
  }>;
};

async function getOrderWithRelations(orderId: number): Promise<OrderWithRelations | null> {
  return (await (prisma as any).order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { name: true, email: true } },
      orderAddress: {
        select: {
          recipientName: true,
          recipientPhone: true,
          formattedAddress: true,
          referenceNotes: true,
        },
      },
      items: {
        select: {
          productNameSnap: true,
          quantity: true,
          unitPrice: true,
        },
      },
      paymentTransactions: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          status: true,
          gateway: true,
          externalPaymentId: true,
          amount: true,
          createdAt: true,
        },
      },
    },
  })) as OrderWithRelations | null;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
}

function orderCode(orderId: number): string {
  return `ORD${String(orderId).padStart(6, '0')}`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'long',
  }).format(date);
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function renderItemsTable(items: OrderWithRelations['items']): string {
  const rows = items
    .map((item) => {
      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(item.unitPrice || 0);
      const lineTotal = quantity * unitPrice;
      return `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #eee;">${item.productNameSnap}</td>
          <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">${quantity}</td>
          <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">${formatCurrency(unitPrice)}</td>
          <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">${formatCurrency(lineTotal)}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-top:16px;">
      <thead>
        <tr>
          <th style="text-align:left;padding:10px;background:#f7f7f7;border-bottom:2px solid #eee;">Producto</th>
          <th style="text-align:center;padding:10px;background:#f7f7f7;border-bottom:2px solid #eee;">Cant.</th>
          <th style="text-align:right;padding:10px;background:#f7f7f7;border-bottom:2px solid #eee;">Precio</th>
          <th style="text-align:right;padding:10px;background:#f7f7f7;border-bottom:2px solid #eee;">Subtotal</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderCustomerEmailHtml(order: OrderWithRelations, paymentStatus: string): string {
  const customerName = order.user?.name ?? order.guestName ?? 'Cliente';
  const orderNumber = orderCode(order.id);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:9002';

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#f8f8f8;font-family:Arial,sans-serif;color:#222;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
        <tr>
          <td align="center">
            <table width="640" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:14px;overflow:hidden;">
              <tr>
                <td style="background:#c084ab;padding:20px 24px;color:#fff;">
                  <h1 style="margin:0;font-size:22px;">¡Gracias por tu compra en Florarte!</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:24px;">
                  <p style="margin:0 0 12px;">Hola ${customerName},</p>
                  <p style="margin:0 0 12px;">Confirmamos tu pedido <strong>${orderNumber}</strong>. Te compartimos el resumen:</p>
                  <p style="margin:0 0 4px;"><strong>Estado de pago:</strong> ${paymentStatus}</p>
                  <p style="margin:0 0 4px;"><strong>Fecha de pedido:</strong> ${formatDateTime(order.createdAt)}</p>
                  <p style="margin:0 0 4px;"><strong>Entrega:</strong> ${formatDate(order.deliveryDate)} · ${order.deliveryTimeSlot}</p>
                  <p style="margin:0 0 4px;"><strong>Recibe:</strong> ${order.orderAddress?.recipientName ?? customerName}</p>
                  <p style="margin:0 0 16px;"><strong>Dirección:</strong> ${order.orderAddress?.formattedAddress ?? 'Por confirmar'}</p>

                  ${renderItemsTable(order.items)}

                  <div style="margin-top:16px;text-align:right;">
                    <p style="margin:6px 0;">Subtotal: <strong>${formatCurrency(Number(order.subtotal || 0))}</strong></p>
                    <p style="margin:6px 0;">Envío: <strong>${formatCurrency(Number(order.shippingCost || 0))}</strong></p>
                    <p style="margin:6px 0;font-size:18px;">Total: <strong>${formatCurrency(Number(order.total || 0))}</strong></p>
                  </div>

                  <div style="margin-top:22px;text-align:center;">
                    <a href="${appUrl}/orders" style="display:inline-block;background:#c084ab;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:700;">Ver mis pedidos</a>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

function renderAdminEmailHtml(order: OrderWithRelations, paymentStatus: string): string {
  const orderNumber = orderCode(order.id);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:9002';
  const latestPayment = order.paymentTransactions[0];

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#f8f8f8;font-family:Arial,sans-serif;color:#222;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
        <tr>
          <td align="center">
            <table width="700" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:14px;overflow:hidden;">
              <tr>
                <td style="background:#1f2937;padding:20px 24px;color:#fff;">
                  <h1 style="margin:0;font-size:22px;">Nuevo pedido confirmado: ${orderNumber}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:24px;">
                  <p style="margin:0 0 8px;"><strong>Cliente:</strong> ${order.user?.name ?? order.guestName ?? 'Cliente invitado'}</p>
                  <p style="margin:0 0 8px;"><strong>Email:</strong> ${order.user?.email ?? order.guestEmail ?? 'N/A'}</p>
                  <p style="margin:0 0 8px;"><strong>Teléfono:</strong> ${order.orderAddress?.recipientPhone ?? 'N/A'}</p>
                  <p style="margin:0 0 8px;"><strong>Estado de pedido:</strong> ${order.status}</p>
                  <p style="margin:0 0 8px;"><strong>Estado de pago:</strong> ${paymentStatus}</p>
                  <p style="margin:0 0 8px;"><strong>Pasarela:</strong> ${latestPayment?.gateway ?? 'N/A'}</p>
                  <p style="margin:0 0 8px;"><strong>ID Pago:</strong> ${latestPayment?.externalPaymentId ?? 'N/A'}</p>
                  <p style="margin:0 0 8px;"><strong>Monto pagado:</strong> ${formatCurrency(Number(latestPayment?.amount ?? 0))}</p>
                  <p style="margin:0 0 8px;"><strong>Fecha de pago:</strong> ${latestPayment?.createdAt ? formatDateTime(latestPayment.createdAt) : 'N/A'}</p>
                  <p style="margin:0 0 8px;"><strong>Entrega:</strong> ${formatDate(order.deliveryDate)} · ${order.deliveryTimeSlot}</p>
                  <p style="margin:0 0 8px;"><strong>Destinatario:</strong> ${order.orderAddress?.recipientName ?? 'N/A'}</p>
                  <p style="margin:0 0 8px;"><strong>Dirección:</strong> ${order.orderAddress?.formattedAddress ?? 'N/A'}</p>
                  <p style="margin:0 0 12px;"><strong>Referencia:</strong> ${order.orderAddress?.referenceNotes ?? 'N/A'}</p>
                  <p style="margin:0 0 12px;"><strong>Dedicatoria:</strong> ${order.dedication ?? 'N/A'}</p>
                  <p style="margin:0 0 12px;"><strong>Firma:</strong> ${order.isAnonymous ? 'Anónimo' : (order.signature ?? 'N/A')}</p>

                  ${renderItemsTable(order.items)}

                  <div style="margin-top:16px;text-align:right;">
                    <p style="margin:6px 0;">Subtotal: <strong>${formatCurrency(Number(order.subtotal || 0))}</strong></p>
                    <p style="margin:6px 0;">Envío: <strong>${formatCurrency(Number(order.shippingCost || 0))}</strong></p>
                    <p style="margin:6px 0;font-size:18px;">Total: <strong>${formatCurrency(Number(order.total || 0))}</strong></p>
                  </div>

                  <div style="margin-top:22px;text-align:center;">
                    <a href="${appUrl}/admin/orders" style="display:inline-block;background:#1f2937;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:700;">Ir a pedidos admin</a>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

function renderAdminFailedPaymentEmailHtml(order: OrderWithRelations, paymentStatus: string): string {
  const orderNumber = orderCode(order.id);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:9002';
  const latestPayment = order.paymentTransactions[0];

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#fff4f4;font-family:Arial,sans-serif;color:#222;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
        <tr>
          <td align="center">
            <table width="700" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:14px;overflow:hidden;">
              <tr>
                <td style="background:#b91c1c;padding:20px 24px;color:#fff;">
                  <h1 style="margin:0;font-size:22px;">Pago fallido detectado: ${orderNumber}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:24px;">
                  <p style="margin:0 0 8px;"><strong>Cliente:</strong> ${order.user?.name ?? order.guestName ?? 'Cliente invitado'}</p>
                  <p style="margin:0 0 8px;"><strong>Email:</strong> ${order.user?.email ?? order.guestEmail ?? 'N/A'}</p>
                  <p style="margin:0 0 8px;"><strong>Estado de pago:</strong> ${paymentStatus}</p>
                  <p style="margin:0 0 8px;"><strong>Pasarela:</strong> ${latestPayment?.gateway ?? 'N/A'}</p>
                  <p style="margin:0 0 8px;"><strong>ID Pago:</strong> ${latestPayment?.externalPaymentId ?? 'N/A'}</p>
                  <p style="margin:0 0 8px;"><strong>Monto:</strong> ${formatCurrency(Number(latestPayment?.amount ?? 0))}</p>
                  <p style="margin:0 0 8px;"><strong>Fecha evento:</strong> ${latestPayment?.createdAt ? formatDateTime(latestPayment.createdAt) : 'N/A'}</p>
                  <p style="margin:0 0 8px;"><strong>Entrega:</strong> ${formatDate(order.deliveryDate)} · ${order.deliveryTimeSlot}</p>
                  <p style="margin:0 0 12px;"><strong>Dirección:</strong> ${order.orderAddress?.formattedAddress ?? 'N/A'}</p>

                  ${renderItemsTable(order.items)}

                  <div style="margin-top:16px;text-align:right;">
                    <p style="margin:6px 0;">Subtotal: <strong>${formatCurrency(Number(order.subtotal || 0))}</strong></p>
                    <p style="margin:6px 0;">Envío: <strong>${formatCurrency(Number(order.shippingCost || 0))}</strong></p>
                    <p style="margin:6px 0;font-size:18px;">Total del pedido: <strong>${formatCurrency(Number(order.total || 0))}</strong></p>
                  </div>

                  <div style="margin-top:22px;text-align:center;">
                    <a href="${appUrl}/admin/orders" style="display:inline-block;background:#b91c1c;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:700;">Revisar pedido en admin</a>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export const orderEmailService = {
  async sendOrderConfirmationAndAdminNotification(orderId: number) {
    const order = await getOrderWithRelations(orderId);

    if (!order) {
      return;
    }

    const customerEmail = (order.user?.email ?? order.guestEmail ?? '').trim();
    const adminEmail = String(process.env.ADMIN_EMAIL ?? '').trim();
    const latestPayment = order.paymentTransactions[0];
    const paymentStatus = latestPayment?.status === 'SUCCEEDED' ? 'Pagado' : latestPayment?.status ?? 'PENDIENTE';

    const emailJobs: Array<Promise<unknown>> = [];

    if (customerEmail) {
      emailJobs.push(
        sendEmail({
          to: customerEmail,
          subject: `Confirmación de pedido ${orderCode(order.id)} — Florarte`,
          html: renderCustomerEmailHtml(order, paymentStatus),
        }),
      );
    }

    if (adminEmail) {
      emailJobs.push(
        sendEmail({
          to: adminEmail,
          subject: `Nuevo pedido ${orderCode(order.id)} · ${paymentStatus}`,
          html: renderAdminEmailHtml(order, paymentStatus),
        }),
      );
    }

    if (emailJobs.length > 0) {
      await Promise.allSettled(emailJobs);
    }
  },

  async sendFailedPaymentAdminNotification(orderId: number) {
    const order = await getOrderWithRelations(orderId);
    if (!order) return;

    const adminEmail = String(process.env.ADMIN_EMAIL ?? '').trim();
    if (!adminEmail) return;

    const latestPayment = order.paymentTransactions[0];
    const paymentStatus = latestPayment?.status ?? 'FAILED';

    await sendEmail({
      to: adminEmail,
      subject: `Pago fallido ${orderCode(order.id)} · ${paymentStatus}`,
      html: renderAdminFailedPaymentEmailHtml(order, paymentStatus),
    });
  },
};
