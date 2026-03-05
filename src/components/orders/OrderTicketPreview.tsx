'use client';

import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import type { AdminOrderDetailsDTO } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { printOrderTicket } from '@/lib/printing/order-ticket';
import { cn, formatTimeSlotForUI } from '@/lib/utils';

interface OrderTicketPreviewProps {
  order: AdminOrderDetailsDTO | null;
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

const PAYMENT_STATUS_LABELS: Record<string, { label: string; className: string }> = {
  SUCCEEDED: { label: 'Pagado', className: 'bg-emerald-500/20 text-emerald-100 border border-emerald-500/60' },
  COMPLETED: { label: 'Pagado', className: 'bg-emerald-500/20 text-emerald-100 border border-emerald-500/60' },
  PROCESSING: { label: 'En validación', className: 'bg-sky-500/20 text-sky-100 border border-sky-500/60' },
  PENDING: { label: 'Pendiente', className: 'bg-amber-500/20 text-amber-100 border border-amber-500/60' },
  FAILED: { label: 'Rechazado', className: 'bg-rose-500/20 text-rose-100 border border-rose-500/60' },
  CANCELED: { label: 'Cancelado', className: 'bg-slate-500/20 text-slate-100 border border-slate-500/60' },
  CANCELLED: { label: 'Cancelado', className: 'bg-slate-500/20 text-slate-100 border border-slate-500/60' },
  REFUNDED: { label: 'Reembolsado', className: 'bg-purple-500/20 text-purple-100 border border-purple-500/60' },
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  PROCESSING: 'En proceso',
  SHIPPED: 'En reparto',
  DELIVERED: 'Completado',
  CANCELLED: 'Cancelado',
};

export function OrderTicketPreview({ order }: OrderTicketPreviewProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const orderNumber = order ? `ORD#${String(order.id).padStart(4, '0')}` : 'ORD#----';
  const deliveryWindow = useMemo(() => formatTimeSlotForUI(order?.deliveryTimeSlot ?? ''), [order?.deliveryTimeSlot]);
  const createdAtLabel = useMemo(() => formatDateTime(order?.createdAt), [order?.createdAt]);
  const deliveryDateLabel = useMemo(() => formatDateOnly(order?.deliveryDate), [order?.deliveryDate]);
  const visibleItems = useMemo(() => (order?.items ?? []).slice(0, 3), [order?.items]);
  const remainingItems = Math.max(0, (order?.items?.length ?? 0) - visibleItems.length);
  const paymentStatus = (order?.paymentStatus ?? 'PENDING').toUpperCase();
  const paymentChip = PAYMENT_STATUS_LABELS[paymentStatus] ?? PAYMENT_STATUS_LABELS.PENDING;
  const statusLabel = STATUS_LABELS[order?.status ?? 'PENDING'] ?? STATUS_LABELS.PENDING;

  const handleDownload = () => {
    if (!order) return;
    try {
      setIsDownloading(true);
      printOrderTicket(order);
    } finally {
      setTimeout(() => setIsDownloading(false), 500);
    }
  };

  return (
    <aside className="relative rounded-[2rem] border border-white/10 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-white shadow-[0_20px_50px_rgba(15,23,42,0.45)] overflow-hidden">
      <div className="absolute inset-0 opacity-70" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.08), transparent 45%)' }} />
      <div className="relative z-10 flex flex-col gap-6 p-6 md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.5em] text-white/60">Ticket</p>
            <p className="text-3xl font-headline">{orderNumber}</p>
            <p className="text-sm text-white/70">Creado {createdAtLabel}</p>
          </div>
          <div className="text-right space-y-2">
            <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold', paymentChip.className)}>
              {paymentChip.label}
            </span>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Estado</p>
            <p className="font-semibold text-sm">{statusLabel}</p>
          </div>
        </div>

        <div className="grid gap-4 text-sm">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Cliente</p>
            <p className="text-lg font-semibold">{order?.customerName ?? 'Cliente invitado'}</p>
            <p className="text-white/70 text-sm break-words">{order?.customerEmail ?? '—'}</p>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Entrega</p>
            <p className="text-lg font-semibold">{deliveryDateLabel}</p>
            <p className="text-white/70 text-sm">{deliveryWindow}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Artículos</p>
          {order && visibleItems.length > 0 ? (
            <div className="space-y-2">
              {visibleItems.map(item => (
                <div key={`${item.productId}-${item.productNameSnap}`} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-semibold">{item.productNameSnap}</p>
                    {item.variantNameSnap && <p className="text-white/70 text-xs">{item.variantNameSnap}</p>}
                  </div>
                  <div className="text-right">
                    <p>{formatCurrency(item.unitPrice)}</p>
                    <p className="text-white/60 text-xs">x{item.quantity}</p>
                  </div>
                </div>
              ))}
              {remainingItems > 0 && (
                <p className="text-xs text-white/70">+{remainingItems} artículos adicionales</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-white/70">Estamos cargando los detalles de tu ticket…</p>
          )}
        </div>

        <div className="rounded-2xl bg-white/10 border border-white/20 p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-white/70">Subtotal</span>
            <span className="font-semibold">{formatCurrency(order?.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/70">Descuento</span>
            <span className="font-semibold">-{formatCurrency(order?.couponDiscount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/70">Envío</span>
            <span className="font-semibold">{formatCurrency(order?.shippingCost)}</span>
          </div>
          <div className="flex justify-between text-base font-bold">
            <span>Total pagado</span>
            <span>{formatCurrency(order?.total)}</span>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleDownload}
          disabled={!order || isDownloading}
          className="h-12 rounded-2xl bg-white text-slate-900 font-semibold hover:bg-slate-100"
        >
          <Download className="w-4 h-4 mr-2" />
          {isDownloading ? 'Preparando ticket…' : 'Descargar ticket PDF'}
        </Button>
        <p className="text-center text-[11px] text-white/70">
          Se abrirá una ventana lista para que lo guardes o compartas.
        </p>
      </div>
    </aside>
  );
}
