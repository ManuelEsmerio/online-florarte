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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Order, OrderStatus } from '@/lib/definitions';
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
  Edit
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import type { Testimonial } from '@/lib/definitions';
import { useAuth } from '@/context/AuthContext';
import { handleApiResponse } from '@/utils/handleApiResponse';
import { formatTimeSlotForUI, cn } from '@/lib/utils';

const getStatusVariant = (status: OrderStatus): 'default' | 'destructive' | 'secondary' | 'success' => {
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

const statusIcons: { [key in OrderStatus]: React.ReactNode } = {
    'pendiente': <Clock className="mr-2 h-4 w-4" />,
    'completado': <CheckCircle className="mr-2 h-4 w-4" />,
    'en_reparto': <Truck className="mr-2 h-4 w-4" />,
    'procesando': <Package className="mr-2 h-4 w-4" />,
    'cancelado': <XCircle className="mr-2 h-4 w-4" />,
};

const statusTranslations: { [key in OrderStatus]: string } = {
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

const ReviewForm = ({ orderId, onReviewSubmit, onCancel, existingReview }: { orderId: number, onReviewSubmit: () => void, onCancel: () => void, existingReview?: Testimonial | null }) => {
    const { toast } = useToast();
    const { apiFetch } = useAuth();
    const [rating, setRating] = useState(existingReview?.rating || 0);
    const [comment, setComment] = useState(existingReview?.comment || '');
    const [hoverRating, setHoverRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const isEditing = !!existingReview?.id;

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

            const result = await handleApiResponse(response);
            toast({ title: isEditing ? '¡Reseña Actualizada!' : '¡Reseña Enviada!', description: result.message });
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

export const DialogCell = ({ row, trigger, onDataChange }: { row: Order, trigger: React.ReactNode, onDataChange?: () => void }) => {
    const { toast } = useToast();
    const { apiFetch } = useAuth();
    const [isCancelling, setIsCancelling] = useState(false);
    const [isStartingPayment, setIsStartingPayment] = useState(false);
    const [isFetchingDetails, setIsFetchingDetails] = useState(false);
    const [cancellationInfo, setCancellationInfo] = useState<{canCancel: boolean, message: string}>({canCancel: false, message: ''});
    const [view, setView] = useState<'details' | 'review'>('details');
    const [paymentStatus, setPaymentStatus] = useState<string>(String((row as any).payment_status || 'PENDING'));
    const [hasPaymentTransaction, setHasPaymentTransaction] = useState<boolean>(Boolean((row as any).has_payment_transaction));

     const fetchOrderDetails = useCallback(async () => {
          setIsFetchingDetails(true);
        try {
            const res = await apiFetch(`/api/orders/${row.id}/details`);
            const data = await handleApiResponse(res);
            if (data?.cancellationInfo) {
                setCancellationInfo(data.cancellationInfo);
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

    const handlePayNow = async () => {
        setIsStartingPayment(true);
        try {
            const response = await apiFetch('/api/stripe/checkout-session/order', {
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
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast({ title: 'Pedido Cancelado', description: 'Tu pedido ha sido cancelado exitosamente (simulación).' });
        window.location.reload();
        setIsCancelling(false);
    };
    
    const onReviewSubmit = () => {
        setView('details');
        if (onDataChange) onDataChange();
        else window.location.reload();
    }

    const isUnpaidOrder = !hasPaymentTransaction && paymentStatus !== 'SUCCEEDED';
    const orderCode = `ORD$${String(row.id).padStart(4, '0')}`;
    const createdAtValue = (row as any).created_at ?? row.createdAt;
    const createdAtLabel = createdAtValue
        ? new Date(createdAtValue).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'Fecha no disponible';
    const deliveryDateValue = (row as any).delivery_date ?? row.deliveryDate;
    const deliveryDateLabel = deliveryDateValue
        ? new Date(deliveryDateValue).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'No disponible';
    const deliveryTimeSlot = formatTimeSlotForUI((row as any).delivery_time_slot ?? row.deliveryTimeSlot);
    const shippingAddress = (row as any).shippingAddress ?? row.shippingAddressSnapshot ?? (row as any).shipping_address_snapshot ?? 'No especificada';
    const recipientName = (row as any).recipient_name ?? row.recipientName ?? 'No especificado';
    const recipientPhone = (row as any).recipient_phone ?? row.recipientPhone ?? 'No especificado';
    const couponDiscount = (row as any).coupon_discount ?? row.couponDiscount;
    const shippingCost = (row as any).shipping_cost ?? row.shippingCost;
    const couponCode = (row as any).couponCode ?? row.couponCodeSnap ?? (row as any).coupon_code ?? (row as any).coupon_code_snap;
    
    return (
        <Dialog onOpenChange={(open) => {
            if (open) {
                void fetchOrderDetails();
            }
            else setTimeout(() => setView('details'), 300);
        }}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="w-[96vw] max-w-6xl p-0 max-h-[92vh] overflow-hidden border-border/50 shadow-2xl rounded-[2rem] flex flex-col">
                <DialogHeader className="px-6 md:px-10 pt-8 md:pt-10 pb-6 border-b border-border/50 text-left">
                    <DialogTitle className='font-headline text-3xl md:text-5xl font-bold tracking-tight'>
                        {view === 'review' ? (row.testimonial ? 'Editar Reseña' : 'Califica tu Pedido') : (
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
                    {view === 'review' ? (
                        <ReviewForm orderId={row.id} onReviewSubmit={onReviewSubmit} onCancel={() => setView('details')} existingReview={row.testimonial as any} />
                    ) : isFetchingDetails ? (
                        <OrderDetailsSkeleton />
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">
                            <div className="lg:col-span-7 space-y-8">
                                <section>
                                    <div className="flex items-center justify-between mb-6 gap-3">
                                        <h4 className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground">Artículos ({row.items?.length ?? 0})</h4>
                                        <Badge variant={getStatusVariant(row.status)} className="h-6 text-[10px] px-3 uppercase tracking-wider font-bold">
                                            {statusTranslations[row.status]}
                                        </Badge>
                                    </div>
                                    <div className="space-y-4">
                                        {row.items?.map((item, index) => (
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
                                                <span className="text-sm font-semibold">{row.is_anonymous ? 'Anónimo' : (row.signature || 'No especificada')}</span>
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
                                        {isUnpaidOrder && row.status !== 'cancelado' ? (
                                            <Button
                                                onClick={handlePayNow}
                                                className="h-10 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white border-none gap-2"
                                                loading={isStartingPayment}
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
                                            <span className="font-medium">{formatCurrency(row.subtotal)}</span>
                                        </div>
                                        {couponDiscount ? (
                                            <div className="flex justify-between text-sm text-green-600 font-medium">
                                                <span>Descuento ({couponCode || 'Cupón'})</span>
                                                <span>-{formatCurrency(couponDiscount)}</span>
                                            </div>
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
                                            <span className="text-3xl font-bold text-primary">{formatCurrency(row.total)}</span>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>
                    )}
                </div>

                {view === 'details' && (
                    <div className="px-6 md:px-10 py-5 border-t border-border/50 bg-background/80 flex flex-col sm:flex-row gap-3">
                        {isFetchingDetails ? (
                            <>
                                <Skeleton className="h-12 sm:w-48 rounded-xl" />
                                <Skeleton className="h-12 flex-1 rounded-xl" />
                                <Skeleton className="h-12 flex-[1.3] rounded-xl" />
                            </>
                        ) : (
                            <>
                        {row.status === 'completado' && (
                            <Button
                                variant="outline"
                                className="sm:w-auto h-12 rounded-xl border-primary text-primary font-bold hover:bg-primary hover:text-white transition-all gap-2"
                                onClick={() => setView('review')}
                            >
                                {row.testimonial ? <><Edit className="w-4 h-4" /> Editar Reseña</> : <><Star className="w-4 h-4" /> Dejar una Reseña</>}
                            </Button>
                        )}

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="secondary"
                                    disabled={!cancellationInfo.canCancel}
                                    className="h-12 rounded-xl font-bold bg-red-50 text-red-500 hover:bg-red-100 border-none gap-2 flex-1"
                                >
                                    <Ban className="w-4 h-4" />
                                    Cancelar Pedido
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="z-[80] rounded-[2rem] border-border/50 shadow-2xl">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="font-headline text-2xl">¿Estás seguro?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-sm leading-relaxed">
                                        {cancellationInfo.message}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="gap-2">
                                    <AlertDialogCancel className="rounded-xl h-11 font-bold">Volver</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleCancelOrder}
                                        className="bg-destructive hover:bg-destructive/90 rounded-xl h-11 font-bold"
                                        loading={isCancelling}
                                    >
                                        Sí, cancelar pedido
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

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
    )
};
