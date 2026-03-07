import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import type { OrderStatus } from '@/lib/definitions';
import { renderOrderConfirmationTemplate } from '@/lib/email-templates/order-confirmation.template';
import { renderNewOrderNotificationTemplate } from '@/lib/email-templates/new-order-notification.template';
import { renderOrderStatusUpdateTemplate } from '@/lib/email-templates/order-status-update.template';
import { renderRefundNotificationTemplate } from '@/lib/email-templates/refund-notification.template';
import type { OrderEmailPayload, PaymentSummary } from '@/lib/email-templates/types';

type OrderWithRelations = {
  id: number;
  status: string;
  subtotal: any;
  couponDiscount: any;
  shippingCost: any;
  total: any;
  deliveryDate: Date | null;
  deliveryTimeSlot: string | null;
  deliveryNotes: string | null;
  dedication: string | null;
  isAnonymous: boolean;
  signature: string | null;
  createdAt: Date;
  updatedAt: Date;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  user: { id: number; name: string; email: string } | null;
  orderAddress: {
    recipientName: string | null;
    recipientPhone: string | null;
    formattedAddress: string | null;
    referenceNotes: string | null;
  } | null;
  items: Array<{
    id: number;
    productNameSnap: string;
    variantNameSnap: string | null;
    imageSnap: string | null;
    customPhotoUrl: string | null;
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

const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://floreriaflorarte.com';

const PAYMENT_GATEWAY_LABELS: Record<string, string> = {
  stripe: 'Tarjeta (Stripe)',
  mercadopago: 'Mercado Pago',
  manual: 'Pago manual',
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  SUCCEEDED: 'Pagado',
  PENDING: 'Pendiente',
  FAILED: 'Pago fallido',
  CANCELED: 'Pago cancelado',
  REQUIRES_ACTION: 'Acción requerida',
};

const STATUS_SUBJECT_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pedido recibido',
  PROCESSING: 'En preparación',
  SHIPPED: 'En ruta',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
  PAYMENT_FAILED: 'Pago no procesado',
  EXPIRED: 'Pedido expirado',
};

async function getOrderWithRelations(orderId: number): Promise<OrderWithRelations | null> {
  return (await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { id: true, name: true, email: true } },
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
          id: true,
          productNameSnap: true,
          variantNameSnap: true,
          imageSnap: true,
          customPhotoUrl: true,
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

const orderCode = (orderId: number) => `ORD${String(orderId).padStart(6, '0')}`;

const resolveImageUrl = (raw?: string | null) => {
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('//')) return `https:${raw}`;
  const normalized = raw.startsWith('/') ? raw : `/${raw}`;
  return `${APP_BASE_URL}${normalized}`;
};

const getGatewayLabel = (gateway?: string | null) => {
  if (!gateway) return 'Pago en línea';
  const key = gateway.toLowerCase();
  return PAYMENT_GATEWAY_LABELS[key] ?? gateway;
};

const mapPaymentStatus = (status?: string | null) => {
  if (!status) return 'Pendiente';
  return PAYMENT_STATUS_LABELS[status.toUpperCase()] ?? status;
};

function normalizeOrderForEmail(order: OrderWithRelations): OrderEmailPayload {
  const subtotal = Number(order.subtotal ?? 0);
  const couponDiscount = Number(order.couponDiscount ?? 0);
  const shippingCost = Number(order.shippingCost ?? 0);
  const total = Number(order.total ?? subtotal - couponDiscount + shippingCost);
  const customerName = order.user?.name ?? order.guestName ?? 'Cliente invitado';
  const customerEmail = order.user?.email ?? order.guestEmail ?? '';
  const addressPhone = order.orderAddress?.recipientPhone ?? order.guestPhone ?? null;

  return {
    id: order.id,
    code: orderCode(order.id),
    status: String(order.status ?? 'PENDING').toUpperCase(),
    subtotal,
    couponDiscount,
    shippingCost,
    total,
    deliveryDate: order.deliveryDate ?? null,
    deliveryTimeSlot: order.deliveryTimeSlot ?? null,
    dedication: order.dedication,
    deliveryNotes: order.deliveryNotes,
    isAnonymous: Boolean(order.isAnonymous),
    signature: order.signature,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    customerName,
    customerEmail,
    customerPhone: addressPhone,
    paymentGateway: order.paymentTransactions[0]?.gateway ?? null,
    address: {
      recipientName: order.orderAddress?.recipientName ?? customerName,
      recipientPhone: addressPhone,
      line1: order.orderAddress?.formattedAddress ?? null,
      referenceNotes: order.orderAddress?.referenceNotes ?? null,
    },
    items: order.items.map((item) => {
      const quantity = Number(item.quantity ?? 0);
      const unitPrice = Number(item.unitPrice ?? 0);
      const resolvedImage = resolveImageUrl(item.customPhotoUrl ?? item.imageSnap);
      return {
        name: item.productNameSnap,
        quantity,
        unitPrice,
        subtotal: quantity * unitPrice,
        imageUrl: resolvedImage,
        variantName: item.variantNameSnap,
      };
    }),
  };
}

function buildPaymentSummary(order: OrderWithRelations): PaymentSummary {
  const latestPayment = order.paymentTransactions[0];
  return {
    method: getGatewayLabel(latestPayment?.gateway ?? order.paymentTransactions[0]?.gateway),
    status: mapPaymentStatus(latestPayment?.status),
    reference: latestPayment?.externalPaymentId ?? null,
    processedAt: latestPayment?.createdAt ?? null,
    amount: latestPayment ? Number(latestPayment.amount ?? 0) : Number(order.total ?? 0),
  };
}

function renderAdminFailedPaymentEmailHtml(order: OrderEmailPayload, payment: PaymentSummary): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:9002';
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#fff4f4;font-family:Arial,sans-serif;color:#1f2937;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
        <tr>
          <td align="center">
            <table width="680" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 12px 30px rgba(185,28,28,0.2);">
              <tr>
                <td style="background:#b91c1c;padding:24px;color:#fff;">
                  <h1 style="margin:0;font-size:22px;">Pago fallido · ${order.code}</h1>
                  <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);">${payment.status}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:24px;">
                  <p><strong>Cliente:</strong> ${order.customerName} · ${order.customerEmail || 'Sin correo'}</p>
                  <p><strong>Pasarela:</strong> ${order.paymentGateway ?? 'N/A'}</p>
                  <p><strong>Referencia:</strong> ${payment.reference ?? 'N/A'}</p>
                  <p><strong>Monto:</strong> ${payment.amount ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(payment.amount) : 'N/A'}</p>
                  <p><strong>Entrega:</strong> ${order.deliveryDate ? new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' }).format(order.deliveryDate) : 'Por confirmar'} · ${order.deliveryTimeSlot || 'Horario por confirmar'}</p>
                  <p><strong>Dirección:</strong> ${order.address.line1 || 'Por confirmar'}</p>
                  <p style="margin-top:18px;">Se recomienda revisar el pedido y volver a contactar al cliente.</p>
                  <div style="margin-top:20px;text-align:center;">
                    <a href="${appUrl}/admin/orders/${order.id}" style="display:inline-block;background:#b91c1c;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:600;">Abrir pedido</a>
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
    const orderRecord = await getOrderWithRelations(orderId);
    if (!orderRecord) return;

    const order = normalizeOrderForEmail(orderRecord);
    const payment = buildPaymentSummary(orderRecord);
    const customerEmail = order.customerEmail?.trim();
    const adminEmail = String(process.env.ADMIN_EMAIL ?? '').trim();

    const jobs: Promise<unknown>[] = [];

    if (customerEmail) {
      jobs.push(
        sendEmail({
          to: customerEmail,
          subject: `Confirmación de pedido ${order.code} — Florarte`,
          html: renderOrderConfirmationTemplate({
            userName: order.customerName,
            order,
            payment,
          }),
        }),
      );
    }

    if (adminEmail) {
      jobs.push(
        sendEmail({
          to: adminEmail,
          subject: `Nuevo pedido ${order.code} · ${payment.status}`,
          html: renderNewOrderNotificationTemplate({ order, payment }),
        }),
      );
    }

    if (jobs.length) {
      await Promise.allSettled(jobs);
    }
  },

  async sendOrderStatusChangeNotification(orderId: number, newStatus: OrderStatus) {
    const orderRecord = await getOrderWithRelations(orderId);
    if (!orderRecord) return;

    const order = normalizeOrderForEmail(orderRecord);
    const customerEmail = order.customerEmail?.trim();
    if (!customerEmail) return;

    try {
      await sendEmail({
        to: customerEmail,
        subject: `Actualización ${order.code} · ${STATUS_SUBJECT_LABELS[newStatus]}`,
        html: renderOrderStatusUpdateTemplate({
          userName: order.customerName,
          order,
          newStatus,
          updatedAt: new Date(),
        }),
      });
    } catch (error) {
      console.error('[ORDER_STATUS_EMAIL_ERROR]', error);
    }
  },

  async sendRefundNotificationEmail(orderId: number, refunded: boolean) {
    const orderRecord = await getOrderWithRelations(orderId);
    if (!orderRecord) return;

    const order = normalizeOrderForEmail(orderRecord);
    const customerEmail = order.customerEmail?.trim();
    if (!customerEmail) return;

    const subject = refunded
      ? `Tu reembolso está en proceso · ${order.code}`
      : `Tu pedido fue cancelado · ${order.code}`;

    await sendEmail({
      to: customerEmail,
      subject,
      html: renderRefundNotificationTemplate({
        userName: order.customerName,
        order,
        refunded,
      }),
    });
  },

  async sendFailedPaymentAdminNotification(orderId: number) {
    const orderRecord = await getOrderWithRelations(orderId);
    if (!orderRecord) return;

    const adminEmail = String(process.env.ADMIN_EMAIL ?? '').trim();
    if (!adminEmail) return;

    const order = normalizeOrderForEmail(orderRecord);
    const payment = buildPaymentSummary(orderRecord);

    await sendEmail({
      to: adminEmail,
      subject: `Pago fallido ${order.code} · ${payment.status}`,
      html: renderAdminFailedPaymentEmailHtml(order, payment),
    });
  },
};
