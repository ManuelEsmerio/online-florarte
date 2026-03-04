import Link from 'next/link';
import Header from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Package, Home } from 'lucide-react';
import { orderService } from '@/services/orderService';
import type { AdminOrderDetailsDTO, OrderStatus } from '@/lib/definitions';
import { OrderTicketPreview } from '@/components/orders/OrderTicketPreview';
import { formatTimeSlotForUI } from '@/lib/utils';

interface Props {
  searchParams: Promise<{ orderId?: string; order_id?: string }>;
}

const currencyFormatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

const formatCurrency = (value?: number | null) => currencyFormatter.format(value ?? 0);

const formatDateOnly = (value?: string | null) => {
  if (!value) return 'Por confirmar';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Por confirmar';
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }).format(parsed);
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
};

const PAYMENT_BADGE_MAP: Record<string, { label: string; className: string }> = {
  SUCCEEDED: { label: 'Pago confirmado', className: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
  COMPLETED: { label: 'Pago confirmado', className: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
  PENDING: { label: 'Pago pendiente', className: 'bg-amber-100 text-amber-700 border border-amber-200' },
  PROCESSING: { label: 'Validando pago', className: 'bg-blue-100 text-blue-700 border border-blue-200' },
  FAILED: { label: 'Pago rechazado', className: 'bg-rose-100 text-rose-700 border border-rose-200' },
  CANCELED: { label: 'Pago cancelado', className: 'bg-slate-200 text-slate-700 border border-slate-300' },
  CANCELLED: { label: 'Pago cancelado', className: 'bg-slate-200 text-slate-700 border border-slate-300' },
  REFUNDED: { label: 'Pago reembolsado', className: 'bg-purple-100 text-purple-700 border border-purple-200' },
};

const SPANISH_STATUS_MAP: Record<string, OrderStatus> = {
  pendiente: 'PENDING',
  procesando: 'PROCESSING',
  'en_reparto': 'SHIPPED',
  'en reparto': 'SHIPPED',
  completado: 'DELIVERED',
  cancelado: 'CANCELLED',
};

const normalizeStatus = (value?: string | null): OrderStatus => {
  if (!value) return 'PENDING';
  const normalized = value.trim().toLowerCase();
  return SPANISH_STATUS_MAP[normalized] ?? 'PENDING';
};

const mapOrderToTicket = (order: any): AdminOrderDetailsDTO => {
  const items = Array.isArray(order?.items)
    ? order.items.map((item: any) => ({
        productId: Number(item.product_id ?? item.productId ?? 0),
        quantity: Number(item.quantity ?? 0),
        unitPrice: Number(item.price ?? item.unitPrice ?? 0),
        productNameSnap: item.product_name ?? item.productNameSnap ?? 'Producto',
        variantNameSnap: item.variant_name ?? item.variantNameSnap ?? null,
        imageSnap: item.image ?? item.imageSnap ?? null,
        customPhotoUrl: item.customPhotoUrl ?? item.custom_photo_url ?? null,
      }))
    : [];

  return {
    id: Number(order?.id ?? 0),
    userId: order?.user_id ?? order?.userId ?? null,
    isGuest: Boolean(order?.is_guest ?? order?.isGuest ?? false),
    guestName: order?.guest_name ?? order?.guestName ?? null,
    guestEmail: order?.guest_email ?? order?.guestEmail ?? null,
    guestPhone: order?.guest_phone ?? order?.guestPhone ?? null,
    deliveryDriverId: order?.delivery_driver_id ?? order?.deliveryDriverId ?? null,
    status: normalizeStatus(order?.status),
    subtotal: Number(order?.subtotal ?? 0),
    couponDiscount: Number(order?.coupon_discount ?? order?.couponDiscount ?? 0),
    shippingCost: Number(order?.shipping_cost ?? order?.shippingCost ?? 0),
    total: Number(order?.total ?? 0),
    deliveryDate: String(order?.delivery_date ?? order?.deliveryDate ?? ''),
    deliveryTimeSlot: String(order?.delivery_time_slot ?? order?.deliveryTimeSlot ?? ''),
    deliveryNotes: order?.delivery_notes ?? order?.deliveryNotes ?? '',
    createdAt: String(order?.created_at ?? order?.createdAt ?? ''),
    updatedAt: order?.updated_at ? String(order.updated_at) : order?.updatedAt ? String(order.updatedAt) : undefined,
    customerName: order?.customerName ?? order?.guest_name ?? order?.guestName ?? 'Cliente invitado',
    customerEmail: order?.customerEmail ?? order?.guest_email ?? order?.guestEmail ?? '',
    customerPhone: order?.customerPhone ?? order?.guest_phone ?? order?.guestPhone ?? null,
    recipientName: order?.recipientName ?? null,
    recipientPhone: order?.recipientPhone ?? null,
    shippingAddress: order?.shippingAddress ?? 'Dirección por confirmar',
    deliveryDriverName: order?.deliveryDriverName ?? null,
    paymentGateway: order?.payment_gateway ?? order?.paymentGateway ?? null,
    paymentStatus: order?.payment_status ?? order?.paymentStatus ?? null,
    hasPaymentTransaction: Boolean(order?.has_payment_transaction ?? order?.hasPaymentTransaction ?? false),
    items,
    couponId: order?.coupon_id ?? order?.couponId ?? null,
    couponCodeSnap: order?.coupon_code ?? order?.couponCodeSnap ?? null,
    couponType: order?.coupon_type ?? order?.couponType ?? null,
    couponValue: order?.coupon_value ?? order?.couponValue ?? null,
    dedication: order?.dedication ?? null,
    isAnonymous: Boolean(order?.is_anonymous ?? order?.isAnonymous ?? false),
    signature: order?.signature ?? null,
  };
};

export default async function OrderSuccessPage({ searchParams }: Props) {
  const params = await searchParams;
  const rawOrderId = params?.orderId ?? params?.order_id ?? '';
  const numericOrderId = Number(rawOrderId);
  const orderDetails = Number.isFinite(numericOrderId) ? await orderService.getOrderDetails(numericOrderId) : null;
  const ticketOrder = orderDetails ? mapOrderToTicket(orderDetails) : null;

  const orderNumber = rawOrderId || ticketOrder?.id ? `ORD#${String(rawOrderId || ticketOrder?.id).padStart(4, '0')}` : 'ORD#----';
  const deliveryDateLabel = ticketOrder ? formatDateOnly(ticketOrder.deliveryDate) : 'Por confirmar';
  const deliveryWindowLabel = ticketOrder ? formatTimeSlotForUI(ticketOrder.deliveryTimeSlot) : 'Horario por confirmar';
  const orderPlacedLabel = orderDetails ? formatDateTime(orderDetails.created_at) : '—';
  const paymentStatus = ticketOrder?.paymentStatus ? ticketOrder.paymentStatus.toUpperCase() : 'PENDING';
  const paymentBadge = PAYMENT_BADGE_MAP[paymentStatus] ?? PAYMENT_BADGE_MAP.PENDING;
  const statusLabel = orderDetails?.status ? orderDetails.status.replace('_', ' ') : 'pendiente';

  const highlights = [
    { label: 'Número de orden', value: orderNumber },
    { label: 'Pago verificado el', value: orderPlacedLabel },
    { label: 'Entrega programada', value: deliveryDateLabel },
    { label: 'Horario estimado', value: deliveryWindowLabel },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-grow bg-secondary/20 py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <section className="rounded-[2rem] bg-background border border-border/50 shadow-lg/30 shadow-black/5 p-8 md:p-10 space-y-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-primary/70 font-semibold">Pago verificado</p>
                    <h1 className="text-3xl md:text-4xl font-bold font-headline">
                      ¡Pago exitoso!
                    </h1>
                    <p className="text-muted-foreground text-sm md:text-base mt-2 max-w-xl">
                      Tu orden fue recibida correctamente y nuestro equipo ya está preparando tus flores para la entrega.
                    </p>
                  </div>
                </div>
                <div className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold ${paymentBadge.className}`}>
                  {paymentBadge.label}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {highlights.map(item => (
                  <div key={item.label} className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{item.label}</p>
                    <p className="text-lg font-semibold text-foreground mt-1">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-border/60 bg-muted/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Resumen</p>
                <div className="grid gap-3 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Estado del pedido</span>
                    <span className="font-semibold text-foreground capitalize">{statusLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total pagado</span>
                    <span className="font-semibold text-foreground">{formatCurrency(ticketOrder?.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cliente</span>
                    <span className="font-semibold text-foreground">{orderDetails?.customerName ?? 'Cliente invitado'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Contacto</span>
                    <span className="font-semibold text-foreground">{orderDetails?.customerEmail ?? '—'}</span>
                  </div>
                </div>
              </div>

              {!orderDetails && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 text-amber-900 p-4 text-sm">
                  No pudimos encontrar la información completa de tu pedido. Si el pago se realizó recientemente, intenta refrescar esta página en unos segundos o contáctanos con el número de orden.
                </div>
              )}

              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-3">
                  <span className="mt-1 block h-2 w-2 rounded-full bg-primary" aria-hidden />
                  <p>Recibirás un correo con cada actualización importante de tu envío.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 block h-2 w-2 rounded-full bg-primary" aria-hidden />
                  <p>Puedes revisar el detalle completo del pedido desde la sección de pedidos.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 block h-2 w-2 rounded-full bg-primary" aria-hidden />
                  <p>Si necesitas editar la entrega o tienes dudas, contáctanos con tu número de orden.</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild className="h-12 rounded-xl font-bold flex-1">
                  <Link href="/orders">
                    <Package className="w-4 h-4 mr-2" />
                    Ver mis pedidos
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-12 rounded-xl font-bold flex-1">
                  <Link href="/">
                    <Home className="w-4 h-4 mr-2" />
                    Ir al inicio
                  </Link>
                </Button>
              </div>
            </section>

            <OrderTicketPreview order={ticketOrder} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
