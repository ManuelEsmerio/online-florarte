'use client';

import { useReducer } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, X, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { AdminOrderListDTO, OrderStatus } from '@/lib/definitions';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 'refund' | 'reason' | 'confirm' | 'result';

interface RefundOption {
  value: number; // -1 = custom input
  label: string;
  isDefault?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const REFUND_OPTIONS: Record<OrderStatus, RefundOption[]> = {
  PENDING: [
    { value: 100, label: '100% — Reembolso completo', isDefault: true },
    { value: 0, label: 'Sin reembolso' },
  ],
  PROCESSING: [
    { value: 50, label: '50% — Recomendado', isDefault: true },
    { value: 100, label: '100%' },
    { value: 0, label: 'Sin reembolso' },
  ],
  SHIPPED: [
    { value: 20, label: '20% — Recomendado', isDefault: true },
    { value: 50, label: '50%' },
    { value: 0, label: 'Sin reembolso' },
  ],
  DELIVERED: [
    { value: 10, label: '10%', isDefault: true },
    { value: 20, label: '20%' },
    { value: 30, label: '30%' },
    { value: -1, label: 'Porcentaje personalizado' },
    { value: 0, label: 'Sin reembolso' },
  ],
  CANCELLED: [],
  PAYMENT_FAILED: [],
  EXPIRED: [],
};

const CANCELLATION_REASONS = [
  { value: 'out_of_stock', label: 'Sin stock disponible' },
  { value: 'duplicate', label: 'Pedido duplicado' },
  { value: 'customer_request', label: 'Solicitud del cliente' },
  { value: 'payment_issue', label: 'Problema de pago' },
  { value: 'delivery_problem', label: 'Problema de entrega' },
  { value: 'other', label: 'Otro motivo' },
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pendiente',
  PROCESSING: 'En Proceso',
  SHIPPED: 'En Reparto',
  DELIVERED: 'Completado',
  CANCELLED: 'Cancelado',
  PAYMENT_FAILED: 'Pago Fallido',
  EXPIRED: 'Expirado',
};

const formatMXN = (amount: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

const orderCode = (id: number) => `ORD${String(id).padStart(6, '0')}`;

const ADMIN_STATUS_BADGE_CLASSES: Record<OrderStatus, string> = {
  PENDING: 'bg-amber-400/15 text-amber-200 border border-amber-300/30',
  PROCESSING: 'bg-sky-400/15 text-sky-100 border border-sky-300/30',
  SHIPPED: 'bg-cyan-400/15 text-cyan-100 border border-cyan-300/30',
  DELIVERED: 'bg-emerald-400/15 text-emerald-100 border border-emerald-300/30',
  CANCELLED: 'bg-rose-500/20 text-rose-100 border border-rose-400/30',
  PAYMENT_FAILED: 'bg-red-500/15 text-red-100 border border-red-400/30',
  EXPIRED: 'bg-slate-500/20 text-slate-200 border border-slate-400/30',
};

const getAdminStatusBadgeClass = (status: OrderStatus) =>
  ADMIN_STATUS_BADGE_CLASSES[status] ?? 'bg-white/10 text-white border border-white/15';

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  order: AdminOrderListDTO;
  trigger: React.ReactNode;
  onSuccess: (orderId: number) => void;
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

interface DialogState {
  open: boolean;
  step: Step;
  isSubmitting: boolean;
  selectedValue: string;
  customPct: string;
  reason: string;
  customReason: string;
  cancelResult: { refunded: boolean; refundAmount: number } | null;
}

type DialogAction =
  | { type: 'open'; defaultValue: string }
  | { type: 'close' }
  | { type: 'reset'; defaultValue: string }
  | { type: 'set_step'; step: Step }
  | { type: 'set_selected_value'; value: string }
  | { type: 'set_custom_pct'; value: string }
  | { type: 'set_reason'; value: string }
  | { type: 'set_custom_reason'; value: string }
  | { type: 'submit_start' }
  | { type: 'submit_success'; result: { refunded: boolean; refundAmount: number } }
  | { type: 'submit_end' };

function makeInitialState(defaultValue: string): DialogState {
  return {
    open: false,
    step: 'refund',
    isSubmitting: false,
    selectedValue: defaultValue,
    customPct: '',
    reason: '',
    customReason: '',
    cancelResult: null,
  };
}

function dialogReducer(state: DialogState, action: DialogAction): DialogState {
  switch (action.type) {
    case 'open':
      return { ...makeInitialState(action.defaultValue), open: true };
    case 'close':
      return { ...state, open: false };
    case 'reset':
      return makeInitialState(action.defaultValue);
    case 'set_step':
      return { ...state, step: action.step };
    case 'set_selected_value':
      return { ...state, selectedValue: action.value };
    case 'set_custom_pct':
      return { ...state, customPct: action.value };
    case 'set_reason':
      return { ...state, reason: action.value };
    case 'set_custom_reason':
      return { ...state, customReason: action.value };
    case 'submit_start':
      return { ...state, isSubmitting: true };
    case 'submit_success':
      return { ...state, cancelResult: action.result, step: 'result' };
    case 'submit_end':
      return { ...state, isSubmitting: false };
    default:
      return state;
  }
}

export function AdminCancelOrderDialog({ order, trigger, onSuccess }: Props) {
  const { apiFetch } = useAuth();
  const { toast } = useToast();

  const options = REFUND_OPTIONS[order.status] ?? [];
  const defaultOption = options.find((o) => o.isDefault) ?? options[0];
  const defaultValue = String(defaultOption?.value ?? 0);

  const [state, dispatch] = useReducer(dialogReducer, defaultValue, makeInitialState);
  const { open, step, isSubmitting, selectedValue, customPct, reason, customReason, cancelResult } = state;

  const friendlyOrderCode = order.code ?? orderCode(order.id);
  const statusBadgeClass = getAdminStatusBadgeClass(order.status);

  const effectivePct =
    selectedValue === '-1'
      ? Math.min(100, Math.max(0, Number(customPct) || 0))
      : Number(selectedValue);

  const refundAmount = order.hasPaymentTransaction
    ? Math.round(order.total * (effectivePct / 100) * 100) / 100
    : 0;

  const isRefundStepValid =
    selectedValue !== '' &&
    (selectedValue !== '-1' || (Number(customPct) > 0 && Number(customPct) <= 100));

  const isReasonStepValid =
    reason !== '' && (reason !== 'other' || customReason.trim().length > 0);

  function handleOpenChange(value: boolean) {
    if (!value) {
      if (!isSubmitting) {
        dispatch({ type: 'close' });
        // Small delay so the closing animation completes before reset
        setTimeout(() => dispatch({ type: 'reset', defaultValue }), 300);
      }
    } else {
      dispatch({ type: 'open', defaultValue });
    }
  }

  async function handleSubmit() {
    dispatch({ type: 'submit_start' });
    try {
      const response = await apiFetch(`/api/admin/orders/${order.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refundPercentage: effectivePct,
          cancellationReason: reason,
          customReason: customReason.trim() || undefined,
        }),
      });
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'No se pudo cancelar el pedido.');
      }

      dispatch({
        type: 'submit_success',
        result: {
          refunded: Boolean(result.data?.refunded),
          refundAmount: Number(result.data?.refundAmount ?? 0),
        },
      });
      onSuccess(order.id);
    } catch (error: any) {
      toast({
        title: 'Error al cancelar pedido',
        description: error?.message || 'Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      dispatch({ type: 'submit_end' });
    }
  }

  const hasPayment = order.hasPaymentTransaction && order.paymentStatus === 'SUCCEEDED';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* Trigger rendered by caller */}
      <span onClick={() => handleOpenChange(true)}>{trigger}</span>

      <DialogContent
        className={cn(
          step === 'refund'
            ? 'max-w-xl overflow-hidden rounded-[2.2rem] border border-white/10 bg-[#08090c] p-0 text-slate-100 shadow-[0_35px_80px_rgba(0,0,0,0.75)]'
            : 'sm:max-w-md rounded-2xl bg-background p-6 text-foreground'
        )}
        onInteractOutside={(e) => {
          if (isSubmitting) e.preventDefault();
        }}
      >
        {/* ── Step 1: Refund percentage ──────────────────────────────── */}
        {step === 'refund' && (
          <>
            <DialogHeader className="sr-only">
              <DialogTitle>Cancelar pedido</DialogTitle>
              <DialogDescription>Selecciona el porcentaje de reembolso</DialogDescription>
            </DialogHeader>
            <div className="relative px-8 pt-12 pb-8 bg-[#101116] text-center">
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
                className="absolute top-5 right-5 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mx-auto flex flex-col items-center gap-5">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]">
                  <AlertTriangle className="h-11 w-11" />
                </div>
                <div className="max-w-sm space-y-3">
                  <h2 className="text-3xl font-black tracking-tight">Cancelar pedido</h2>
                  <p className="text-sm text-slate-400">
                    Revisa los detalles del pedido <span className="font-semibold text-white">{friendlyOrderCode}</span> antes de confirmar la cancelación.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-8 py-8 space-y-6">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-slate-400">ID del pedido</p>
                    <p className="text-[10px] uppercase tracking-[0.4em] text-slate-500">Referencia</p>
                  </div>
                  <span className="text-2xl font-black tracking-tight text-white">{friendlyOrderCode}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-400">Estado actual</span>
                  <span className={cn('px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.25em]', statusBadgeClass)}>
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>Cliente</span>
                  <strong className="text-white">{order.customerName}</strong>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>Monto total</span>
                  <strong className="text-white">{formatMXN(order.total)}</strong>
                </div>
              </div>

              {hasPayment ? (
                <div className="space-y-4">
                  <p className="text-sm text-slate-300">
                    Se registró un pago vía <span className="capitalize text-white font-semibold">{order.paymentGateway ?? 'pasarela'}</span>. Selecciona el porcentaje que deseas reembolsar.
                  </p>

                  <RadioGroup
                    value={selectedValue}
                    onValueChange={(v) => dispatch({ type: 'set_selected_value', value: v })}
                    className="grid gap-3 sm:grid-cols-2"
                  >
                    {options.map((opt) => {
                      const optionValue = String(opt.value);
                      const isSelected = selectedValue === optionValue;
                      return (
                        <label
                          key={opt.value}
                          htmlFor={`refund-${opt.value}`}
                          className={cn(
                            'flex cursor-pointer items-center justify-between rounded-2xl border px-5 py-4 transition-all',
                            isSelected
                              ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.12)] text-white shadow-[0_18px_40px_hsl(var(--primary)/0.35)]'
                              : 'border-white/10 bg-white/5 text-slate-200 hover:border-white/30'
                          )}
                        >
                          <div className="flex flex-col text-left">
                            <span className="text-sm font-semibold leading-tight">{opt.label}</span>
                            {opt.value === -1 && (
                              <span className="text-xs text-slate-400">Define un porcentaje personalizado</span>
                            )}
                          </div>
                          <RadioGroupItem
                            value={optionValue}
                            id={`refund-${opt.value}`}
                            className={cn(
                              'h-5 w-5 rounded-full border-2 border-white/30 text-[hsl(var(--primary))] transition-colors',
                              isSelected && 'border-[hsl(var(--primary))]'
                            )}
                          />
                        </label>
                      );
                    })}
                  </RadioGroup>

                  {selectedValue === '-1' && (
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={customPct}
                        onChange={(e) => dispatch({ type: 'set_custom_pct', value: e.target.value })}
                        placeholder="Ej: 15"
                        className="h-12 flex-1 rounded-2xl border border-white/15 bg-black/40 text-center text-base font-semibold text-white placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary)/0.4)]"
                      />
                      <span className="text-sm font-semibold text-slate-300">%</span>
                    </div>
                  )}

                  {effectivePct > 0 && (
                    <p className="text-sm font-semibold text-[hsl(var(--primary))]">
                      Reembolso estimado: {formatMXN(refundAmount)}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex gap-3 rounded-2xl border border-amber-300/30 bg-amber-400/10 p-4 text-sm leading-relaxed text-amber-50">
                  <AlertTriangle className="h-5 w-5 text-amber-200 flex-shrink-0" />
                  <p>
                    Este pedido no tiene un pago registrado. Se cancelará permanentemente <span className="font-semibold">sin emitir reembolso</span>.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleOpenChange(false)}
                  className="flex-1 h-12 rounded-xl border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                >
                  Volver
                </Button>
                <Button
                  type="button"
                  onClick={() => dispatch({ type: 'set_step', step: 'reason' })}
                  disabled={hasPayment && !isRefundStepValid}
                  className="flex-1 h-12 rounded-xl bg-[hsl(var(--primary))] text-sm font-bold uppercase tracking-[0.2em] text-white shadow-[0_18px_40px_hsl(var(--primary)/0.35)] hover:bg-[hsl(var(--primary))] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continuar
                </Button>
              </div>
            </div>

            <div className="bg-black/40 px-8 py-5 text-center text-[10px] font-bold uppercase tracking-[0.5em] text-slate-500">
              Florarte · Admin
            </div>
          </>
        )}

        {/* ── Step 2: Cancellation reason ────────────────────────────── */}
        {step === 'reason' && (
          <>
            <DialogHeader>
              <DialogTitle className="font-headline text-xl">
                Motivo de cancelación
              </DialogTitle>
              <DialogDescription>
                Selecciona el motivo para registrar en el historial de auditoría.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="reason-select">Motivo</Label>
                <Select value={reason} onValueChange={(v) => dispatch({ type: 'set_reason', value: v })}>
                  <SelectTrigger id="reason-select">
                    <SelectValue placeholder="Selecciona un motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {CANCELLATION_REASONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(reason === 'other' || reason !== '') && (
                <div className="space-y-2">
                  <Label htmlFor="custom-reason">
                    {reason === 'other' ? 'Descripción (requerida)' : 'Notas adicionales (opcional)'}
                  </Label>
                  <Textarea
                    id="custom-reason"
                    value={customReason}
                    onChange={(e) => dispatch({ type: 'set_custom_reason', value: e.target.value.slice(0, 500) })}
                    placeholder="Escribe aquí..."
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {customReason.length}/500
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="secondary" onClick={() => dispatch({ type: 'set_step', step: 'refund' })}>
                Atrás
              </Button>
              <Button
                variant="destructive"
                onClick={() => dispatch({ type: 'set_step', step: 'confirm' })}
                disabled={!isReasonStepValid}
              >
                Siguiente
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ── Step 3: Final confirmation ─────────────────────────────── */}
        {step === 'confirm' && (
          <>
            <DialogHeader>
              <DialogTitle className="font-headline text-xl text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Confirma la cancelación
              </DialogTitle>
              <DialogDescription>
                Esta acción no se puede deshacer. Revisa el resumen antes de continuar.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-sm">
              <div className="rounded-lg border p-3 space-y-1.5 bg-muted/40">
                <p>
                  <span className="font-medium">Pedido:</span>{' '}
                  {orderCode(order.id)} · {order.customerName}
                </p>
                <p>
                  <span className="font-medium">Estado actual:</span>{' '}
                  {STATUS_LABELS[order.status]}
                </p>
                {hasPayment && effectivePct > 0 ? (
                  <>
                    <p>
                      <span className="font-medium">Reembolso:</span>{' '}
                      {effectivePct}% = {formatMXN(refundAmount)} vía{' '}
                      <span className="capitalize">
                        {order.paymentGateway ?? 'pasarela'}
                      </span>
                    </p>
                  </>
                ) : (
                  <p>
                    <span className="font-medium">Reembolso:</span> Sin reembolso
                  </p>
                )}
                <p>
                  <span className="font-medium">Motivo:</span>{' '}
                  {CANCELLATION_REASONS.find((r) => r.value === reason)?.label ?? reason}
                </p>
                {customReason.trim() && (
                  <p>
                    <span className="font-medium">Notas:</span> {customReason}
                  </p>
                )}
              </div>

              <p className="text-destructive font-semibold text-center">
                ¿Estás seguro de que quieres cancelar este pedido?
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => dispatch({ type: 'set_step', step: 'reason' })}
                disabled={isSubmitting}
              >
                Atrás
              </Button>
              <Button
                variant="destructive"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cancelando...
                  </>
                ) : (
                  'Sí, cancelar pedido'
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ── Step 4: Result ─────────────────────────────────────────── */}
        {step === 'result' && cancelResult !== null && (
          <>
            <DialogHeader>
              <DialogTitle className="font-headline text-xl flex items-center gap-2">
                {cancelResult.refunded ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                )}
                Pedido cancelado
              </DialogTitle>
            </DialogHeader>

            <div className="py-4 text-center space-y-2">
              <p className="font-semibold">{orderCode(order.id)}</p>
              {cancelResult.refunded ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Se procesó un reembolso de{' '}
                    <span className="font-semibold text-foreground">
                      {formatMXN(cancelResult.refundAmount)}
                    </span>
                    . El cliente lo recibirá en 5–12 días hábiles.
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  El pedido fue cancelado sin reembolso.
                </p>
              )}
            </div>

            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)}>Cerrar</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
