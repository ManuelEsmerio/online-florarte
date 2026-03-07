// src/components/orders/DialogCell.tsx
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Order } from '@/lib/definitions';
import Link from 'next/link';
import { 
    CheckCircle, 
    Package, 
    Truck, 
    XCircle, 
    Ban, 
    Star, 
    Clock, 
    CreditCard, 
    Heart, 
        Headphones, 
                CalendarDays,
                MapPin,
                UserRound,
        Lock,
        X,
        AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { handleApiResponse } from '@/utils/handleApiResponse';
import { formatTimeSlotForUI, cn } from '@/lib/utils';

const getStatusVariant = (status: string): 'default' | 'destructive' | 'secondary' | 'success' => {
  switch (status) {
    case 'completado':
      return 'success';
    case 'en_reparto':
      return 'default';
    case 'cancelado':
      return 'destructive';
    default:
      return 'secondary';
  }
};

const statusIcons: Record<string, React.ReactNode> = {
    'pendiente': <Clock className="mr-2 h-4 w-4" />,
    'completado': <CheckCircle className="mr-2 h-4 w-4" />,
    'en_reparto': <Truck className="mr-2 h-4 w-4" />,
    'procesando': <Package className="mr-2 h-4 w-4" />,
    'cancelado': <XCircle className="mr-2 h-4 w-4" />,
};

const statusTranslations: Record<string, string> = {
    'pendiente': 'Pendiente',
    'procesando': 'En Proceso',
    'en_reparto': 'En Camino',
    'completado': 'Completado',
    'cancelado': 'Cancelado',
}

const paymentStatusTranslations: Record<string, string> = {
    PENDING: 'Pendiente',
    SUCCEEDED: 'Pagado',
    FAILED: 'Fallido',
    CANCELED: 'Cancelado',
};

const getPaymentStatusBadgeClass = (status?: string) => {
    switch (status) {
        case 'SUCCEEDED':
            return 'bg-green-100 text-green-700 border-none';
        case 'FAILED':
            return 'bg-red-100 text-red-700 border-none';
        case 'CANCELED':
            return 'bg-slate-100 text-slate-600 border-none';
        default:
            return 'bg-amber-100 text-amber-700 border-none';
    }
};

const getCancelStatusBadgeClass = (status: string) => {
    switch (status) {
        case 'pendiente':
            return 'bg-amber-400/10 text-amber-200 border border-amber-300/30';
        case 'procesando':
            return 'bg-sky-400/15 text-sky-200 border border-sky-300/30';
        case 'en_reparto':
            return 'bg-cyan-400/15 text-cyan-200 border border-cyan-300/30';
        case 'completado':
            return 'bg-emerald-400/15 text-emerald-200 border border-emerald-300/30';
        case 'cancelado':
            return 'bg-rose-500/15 text-rose-200 border border-rose-400/30';
        default:
            return 'bg-zinc-700/40 text-zinc-100 border border-white/5';
    }
};

const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return 'N/A';
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
};

const OrderDetailsSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">
        <div className="lg:col-span-7 space-y-8">
            <section>
                <div className="flex items-center justify-between mb-6">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, idx) => (
                        <div key={idx} className="flex items-center gap-4 md:gap-5 rounded-2xl p-3 border border-border/40">
                            <Skeleton className="h-20 w-20 md:h-24 md:w-24 rounded-xl shrink-0" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-5 w-2/3" />
                                <Skeleton className="h-4 w-1/2" />
                                <Skeleton className="h-4 w-1/3" />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section>
                <Skeleton className="h-3 w-24 mb-4" />
                <div className="rounded-2xl p-6 border border-border/40 space-y-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-7 w-11/12" />
                    <Skeleton className="h-px w-full" />
                    <div className="flex justify-between items-center">
                        <Skeleton className="h-3 w-14" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                </div>
            </section>
        </div>

        <div className="lg:col-span-5 space-y-6">
            <section>
                <Skeleton className="h-3 w-36 mb-4" />
                <div className="rounded-2xl p-5 md:p-6 border border-border/40 space-y-5">
                    {Array.from({ length: 3 }).map((_, idx) => (
                        <div key={idx} className="flex gap-3">
                            <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-3 w-24" />
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-2/3" />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section>
                <Skeleton className="h-3 w-28 mb-4" />
                <div className="rounded-2xl p-5 border border-border/40 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-xl" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-5 w-20 rounded-full" />
                        </div>
                    </div>
                    <Skeleton className="h-10 w-20 rounded-xl" />
                </div>
            </section>

            <section>
                <div className="rounded-2xl p-5 md:p-6 border border-border/40 space-y-3">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-px w-full" />
                    <div className="flex justify-between items-end">
                        <div className="space-y-2">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-3 w-14" />
                        </div>
                        <Skeleton className="h-9 w-24" />
                    </div>
                </div>
            </section>
        </div>
    </div>
);

type PaymentGateway = 'stripe' | 'mercadopago';

const ReviewForm = ({ orderId, onReviewSubmit, onCancel }: { orderId: number, onReviewSubmit: () => void, onCancel: () => void }) => {
    const { toast } = useToast();
    const { apiFetch } = useAuth();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [hoverRating, setHoverRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            toast({ title: "Calificación requerida", description: "Por favor, selecciona de 1 a 5 estrellas.", variant: "destructive"});
            return;
        }
        if (comment.length < 10) {
            toast({ title: "Comentario muy corto", description: "Por favor, escribe un poco más sobre tu experiencia.", variant: "destructive"});
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await apiFetch('/api/testimonials', {
                method: 'POST',
                body: JSON.stringify({
                    orderId: orderId,
                    rating: rating,
                    comment: comment,
                }),
            });

            const result = await handleApiResponse<{ message?: string }>(response, {});
            toast({ title: '¡Reseña enviada!', description: result.message });
            onReviewSubmit();
        } catch (error: any) {
            toast({ title: "Error al enviar reseña", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
         <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            <div className="text-center">
                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground block mb-4">Tu calificación</label>
                <div className="flex items-center justify-center gap-2" onMouseLeave={() => setHoverRating(0)}>
                    {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={cn(
                            "h-10 w-10 cursor-pointer transition-all duration-200",
                            (hoverRating >= star || rating >= star) ? 'text-yellow-400 fill-yellow-400 scale-110' : 'text-muted-foreground hover:scale-105'
                        )}
                        onMouseEnter={() => setHoverRating(star)}
                        onClick={() => setRating(star)}
                    />
                    ))}
                </div>
            </div>
             <div>
                <label htmlFor="comment" className="text-sm font-bold uppercase tracking-widest text-muted-foreground block mb-2">Tu comentario</label>
                <Textarea
                    id="comment"
                    placeholder="Cuéntanos sobre tu experiencia con el producto y nuestro servicio..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[120px] rounded-2xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20"
                />
            </div>
            <DialogFooter className="flex-col gap-2">
                <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg" loading={isSubmitting}>Enviar Reseña</Button>
                <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting} className="w-full">Cancelar</Button>
            </DialogFooter>
        </form>
    );
}

export const DialogCell = ({ row, trigger, onDataChange }: { row: any, trigger: React.ReactNode, onDataChange?: () => void }) => {
    const { toast } = useToast();
    const { apiFetch } = useAuth();
    const [isCancelling, setIsCancelling] = useState(false);
    const [isStartingPayment, setIsStartingPayment] = useState(false);
    const [isFetchingDetails, setIsFetchingDetails] = useState(false);
    const [isCancelAlertOpen, setIsCancelAlertOpen] = useState(false);
    const [isPayAlertOpen, setIsPayAlertOpen] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [cancellationInfo, setCancellationInfo] = useState<{canCancel: boolean, message: string}>({canCancel: false, message: ''});
    const [cancelResult, setCancelResult] = useState<{ refunded: boolean } | null>(null);
    const [view, setView] = useState<'details' | 'review'>('details');
    const [paymentStatus, setPaymentStatus] = useState<string>(String((row as any).payment_status || 'PENDING'));
    const [hasPaymentTransaction, setHasPaymentTransaction] = useState<boolean>(Boolean((row as any).has_payment_transaction));
    const [detailedOrder, setDetailedOrder] = useState<any | null>(null);
    const [hasSubmittedReview, setHasSubmittedReview] = useState(Boolean((row as any).testimonial));

     const fetchOrderDetails = useCallback(async () => {
          setIsFetchingDetails(true);
        try {
            const res = await apiFetch(`/api/orders/${row.id}/details`);
            const data = await handleApiResponse<{ order?: any; cancellationInfo?: { canCancel: boolean; message: string } }>(res, {});
            if (data?.cancellationInfo) {
                setCancellationInfo(data.cancellationInfo);
            }
            if (data?.order) {
                setDetailedOrder(data.order);
                setHasSubmittedReview(Boolean(data.order.testimonial));
            }
            if (data?.order?.payment_status) {
                setPaymentStatus(String(data.order.payment_status));
            }
            if (typeof data?.order?.has_payment_transaction === 'boolean') {
                setHasPaymentTransaction(Boolean(data.order.has_payment_transaction));
            }
        } catch (error: any) {
            console.error("Failed to fetch order details:", error.message);
        } finally {
            setIsFetchingDetails(false);
        }
    }, [apiFetch, row.id]);

    const handlePayNow = async (gateway: PaymentGateway) => {
        setIsStartingPayment(true);
        try {
            const endpoint = gateway === 'mercadopago'
                ? '/api/mercadopago/checkout-session/order'
                : '/api/stripe/checkout-session/order';

            const response = await apiFetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: row.id }),
            });

            const result = await handleApiResponse<{ checkoutUrl?: string }>(response);

            if (!result?.checkoutUrl) {
                throw new Error('No se recibió una URL de pago válida.');
            }

            window.location.href = result.checkoutUrl;
        } catch (error: any) {
            toast({ title: 'No se pudo iniciar el pago', description: error.message, variant: 'destructive' });
            setIsStartingPayment(false);
        }
    };

    const handleCancelOrder = async () => {
        setIsCancelling(true);
        try {
            const response = await apiFetch(`/api/orders/${row.id}/cancel`, { method: 'POST' });
            const data = await handleApiResponse<{ refunded?: boolean }>(response);
            setIsCancelAlertOpen(false);
            setConfirmText('');
            setCancelResult({ refunded: data?.refunded === true });
            // Refresh the list in the background so the table is up to date when the modal closes
            if (onDataChange) onDataChange();
        } catch (error: any) {
            toast({ title: 'Error al cancelar', description: error.message, variant: 'destructive' });
        } finally {
            setIsCancelling(false);
        }
    };
    
    const onReviewSubmit = () => {
        setView('details');
        setHasSubmittedReview(true);
        if (onDataChange) onDataChange();
        else window.location.reload();
    }

    const currentOrder = detailedOrder ?? row;
    const isUnpaidOrder = !hasPaymentTransaction && paymentStatus !== 'SUCCEEDED';
    const orderCode = `ORD$${String(currentOrder.id).padStart(4, '0')}`;
    const createdAtValue = (currentOrder as any).created_at ?? currentOrder.createdAt;
    const createdAtLabel = createdAtValue
        ? new Date(createdAtValue).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'Fecha no disponible';
    const deliveryDateValue = (currentOrder as any).delivery_date ?? currentOrder.deliveryDate;
    const deliveryDateLabel = deliveryDateValue
        ? new Date(deliveryDateValue).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'No disponible';
    const deliveryTimeSlot = formatTimeSlotForUI((currentOrder as any).delivery_time_slot ?? currentOrder.deliveryTimeSlot);
    const shippingAddress = (currentOrder as any).shippingAddress ?? (currentOrder as any).shippingAddressSnapshot ?? (currentOrder as any).shipping_address_snapshot ?? 'No especificada';
    const recipientName = (currentOrder as any).recipient_name ?? (currentOrder as any).recipientName ?? 'No especificado';
    const recipientPhone = (currentOrder as any).recipient_phone ?? (currentOrder as any).recipientPhone ?? 'No especificado';
    const couponDiscount = (currentOrder as any).coupon_discount ?? (currentOrder as any).couponDiscount;
    const shippingCost = (currentOrder as any).shipping_cost ?? (currentOrder as any).shippingCost;
    const couponCode = (currentOrder as any).couponCode ?? (currentOrder as any).couponCodeSnap ?? (currentOrder as any).coupon_code ?? (currentOrder as any).coupon_code_snap;
    const couponTypeRaw = String((currentOrder as any).coupon_type ?? (currentOrder as any).couponType ?? '').toUpperCase();
    const couponValue = (currentOrder as any).coupon_value ?? (currentOrder as any).couponValue ?? null;
    const couponTypeLabel = couponTypeRaw === 'PERCENTAGE'
        ? 'Porcentaje'
        : couponTypeRaw === 'FIXED'
            ? 'Monto fijo'
            : null;
    const isGuestOrder = Boolean((currentOrder as any).is_guest ?? (currentOrder as any).isGuest);
    const guestName = (currentOrder as any).guest_name ?? (currentOrder as any).guestName ?? null;
    const guestEmail = (currentOrder as any).guest_email ?? (currentOrder as any).guestEmail ?? null;
    const guestPhone = (currentOrder as any).guest_phone ?? (currentOrder as any).guestPhone ?? null;
    const hasReview = hasSubmittedReview || Boolean((currentOrder as any).testimonial);
    const normalizedStatus = String((currentOrder as any).status ?? row.status ?? 'pendiente').toLowerCase();
    const readableStatus = statusTranslations[normalizedStatus] ?? 'En proceso';
    const statusBadgeClass = getCancelStatusBadgeClass(normalizedStatus);
    const numericOrderId = Number((currentOrder as any).id ?? row.id ?? 0);
    const friendlyOrderCode = (currentOrder as any).code ?? `#FLA-${String(numericOrderId || 0).padStart(5, '0')}`;
    const cancellationMessage = cancellationInfo.message || (hasPaymentTransaction
        ? 'Este pedido cuenta con un pago confirmado. Al cancelar iniciaremos el reembolso al método original.'
        : 'Este pedido no tiene un pago registrado. Se cancelará permanentemente sin emitir reembolso.');
    const isConfirmDisabled = confirmText !== 'CANCELAR' || isCancelling || !cancellationInfo.canCancel;
    
    return (
        <>
        <AlertDialog open={isCancelAlertOpen} onOpenChange={(open) => { setIsCancelAlertOpen(open); if (!open) setConfirmText(''); }}>
            <AlertDialogContent className="max-w-lg p-0 overflow-hidden rounded-[2.2rem] border border-white/10 bg-[#08090c] text-slate-100 shadow-[0_30px_90px_rgba(0,0,0,0.78)]">
                <div className="relative px-8 pt-12 pb-7 bg-[#101114] text-center">
                    <AlertDialogCancel asChild>
                        <button
                            type="button"
                            className="absolute top-5 right-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-40"
                            disabled={isCancelling}
                            aria-label="Cerrar"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </AlertDialogCancel>

                    <div className="flex flex-col items-center gap-5">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]">
                            <AlertTriangle className="h-11 w-11" />
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-3xl font-black tracking-tight">Cancelar pedido</h2>
                            <p className="text-sm text-slate-400 max-w-sm">
                                Por favor, revisa los detalles antes de confirmar la cancelación. Esta acción no se puede deshacer.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="px-8 py-8 space-y-6">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
                        <div className="flex items-center justify-between pb-4 border-b border-white/10">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-slate-400">ID del pedido</p>
                                <p className="text-[10px] uppercase tracking-[0.4em] text-slate-500">Referencia interna</p>
                            </div>
                            <span className="text-xl font-black tracking-tight text-white">{friendlyOrderCode}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.4em] text-slate-400">Estado actual</span>
                            <span className={cn('px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.25em]', statusBadgeClass)}>
                                {readableStatus}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-3 rounded-2xl border border-[hsl(var(--primary)/0.35)] bg-[hsl(var(--primary)/0.08)] p-4 text-sm leading-relaxed">
                        <AlertTriangle className="h-5 w-5 text-[hsl(var(--primary))] flex-shrink-0" />
                        <p className="text-slate-200">{cancellationMessage}</p>
                    </div>

                    <div>
                        <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.4em] text-slate-500">
                            Validación de seguridad
                        </label>
                        <Input
                            autoComplete="off"
                            placeholder="Escribe CANCELAR para confirmar"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            className="h-13 rounded-2xl border border-white/10 bg-black/40 text-center text-base font-semibold text-white placeholder:text-slate-600 focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary)/0.4)]"
                            disabled={isCancelling}
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <AlertDialogCancel className="flex-1 h-12 rounded-xl border border-white/10 bg-white/5 text-sm font-bold uppercase tracking-[0.2em] text-slate-200 hover:bg-white/10" disabled={isCancelling}>
                            Volver
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCancelOrder}
                            disabled={isConfirmDisabled}
                            className="flex-1 h-12 rounded-xl bg-[hsl(var(--primary))] text-sm font-bold uppercase tracking-[0.2em] text-white shadow-[0_18px_35px_hsl(var(--primary)/0.35)] hover:bg-[hsl(var(--primary))] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-30"
                            loading={isCancelling}
                        >
                            Confirmar cancelación
                        </AlertDialogAction>
                    </div>
                </div>

                <div className="bg-black/50 px-8 py-5 flex items-center justify-center gap-3 text-[11px] font-bold uppercase tracking-[0.5em] text-slate-500">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))] text-base font-black">F</span>
                    Florarte
                </div>
            </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={isPayAlertOpen} onOpenChange={setIsPayAlertOpen}>
            <AlertDialogContent className="max-w-md rounded-[2.5rem] overflow-hidden border border-white/20 dark:border-white/5 shadow-2xl bg-white dark:bg-slate-900 p-0">
                <div className="relative p-8 pt-12 text-center">
                    <AlertDialogCancel asChild>
                        <button
                            type="button"
                            className="absolute top-6 right-6 rounded-full h-10 w-10 bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/80 flex items-center justify-center border border-transparent hover:bg-slate-200 hover:text-slate-700 transition-colors"
                            disabled={isStartingPayment}
                            aria-label="Cerrar"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </AlertDialogCancel>

                    <AlertDialogHeader className="text-center space-y-2">
                        <AlertDialogTitle className="font-headline text-3xl text-slate-900 dark:text-white">
                            Método de Pago
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 dark:text-slate-400 text-sm">
                            Elige cómo deseas pagar este pedido.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="space-y-4 my-8">
                        <AlertDialogAction
                            onClick={() => handlePayNow('stripe')}
                            className="w-full py-4 px-6 rounded-full flex items-center justify-center gap-3 text-white font-bold text-lg shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-primary to-accent"
                            loading={isStartingPayment}
                            disabled={isStartingPayment}
                        >
                            <CreditCard className="w-5 h-5" />
                            Pagar con Stripe
                        </AlertDialogAction>

                        <AlertDialogAction
                            onClick={() => handlePayNow('mercadopago')}
                            className="w-full py-4 px-6 rounded-full flex items-center justify-center gap-3 text-white font-bold text-lg shadow-lg shadow-sky-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-[#009EE3] to-[#34B3EB]"
                            loading={isStartingPayment}
                            disabled={isStartingPayment}
                        >
                            <CreditCard className="w-5 h-5" />
                            Pagar con Mercado Pago
                        </AlertDialogAction>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.3em]">
                        <Lock className="w-3.5 h-3.5" />
                        Pago Seguro & Encriptado
                    </div>
                </div>
                <div className="h-1 w-full bg-gradient-to-r from-primary via-[#009EE3] to-primary opacity-40" />
            </AlertDialogContent>
        </AlertDialog>

        <Dialog onOpenChange={(open) => {
            if (open) {
                void fetchOrderDetails();
            } else {
                setTimeout(() => { setView('details'); setCancelResult(null); }, 300);
            }
        }}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="w-[96vw] max-w-6xl p-0 max-h-[92vh] overflow-hidden border-border/50 shadow-2xl rounded-[2rem] flex flex-col">
                <DialogHeader className="px-6 md:px-10 pt-8 md:pt-10 pb-6 border-b border-border/50 text-left">
                    <DialogTitle className='font-headline text-3xl md:text-5xl font-bold tracking-tight'>
                        {view === 'review' ? 'Califica tu Pedido' : (
                            <>Detalles del Pedido: <span className="text-primary italic">{orderCode}</span></>
                        )}
                    </DialogTitle>
                    {view === 'details' && (
                        <p className="text-muted-foreground mt-2 flex items-center gap-2 text-sm">
                            <CalendarDays className="h-4 w-4" />
                            Realizado el {createdAtLabel}
                        </p>
                    )}
                </DialogHeader>

                <div className="flex-1 overflow-y-auto custom-scrollbar px-6 md:px-10 py-6 md:py-8">
                    {cancelResult !== null ? (
                        <div className="flex flex-col items-center justify-center text-center py-10 gap-6 max-w-sm mx-auto">
                            <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
                                <CheckCircle className="w-10 h-10 text-green-500" />
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-2xl font-bold font-headline">Tu pedido fue cancelado exitosamente.</h3>
                                {cancelResult.refunded ? (
                                    <>
                                        <p className="text-muted-foreground leading-relaxed">
                                            Tu reembolso ya está en proceso. El dinero será devuelto al método de pago original.
                                        </p>
                                        <p className="text-sm font-semibold text-foreground">
                                            El proceso puede tardar entre 5 y 12 días hábiles dependiendo de tu banco.
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-muted-foreground leading-relaxed">
                                        Como el pedido no había sido pagado, no se generará ningún reembolso.
                                    </p>
                                )}
                            </div>
                            <Link
                                href="/customer-service"
                                className="text-sm text-primary underline underline-offset-4 font-medium"
                            >
                                ¿El reembolso tarda más de lo esperado? Contactar soporte
                            </Link>
                        </div>
                    ) : view === 'review' ? (
                        <ReviewForm orderId={currentOrder.id} onReviewSubmit={onReviewSubmit} onCancel={() => setView('details')} />
                    ) : isFetchingDetails ? (
                        <OrderDetailsSkeleton />
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">
                            <div className="lg:col-span-7 space-y-8">
                                <section>
                                    <div className="flex items-center justify-between mb-6 gap-3">
                                        <h4 className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground">Artículos ({currentOrder.items?.length ?? 0})</h4>
                                        <Badge variant={getStatusVariant(currentOrder.status)} className="h-6 text-[10px] px-3 uppercase tracking-wider font-bold">
                                            {statusTranslations[currentOrder.status]}
                                        </Badge>
                                    </div>
                                    <div className="space-y-4">
                                        {currentOrder.items?.map((item: any, index: number) => (
                                            <div key={index} className="flex items-center gap-4 md:gap-5 rounded-2xl p-3 border border-transparent hover:border-border/50 hover:bg-muted/20 transition-colors">
                                                <div className="relative h-20 w-20 md:h-24 md:w-24 shrink-0 rounded-xl overflow-hidden bg-muted/40">
                                                    <Image src={item.image || '/placehold.webp'} alt={item.product_name || 'Producto'} fill className="object-cover" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-base md:text-xl leading-tight">{item.product_name}</p>
                                                    {item.variant_name ? <p className="text-sm text-muted-foreground mt-1 truncate">{item.variant_name}</p> : null}
                                                    <div className="mt-2 flex items-center gap-3">
                                                        <span className="text-xs px-2 py-1 rounded-md bg-muted font-medium">Cant: {item.quantity}</span>
                                                        <span className="text-primary font-bold text-lg">{formatCurrency(item.price * item.quantity)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section>
                                    <h4 className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground mb-4">Dedicatoria</h4>
                                    <div className="bg-card/60 rounded-2xl p-6 md:p-7 border border-border/50 relative overflow-hidden">
                                        <div className="absolute -right-5 -top-5 opacity-10">
                                            <Heart className="w-24 h-24 text-primary fill-primary" />
                                        </div>
                                        <div className="relative z-10 space-y-4">
                                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                                <Heart className="w-3.5 h-3.5 text-primary fill-primary" />
                                                <span>Mensaje Especial</span>
                                            </div>
                                            <p className="text-lg md:text-2xl font-headline italic leading-relaxed text-foreground/90">
                                                "{row.dedication || 'No se incluyó dedicatoria.'}"
                                            </p>
                                            <Separator className="bg-border/60" />
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Firma</span>
                                                <span className="text-sm font-semibold">{(currentOrder as any).is_anonymous ?? (currentOrder as any).isAnonymous ? 'Anónimo' : ((currentOrder as any).signature || 'No especificada')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <div className="lg:col-span-5 space-y-6">
                                <section>
                                    <h4 className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground mb-4">Información de Entrega</h4>
                                    <div className="bg-card/60 rounded-2xl p-5 md:p-6 border border-border/50 space-y-5">
                                        <div className="flex gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                                <Clock className="w-4 h-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Fecha y horario</p>
                                                <p className="font-semibold">{deliveryDateLabel}</p>
                                                <p className="text-sm text-muted-foreground">Bloque: {deliveryTimeSlot}</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                                <MapPin className="w-4 h-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Dirección de envío</p>
                                                <p className="font-semibold leading-snug">{shippingAddress}</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                                <UserRound className="w-4 h-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Receptor</p>
                                                <p className="font-semibold">{recipientName}</p>
                                                <p className="text-sm text-muted-foreground">{recipientPhone}</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    {isGuestOrder && (
                                        <div className="bg-card/60 rounded-2xl p-5 border border-border/50 space-y-2 mb-6">
                                            <h4 className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground mb-2">Compra como invitado</h4>
                                            <p className="text-sm"><span className="font-semibold">Nombre:</span> {guestName || 'No disponible'}</p>
                                            <p className="text-sm"><span className="font-semibold">Email:</span> {guestEmail || 'No disponible'}</p>
                                            <p className="text-sm"><span className="font-semibold">Teléfono:</span> {guestPhone || recipientPhone || 'No disponible'}</p>
                                        </div>
                                    )}

                                    <h4 className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground mb-4">Detalles del Pago</h4>
                                    <div className="bg-card/60 rounded-2xl p-5 border border-border/50 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                                <CreditCard className="w-4 h-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm">Pago del pedido</p>
                                                <Badge className={cn('mt-1 h-6 text-[10px] font-bold px-2.5 uppercase', getPaymentStatusBadgeClass(paymentStatus))}>
                                                    {paymentStatusTranslations[paymentStatus] ?? paymentStatus}
                                                </Badge>
                                            </div>
                                        </div>
                                        {isUnpaidOrder && currentOrder.status !== 'cancelado' ? (
                                            <Button
                                                className="h-10 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white border-none gap-2"
                                                loading={isStartingPayment}
                                                disabled={isStartingPayment}
                                                onClick={() => setIsPayAlertOpen(true)}
                                            >
                                                <CreditCard className="w-4 h-4" />
                                                Pagar
                                            </Button>
                                        ) : null}
                                    </div>
                                </section>

                                <section>
                                    <div className="bg-card/60 rounded-2xl p-5 md:p-6 border border-border/50 space-y-3">
                                        <h4 className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground mb-2">Resumen</h4>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Subtotal de artículos</span>
                                            <span className="font-medium">{formatCurrency((currentOrder as any).subtotal)}</span>
                                        </div>
                                        {couponDiscount ? (
                                            <>
                                                <div className="flex justify-between text-sm text-green-600 font-medium">
                                                    <span>Descuento ({couponCode || 'Cupón'})</span>
                                                    <span>-{formatCurrency(couponDiscount)}</span>
                                                </div>
                                                {(couponTypeLabel || couponValue !== null) && (
                                                    <div className="text-xs text-muted-foreground space-y-1">
                                                        {couponTypeLabel ? <p>Tipo: <span className="font-semibold">{couponTypeLabel}</span></p> : null}
                                                        {couponValue !== null ? (
                                                            <p>
                                                                Valor: <span className="font-semibold">{couponTypeRaw === 'PERCENTAGE' ? `${Number(couponValue)}%` : formatCurrency(Number(couponValue))}</span>
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                )}
                                            </>
                                        ) : null}
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Costo de envío</span>
                                            <span className="font-medium">{formatCurrency(shippingCost)}</span>
                                        </div>
                                        <div className="pt-4 border-t border-border/60 flex justify-between items-end">
                                            <div>
                                                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Total del pedido</p>
                                                <p className="text-xs text-muted-foreground">IVA incluido</p>
                                            </div>
                                            <span className="text-3xl font-bold text-primary">{formatCurrency((currentOrder as any).total)}</span>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>
                    )}
                </div>

                {view === 'details' && cancelResult === null && (
                    <div className="px-6 md:px-10 py-5 border-t border-border/50 bg-background/80 flex flex-col sm:flex-row gap-3">
                        {isFetchingDetails ? (
                            <>
                                <Skeleton className="h-12 sm:w-48 rounded-xl" />
                                <Skeleton className="h-12 flex-1 rounded-xl" />
                                <Skeleton className="h-12 flex-[1.3] rounded-xl" />
                            </>
                        ) : (
                            <>
                        {currentOrder.status === 'completado' && (
                            <div className="sm:w-auto flex-1">
                                <Button
                                    variant="outline"
                                    className="w-full h-12 rounded-xl border-primary text-primary font-bold hover:bg-primary hover:text-white transition-all gap-2"
                                    onClick={() => setView('review')}
                                    disabled={hasReview}
                                >
                                    <Star className="w-4 h-4" /> Dejar una Reseña
                                </Button>
                                {hasReview && (
                                    <p className="mt-2 text-sm text-muted-foreground flex items-center gap-2" aria-live="polite">
                                        <Lock className="w-4 h-4" /> Ya enviaste una reseña para este pedido. El botón se desactiva para evitar duplicados.
                                    </p>
                                )}
                            </div>
                        )}

                        <Button
                            variant="secondary"
                            disabled={!cancellationInfo.canCancel}
                            className="h-12 rounded-xl font-bold bg-red-50 text-red-500 hover:bg-red-100 border-none gap-2 flex-1"
                            onClick={() => setIsCancelAlertOpen(true)}
                        >
                            <Ban className="w-4 h-4" />
                            Cancelar Pedido
                        </Button>

                        <Button variant="secondary" asChild className="h-12 rounded-xl font-bold bg-zinc-900 text-white hover:bg-zinc-800 border-none gap-2 flex-[1.3]">
                            <Link href="/customer-service">
                                <Headphones className="w-4 h-4" />
                                Contactar Soporte Especializado
                            </Link>
                        </Button>
                            </>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
        </>
    )
};
