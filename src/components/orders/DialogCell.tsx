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
import { Button } from '@/components/ui/button';
import { Order, OrderStatus } from '@/lib/definitions';
import Link from 'next/link';
import { 
  CheckCircle, 
  Package, 
  PhoneCall, 
  Truck, 
  XCircle, 
  Ban, 
  Star, 
  Clock, 
  CreditCard, 
  Heart, 
  Headphones, 
  ArrowRight,
  ChevronRight,
  Edit
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    const [cancellationInfo, setCancellationInfo] = useState<{canCancel: boolean, message: string}>({canCancel: false, message: ''});
    const [view, setView] = useState<'details' | 'review'>('details');
    const [paymentStatus, setPaymentStatus] = useState<string>(String((row as any).payment_status || 'PENDING'));
    const [hasPaymentTransaction, setHasPaymentTransaction] = useState<boolean>(Boolean((row as any).has_payment_transaction));

     const fetchOrderDetails = useCallback(async () => {
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
    
    return (
        <Dialog onOpenChange={(open) => {
            if (open) fetchOrderDetails();
            else setTimeout(() => setView('details'), 300);
        }}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md md:max-w-lg p-0 max-h-[90vh] overflow-y-auto border-none shadow-2xl rounded-[2.5rem] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <DialogHeader className="p-8 pb-4 text-center">
                    <DialogTitle className='font-headline text-2xl md:text-3xl font-bold'>
                        {view === 'review' ? (row.testimonial ? 'Editar Reseña' : 'Califica tu Pedido') : (
                            <>Detalles del Pedido: <span className="text-primary">ORD${String(row.id).padStart(4, '0')}</span></>
                        )}
                    </DialogTitle>
                </DialogHeader>
                
                <div className="px-6 md:px-8 pb-8 space-y-6">
                    {view === 'review' ? (
                        <ReviewForm orderId={row.id} onReviewSubmit={onReviewSubmit} onCancel={() => setView('details')} existingReview={row.testimonial as any} />
                    ) : (
                        <Tabs defaultValue="products" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/50 rounded-full h-12 md:h-14 mb-8">
                                <TabsTrigger value="products" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white font-bold transition-all h-full">Productos</TabsTrigger>
                                <TabsTrigger value="shipping" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white font-bold transition-all h-full">Envío y Pago</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="products" className="space-y-6 animate-in fade-in duration-200 pt-1">
                                <div>
                                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">Artículos</h4>
                                    <div className="space-y-4 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
                                        {row.items?.map((item, index) => (
                                            <div key={index} className="flex items-center justify-between group">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative h-14 w-14 shrink-0 rounded-full overflow-hidden border border-border/50 shadow-sm transition-transform group-hover:scale-105">
                                                        <Image 
                                                            src={item.image || '/placehold.webp'} 
                                                            alt={item.product_name || 'Producto'} 
                                                            fill 
                                                            className="object-cover" 
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm leading-tight">{item.product_name}</p>
                                                        <p className="text-xs text-muted-foreground mt-0.5">Cantidad: {item.quantity}</p>
                                                    </div>
                                                </div>
                                                <p className="font-bold text-sm">{formatCurrency(item.price * item.quantity)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-muted/30 p-6 rounded-[2rem] border border-border/50 space-y-4 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-5">
                                        <Heart className="w-16 h-16 text-primary fill-primary" />
                                    </div>
                                    
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                        <Heart className="w-3 h-3 text-primary fill-primary" />
                                        <span>Dedicatoria</span>
                                    </div>
                                    
                                    <p className="text-sm italic text-foreground leading-relaxed">
                                        "{row.dedication || 'No se incluyó dedicatoria.'}"
                                    </p>
                                    
                                    <Separator className="bg-border/50" />
                                    
                                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                                        <span className="text-muted-foreground">Firma</span>
                                        <span className="text-foreground">{row.is_anonymous ? 'Anónimo' : (row.signature || 'No especificada')}</span>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="shipping" className="space-y-6 animate-in fade-in duration-200 pt-1">
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Información de Entrega</h4>
                                    <div className="grid grid-cols-1 gap-4 bg-muted/30 p-5 rounded-3xl border border-border/50">
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-8 h-8 rounded-xl bg-background flex items-center justify-center shadow-sm">
                                                <Clock className="w-4 h-4 text-primary" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase">Fecha y Horario</span>
                                                <span className="font-medium">{new Date(row.delivery_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })} – {formatTimeSlotForUI(row.delivery_time_slot)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-8 h-8 rounded-xl bg-background flex items-center justify-center shadow-sm">
                                                <Truck className="w-4 h-4 text-primary" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase">Dirección</span>
                                                <span className="font-medium truncate max-w-[200px]">{row.shippingAddress}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-8 h-8 rounded-xl bg-background flex items-center justify-center shadow-sm">
                                                {statusIcons[row.status]}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase">Estado actual</span>
                                                <Badge variant={getStatusVariant(row.status)} className="w-fit h-5 text-[9px] font-bold px-2 py-0 mt-0.5">
                                                    {statusTranslations[row.status]}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Resumen de Pago</h4>
                                    <div className="space-y-2 text-sm px-1">
                                        <div className="flex justify-between items-center text-muted-foreground">
                                            <span>Estatus del pago</span>
                                            <Badge className={cn('h-6 text-[10px] font-bold px-2.5 uppercase', getPaymentStatusBadgeClass(paymentStatus))}>
                                                {paymentStatusTranslations[paymentStatus] ?? paymentStatus}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Subtotal</span>
                                            <span>{formatCurrency(row.subtotal)}</span>
                                        </div>
                                        {row.coupon_discount ? (
                                            <div className="flex justify-between text-green-600 font-medium">
                                                <span>Descuento ({row.couponCode})</span>
                                                <span>-{formatCurrency(row.coupon_discount)}</span>
                                            </div>
                                        ): null}
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Envío</span>
                                            <span>{formatCurrency(row.shipping_cost)}</span>
                                        </div>
                                        <div className="pt-2 flex justify-between font-bold text-base border-t border-border/50">
                                            <span>Total</span>
                                            <span className="text-primary">{formatCurrency(row.total)}</span>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    )}

                    {view === 'details' && (
                        <div className="space-y-3 pt-4 border-t border-border/50">
                            {row.status === 'completado' && (
                                <Button 
                                    variant="outline" 
                                    className="w-full h-12 rounded-2xl border-primary text-primary font-bold hover:bg-primary hover:text-white transition-all gap-2"
                                    onClick={() => setView('review')}
                                >
                                    {row.testimonial ? <><Edit className="w-4 h-4"/> Editar Reseña</> : <><Star className="w-4 h-4"/> Dejar una Reseña</>}
                                </Button>
                            )}
                            
                            <div className={cn('grid gap-3', isUnpaidOrder ? 'grid-cols-1' : 'grid-cols-2')}>
                                {isUnpaidOrder && row.status !== 'cancelado' && (
                                    <Button
                                        onClick={handlePayNow}
                                        className="h-14 rounded-2xl font-bold bg-red-600 hover:bg-red-700 text-white border-none gap-2"
                                        loading={isStartingPayment}
                                    >
                                        <CreditCard className="w-4 h-4" />
                                        Pagar ahora
                                    </Button>
                                )}
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button 
                                            variant="secondary" 
                                            disabled={!cancellationInfo.canCancel}
                                            className="h-14 rounded-2xl font-bold bg-red-50 text-red-500 hover:bg-red-100 border-none gap-2"
                                        >
                                            <Ban className="w-4 h-4" />
                                            Cancelar
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="z-[80] rounded-[2.5rem] border-none shadow-2xl">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle className="font-headline text-2xl">¿Estás seguro?</AlertDialogTitle>
                                            <AlertDialogDescription className="text-sm leading-relaxed">
                                                {cancellationInfo.message}
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter className="gap-2">
                                            <AlertDialogCancel className="rounded-2xl h-12 border-none bg-muted/50 font-bold">Volver</AlertDialogCancel>
                                            <AlertDialogAction 
                                                onClick={handleCancelOrder} 
                                                className="bg-destructive hover:bg-destructive/90 rounded-2xl h-12 font-bold shadow-lg shadow-destructive/20"
                                                loading={isCancelling}
                                            >
                                                Sí, cancelar pedido
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>

                                <Button variant="secondary" asChild className="h-14 rounded-2xl font-bold bg-zinc-900 text-white hover:bg-zinc-800 border-none gap-2">
                                    <Link href="/customer-service">
                                        <Headphones className="w-4 h-4" />
                                        Soporte
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
};
