'use client';

import { useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { AdminOrderDetailsDTO, OrderStatus } from '@/lib/definitions';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatTimeSlotForUI } from '@/lib/utils';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { printOrderTicket } from '../../../lib/printing/order-ticket';
import {
  CalendarDays,
  Clock,
  Heart,
  Phone,
  UserRound,
  User,
  Truck,
  MapPin,
  Printer,
  Mail,
  RefreshCcw,
  Ban,
} from 'lucide-react';
import { AdminCancelOrderDialog } from './AdminCancelOrderDialog';

const formatCurrency = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined) return 'N/A';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
};

const statusColors: Record<OrderStatus, string> = {
  PENDING: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  PROCESSING: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800',
  SHIPPED: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800',
  DELIVERED: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800',
  CANCELLED: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800',
};

const statusLabels: Record<OrderStatus, string> = {
  PENDING: 'Pendiente',
  PROCESSING: 'Preparando pedido',
  SHIPPED: 'En camino',
  DELIVERED: 'Completado',
  CANCELLED: 'Cancelado',
};

const paymentStatusLabels: Record<string, string> = {
  SUCCEEDED: 'Pagado',
  PENDING: 'Pago pendiente',
  FAILED: 'Pago rechazado',
};

const paymentStatusColors: Record<string, string> = {
  SUCCEEDED: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800',
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800',
  FAILED: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800',
};

interface OrderDetailsDialogProps {
  order: AdminOrderDetailsDTO | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus: (
    orderId: number,
    newStatus: OrderStatus,
    payload: { deliveryDriverId?: number; deliveryNotes?: string }
  ) => Promise<void>;
  onCancelOrder?: (orderId: number) => void;
}

const nextStatusMap: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: 'PROCESSING',
  PROCESSING: 'SHIPPED',
  SHIPPED: 'DELIVERED',
};

const normalizeOrderStatus = (value: unknown): OrderStatus | null => {
    const raw = String(value ?? '')
        .trim()
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const map: Record<string, OrderStatus> = {
        PENDING: 'PENDING',
        PROCESSING: 'PROCESSING',
        SHIPPED: 'SHIPPED',
        DELIVERED: 'DELIVERED',
        CANCELLED: 'CANCELLED',
        PENDIENTE: 'PENDING',
        PROCESANDO: 'PROCESSING',
        'EN PROCESO': 'PROCESSING',
        EN_REPARTO: 'SHIPPED',
        COMPLETADO: 'DELIVERED',
        CANCELADO: 'CANCELLED',
    };

    return map[raw] ?? null;
};

export const OrderDetailsDialog = ({ order, isOpen, onOpenChange, onUpdateStatus, onCancelOrder }: OrderDetailsDialogProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const normalizedStatus = normalizeOrderStatus(order?.status) ?? 'PENDING';
  const nextStatus = nextStatusMap[normalizedStatus];
  const canCancelOrder = normalizedStatus !== 'CANCELLED';
  const hasPaymentTransaction = Boolean(order?.hasPaymentTransaction ?? order?.has_payment_transaction ?? false);
  const paymentStatusRaw = String(order?.paymentStatus ?? order?.payment_status ?? '').trim().toUpperCase();
  const paymentStatusLabel = hasPaymentTransaction
    ? paymentStatusLabels[paymentStatusRaw] ?? (paymentStatusRaw || 'Pago registrado')
    : null;
  const paymentBadgeClass = paymentStatusColors[paymentStatusRaw] ?? 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  const paymentGatewayRaw = String(order?.paymentGateway ?? order?.payment_gateway ?? '').trim();
  const paymentGatewayLabel = paymentGatewayRaw
    ? paymentGatewayRaw
        .split(/[_\s]/)
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    : 'Sin registro';
  const isUnpaidOrder = !hasPaymentTransaction;
  const currentStatusLabel = statusLabels[normalizedStatus];
  const couponTypeRaw = String(order?.couponType ?? '').toUpperCase();
  const couponTypeLabel = couponTypeRaw === 'PERCENTAGE' ? 'Porcentaje' : couponTypeRaw === 'FIXED' ? 'Monto fijo' : null;
  const couponValue = order?.couponValue ?? null;
  const couponCode = order?.couponCodeSnap ?? null;
  const isGuestOrder = Boolean(order?.isGuest);
  const guestName = order?.guestName ?? null;
  const guestEmail = order?.guestEmail ?? null;
  const guestPhone = order?.guestPhone ?? null;

  const handleQuickStatusUpdate = async () => {
    if (!order?.id || !nextStatus || isUpdating) return;
    if (typeof onUpdateStatus !== 'function') {
      console.error('[OrderDetailsDialog] onUpdateStatus is not a function', { onUpdateStatus });
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdateStatus(order.id, nextStatus, {});
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrintTicket = () => {
    if (!order) return;
    printOrderTicket(order);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-6xl p-0 gap-0 bg-background border-border/50 overflow-hidden flex flex-col max-h-[92vh]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogTitle className="sr-only">Detalle del Pedido #{order?.id}</DialogTitle>

        {order && (
          <>
            <header className="px-6 md:px-10 py-8 border-b border-border/60 bg-background/95">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <h1 className="font-serif text-3xl lg:text-5xl text-foreground tracking-tight font-bold">
                    Detalles del Pedido: <span className="text-primary italic">ORD${String(order.id).padStart(4, '0')}</span>
                  </h1>
                  <p className="text-muted-foreground text-sm mt-2 flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Realizado el {format(parseISO(order.createdAt), "d 'de' MMMM, yyyy", { locale: es })}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 justify-end">
                  <span className={cn('px-4 py-1.5 rounded-full border text-xs font-bold tracking-wide uppercase w-fit', statusColors[normalizedStatus])}>
                    {currentStatusLabel}
                  </span>
                  {paymentStatusLabel ? (
                    <span className={cn('px-4 py-1.5 rounded-full border text-xs font-bold tracking-wide uppercase w-fit', paymentBadgeClass)}>
                      Pago: {paymentStatusLabel}
                    </span>
                  ) : isUnpaidOrder ? (
                    <span className="px-4 py-1.5 rounded-full border text-xs font-bold tracking-wide uppercase w-fit bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-200 dark:border-rose-800">
                      Sin pagar
                    </span>
                  ) : null}
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 md:px-10 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">
              <div className="lg:col-span-7 space-y-8">
                <section>
                  <div className="flex items-center justify-between mb-6 gap-3">
                    <h2 className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground">Artículos ({order.items?.length ?? 0})</h2>
                    <span className={cn('px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider', statusColors[normalizedStatus])}>
                      {currentStatusLabel}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {order.items?.map(item => {
                      const itemKey = `${item.productId ?? 'product'}-${item.variantNameSnap ?? 'base'}-${item.productNameSnap ?? 'item'}`;
                      return (
                        <div key={itemKey} className="flex items-center gap-4 md:gap-5 rounded-2xl p-3 border border-transparent hover:border-border/60 hover:bg-muted/20 transition-colors">
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden flex-shrink-0 bg-muted relative">
                          <Image
                            src={item.imageSnap || '/placehold.webp'}
                            alt={item.productNameSnap || 'Producto'}
                            fill
                            sizes="(max-width: 768px) 80vw, 192px"
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base md:text-xl leading-tight text-foreground">{item.productNameSnap}</h3>
                          {item.variantNameSnap ? <p className="text-sm text-muted-foreground mt-1 truncate">{item.variantNameSnap}</p> : null}
                          {item.customPhotoUrl ? <div className="mt-1 text-xs text-primary font-medium">Incluye foto personalizada</div> : null}
                          <div className="mt-2 flex items-center gap-3">
                            <span className="text-xs px-2 py-1 rounded-md bg-muted font-medium">Cant: {item.quantity}</span>
                            <span className="text-primary font-bold text-lg">{formatCurrency(item.unitPrice * item.quantity)}</span>
                          </div>
                        </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section>
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground mb-4">Dedicatoria</h2>
                  <div className="bg-card/60 rounded-2xl p-6 md:p-7 border border-border/50 relative overflow-hidden">
                    <div className="absolute -right-5 -top-5 opacity-10">
                      <Heart className="w-24 h-24 text-primary fill-primary" />
                    </div>
                    <div className="relative z-10 space-y-4">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        <Heart className="w-3.5 h-3.5 text-primary fill-primary" />
                        <span>Mensaje Especial</span>
                      </div>
                      <p className="text-lg md:text-2xl font-serif italic leading-relaxed text-foreground/90">
                        "{order.dedication || 'No se incluyó dedicatoria.'}"
                      </p>
                      <div className="pt-3 border-t border-border/60 flex justify-between items-center">
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Firma</span>
                        <span className="text-sm font-semibold">{order.isAnonymous ? 'Anónimo' : (order.signature || 'No especificada')}</span>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <div className="lg:col-span-5 space-y-6">
                <section>
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground mb-4">Información de Entrega</h2>
                  <div className="bg-card/60 rounded-2xl p-5 md:p-6 border border-border/50 space-y-5">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Fecha y horario</p>
                        <p className="font-semibold text-foreground">{format(parseISO(order.deliveryDate), "d 'de' MMMM, yyyy", { locale: es })}</p>
                        <p className="text-sm text-muted-foreground">Bloque: {formatTimeSlotForUI(order.deliveryTimeSlot)}</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Dirección de envío</p>
                        <p className="font-semibold text-foreground leading-snug">{order.shippingAddress}</p>
                        {order.deliveryNotes ? <p className="text-sm text-muted-foreground mt-1">Notas: {order.deliveryNotes}</p> : null}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <UserRound className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Receptor</p>
                        <p className="font-semibold text-foreground">{order.recipientName || order.customerName}</p>
                        <p className="text-sm text-muted-foreground">{order.recipientPhone || order.customerPhone || 'Sin teléfono'}</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground mb-4">Detalles del Cliente</h2>
                  <div className="bg-card/60 rounded-2xl p-5 border border-border/50 space-y-2">
                    <p className="text-xs text-muted-foreground font-semibold">Tipo de compra: {isGuestOrder ? 'Invitado' : 'Usuario registrado'}</p>
                    <p className="font-semibold text-foreground flex items-center gap-2"><User className="h-4 w-4 text-primary" />{order.customerName}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-2"><Mail className="h-4 w-4" />{order.customerEmail}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-2"><Phone className="h-4 w-4" />{order.customerPhone || 'Sin teléfono'}</p>
                    {isGuestOrder ? (
                      <div className="pt-2 mt-2 border-t border-border/50 space-y-1">
                        <p className="text-sm"><span className="font-semibold">Invitado:</span> {guestName || 'No disponible'}</p>
                        <p className="text-sm"><span className="font-semibold">Email invitado:</span> {guestEmail || 'No disponible'}</p>
                        <p className="text-sm"><span className="font-semibold">Tel. invitado:</span> {guestPhone || 'No disponible'}</p>
                      </div>
                    ) : null}
                    {order.deliveryDriverName ? (
                      <p className="text-sm text-muted-foreground flex items-center gap-2 pt-1"><Truck className="h-4 w-4" />Repartidor: {order.deliveryDriverName}</p>
                    ) : null}
                  </div>
                </section>

                <section>
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground mb-4">Pago y Resumen</h2>
                  <div className="bg-card/60 rounded-2xl p-5 border border-border/50 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal de artículos</span>
                      <span className="font-medium">{formatCurrency(order.subtotal)}</span>
                    </div>
                    {order.couponDiscount ? (
                      <>
                        <div className="flex justify-between text-sm text-green-600 font-medium">
                          <span>Descuento ({couponCode || 'Cupón'})</span>
                          <span>-{formatCurrency(order.couponDiscount)}</span>
                        </div>
                        {(couponTypeLabel || couponValue !== null) && (
                          <div className="text-xs text-muted-foreground space-y-1">
                            {couponTypeLabel ? <p>Tipo: <span className="font-semibold">{couponTypeLabel}</span></p> : null}
                            {couponValue !== null ? (
                              <p>Valor: <span className="font-semibold">{couponTypeRaw === 'PERCENTAGE' ? `${Number(couponValue)}%` : formatCurrency(Number(couponValue))}</span></p>
                            ) : null}
                          </div>
                        )}
                      </>
                    ) : null}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Costo de envío</span>
                      <span className="font-medium">{order.shippingCost === 0 ? 'Gratis' : formatCurrency(order.shippingCost)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Método de pago</span>
                      <span className="font-semibold text-foreground">{paymentGatewayLabel}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Estado del pago</span>
                      <span className="font-semibold text-foreground">{paymentStatusLabel ?? (isUnpaidOrder ? 'Sin registro' : 'N/A')}</span>
                    </div>
                    <div className="pt-4 border-t border-border/60 flex justify-between items-end">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Total del pedido</p>
                        <p className="text-xs text-muted-foreground">IVA incluido</p>
                      </div>
                      <span className="text-3xl font-bold text-primary">{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            <footer className="px-6 md:px-10 py-5 bg-background/80 border-t border-border/60 flex flex-wrap gap-3 justify-between items-center sm:flex-row flex-col">
              <div className="flex gap-3 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={handlePrintTicket}
                  className="flex-1 sm:flex-none gap-2 border-border text-muted-foreground hover:bg-primary hover:text-white transition-all font-medium h-11 rounded-xl"
                >
                  <Printer className="h-5 w-5" />
                  Imprimir Ticket
                </Button>
                <Button
                  variant="outline"
                  disabled
                  title="Disponible próximamente"
                  className="flex-1 sm:flex-none gap-2 border-border text-muted-foreground h-11 rounded-xl opacity-60 cursor-not-allowed"
                >
                  <Mail className="h-5 w-5" />
                  Reenviar Factura
                </Button>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                {canCancelOrder && order && (
                  <AdminCancelOrderDialog
                    order={order as any}
                    onSuccess={(orderId) => {
                      onCancelOrder?.(orderId);
                      onOpenChange(false);
                    }}
                    trigger={
                      <Button
                        variant="ghost"
                        className="flex-1 sm:flex-none gap-2 border border-primary/30 text-primary hover:bg-primary/10 hover:text-primary transition-all font-medium h-11 rounded-xl"
                      >
                        <Ban className="h-5 w-5" />
                        Cancelar Pedido
                      </Button>
                    }
                  />
                )}
                <Button
                 onClick={handleQuickStatusUpdate}
                 disabled={!nextStatus || typeof onUpdateStatus !== 'function' || isUpdating}
                 className="flex-1 sm:flex-none gap-2 bg-primary text-white hover:bg-primary/90 transition-all font-bold shadow-lg shadow-primary/20 h-11 px-8 rounded-xl">
                  <RefreshCcw className={cn('h-5 w-5', isUpdating && 'animate-spin')} />
                  {isUpdating ? 'Actualizando...' : 'Actualizar Estado'}
                </Button>
              </div>
            </footer>
          </>
        )}
      </DialogContent>

    </Dialog>
  );
};
