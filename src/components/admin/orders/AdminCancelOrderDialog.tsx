'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from 'lucide-react';
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
};

const formatMXN = (amount: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

const orderCode = (id: number) => `ORD${String(id).padStart(6, '0')}`;

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  order: AdminOrderListDTO;
  trigger: React.ReactNode;
  onSuccess: (orderId: number) => void;
}

export function AdminCancelOrderDialog({ order, trigger, onSuccess }: Props) {
  const { apiFetch } = useAuth();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('refund');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const options = REFUND_OPTIONS[order.status] ?? [];
  const defaultOption = options.find((o) => o.isDefault) ?? options[0];

  const [selectedValue, setSelectedValue] = useState<string>(
    String(defaultOption?.value ?? 0),
  );
  const [customPct, setCustomPct] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [cancelResult, setCancelResult] = useState<{
    refunded: boolean;
    refundAmount: number;
  } | null>(null);

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

  function resetState() {
    setStep('refund');
    setSelectedValue(String(defaultOption?.value ?? 0));
    setCustomPct('');
    setReason('');
    setCustomReason('');
    setCancelResult(null);
    setIsSubmitting(false);
  }

  function handleOpenChange(value: boolean) {
    if (!value) {
      if (!isSubmitting) {
        setOpen(false);
        // Small delay so the closing animation completes before reset
        setTimeout(resetState, 300);
      }
    } else {
      resetState();
      setOpen(true);
    }
  }

  async function handleSubmit() {
    setIsSubmitting(true);
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

      setCancelResult({
        refunded: Boolean(result.data?.refunded),
        refundAmount: Number(result.data?.refundAmount ?? 0),
      });
      setStep('result');
      onSuccess(order.id);
    } catch (error: any) {
      toast({
        title: 'Error al cancelar pedido',
        description: error?.message || 'Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const hasPayment = order.hasPaymentTransaction && order.paymentStatus === 'SUCCEEDED';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* Trigger rendered by caller */}
      <span onClick={() => handleOpenChange(true)}>{trigger}</span>

      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => {
          if (isSubmitting) e.preventDefault();
        }}
      >
        {/* ── Step 1: Refund percentage ──────────────────────────────── */}
        {step === 'refund' && (
          <>
            <DialogHeader>
              <DialogTitle className="font-headline text-xl text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Cancelar pedido
              </DialogTitle>
              <DialogDescription>
                <span className="font-semibold">{orderCode(order.id)}</span> ·{' '}
                {order.customerName} · Estado:{' '}
                <span className="font-semibold">{STATUS_LABELS[order.status]}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {hasPayment ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Monto cobrado:{' '}
                    <span className="font-semibold text-foreground">
                      {formatMXN(order.total)}
                    </span>{' '}
                    · Vía{' '}
                    <span className="capitalize">
                      {order.paymentGateway ?? 'pasarela desconocida'}
                    </span>
                  </p>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Porcentaje a reembolsar
                    </Label>
                    <RadioGroup
                      value={selectedValue}
                      onValueChange={setSelectedValue}
                      className="space-y-2"
                    >
                      {options.map((opt) => (
                        <div key={opt.value} className="flex items-center space-x-2">
                          <RadioGroupItem
                            value={String(opt.value)}
                            id={`refund-${opt.value}`}
                          />
                          <Label
                            htmlFor={`refund-${opt.value}`}
                            className="cursor-pointer font-normal"
                          >
                            {opt.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>

                    {selectedValue === '-1' && (
                      <div className="flex items-center gap-2 mt-2 pl-6">
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          value={customPct}
                          onChange={(e) => setCustomPct(e.target.value)}
                          placeholder="Ej: 15"
                          className="w-28"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    )}

                    {effectivePct > 0 && (
                      <p className="text-sm font-semibold text-primary mt-1 pl-6">
                        Reembolso estimado: {formatMXN(refundAmount)}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Este pedido no tiene un pago registrado. Se cancelará sin emitir
                  reembolso.
                </p>
              )}
            </div>

            <DialogFooter>
              <Button variant="secondary" onClick={() => handleOpenChange(false)}>
                Cerrar
              </Button>
              <Button
                variant="destructive"
                onClick={() => setStep('reason')}
                disabled={hasPayment && !isRefundStepValid}
              >
                Siguiente
              </Button>
            </DialogFooter>
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
                <Select value={reason} onValueChange={setReason}>
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
                    onChange={(e) => setCustomReason(e.target.value.slice(0, 500))}
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
              <Button variant="secondary" onClick={() => setStep('refund')}>
                Atrás
              </Button>
              <Button
                variant="destructive"
                onClick={() => setStep('confirm')}
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
                onClick={() => setStep('reason')}
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
