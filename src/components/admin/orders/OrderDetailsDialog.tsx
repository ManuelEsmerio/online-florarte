'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { allOrders } from '@/lib/data/order-data';
import type { Order, OrderStatus } from '@/lib/definitions';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatTimeSlotForUI } from '@/lib/utils';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { 
    User, 
    Truck, 
    Flower2, 
    History, 
    MapPin, 
    X, 
    Printer, 
    Mail, 
    RefreshCcw, 
    Ban, 
    Check, 
    Package 
} from 'lucide-react';

const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
}

const statusColors: Record<OrderStatus, string> = {
    pendiente: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    procesando: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800',
    enviado: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800',
    completado: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800',
    cancelado: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800',
};

export const OrderDetailsDialog = ({ orderId, trigger }: { orderId: number, trigger: React.ReactNode }) => {
    const { toast } = useToast();
    const [order, setOrder] = useState<Order | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Mock data fetch
            const foundOrder = allOrders.find(o => o.id === orderId);
            if (foundOrder) {
                setOrder(foundOrder);
            } else {
                toast({ title: "Error", description: "Pedido no encontrado en datos de prueba", variant: "destructive" });
            }
        }
    }, [isOpen, orderId, toast]);

    if (!order && isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="max-w-6xl p-0 gap-0 bg-background dark:bg-card border-primary/20 overflow-hidden flex flex-col max-h-[90vh]">
                 <DialogTitle className="sr-only">Detalle del Pedido #{orderId}</DialogTitle>
                
                {order && (
                    <>
                        {/* Header Section */}
                        <header className="flex items-center justify-between px-8 py-6 border-b border-primary/10 bg-background dark:bg-card/50">
                            <div className="flex items-center gap-6">
                                <div className="flex flex-col">
                                    <h1 className="font-serif text-3xl lg:text-4xl text-foreground tracking-tight font-bold">
                                        Pedido #ORD-{String(order.id).padStart(4, '0')}
                                    </h1>
                                    <p className="text-primary/70 text-sm mt-1">
                                        Realizado el {format(parseISO(order.created_at), "d 'de' MMMM, yyyy • HH:mm", { locale: es })}
                                    </p>
                                </div>
                                <span className={cn(
                                    "px-4 py-1.5 rounded-full border text-sm font-bold tracking-wide uppercase",
                                    statusColors[order.status]
                                )}>
                                    {order.status}
                                </span>
                            </div>
                            {/* <Button variant="ghost" className="text-muted-foreground hover:text-foreground transition-colors p-0 h-auto" onClick={() => setIsOpen(false)}>
                                <X className="h-8 w-8" />
                            </Button> */}
                        </header>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                            {/* Left Column: Customer & Shipping */}
                            <div className="lg:col-span-3 space-y-8">
                                {/* Customer Section */}
                                <section>
                                    <h2 className="font-serif text-xl text-foreground mb-4 flex items-center gap-2 font-bold">
                                        <User className="h-5 w-5 text-primary" />
                                        Datos del Cliente
                                    </h2>
                                    <div className="bg-card dark:bg-white/5 p-4 rounded-lg border border-border dark:border-white/5 shadow-sm">
                                        <p className="text-foreground font-semibold">{order.customerName}</p>
                                        <p className="text-muted-foreground text-sm mt-1">{order.customerEmail}</p>
                                        <p className="text-muted-foreground text-sm">{order.customerPhone || 'Sin teléfono'}</p>
                                        
                                        {order.dedication && (
                                             <div className="mt-4 pt-4 border-t border-border dark:border-white/5">
                                                <p className="text-xs uppercase tracking-wider text-primary font-bold">Mensaje Dedicatoria</p>
                                                <p className="text-sm italic text-muted-foreground mt-2">"{order.dedication}"</p>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* Shipping Section */}
                                <section>
                                    <h2 className="font-serif text-xl text-foreground mb-4 flex items-center gap-2 font-bold">
                                        <Truck className="h-5 w-5 text-primary" />
                                        Envío
                                    </h2>
                                    <div className="bg-card dark:bg-white/5 rounded-lg border border-border dark:border-white/5 overflow-hidden shadow-sm">
                                        <div className="p-4">
                                            <p className="text-foreground text-sm font-medium">{order.recipientName || order.customerName}</p>
                                            <p className="text-muted-foreground text-sm mt-1">{order.shippingAddress}</p>
                                            {order.delivery_notes && (
                                                <p className="text-muted-foreground text-xs mt-2 italic">Note: {order.delivery_notes}</p>
                                            )}
                                        </div>
                                        {/* Map Placeholder */}
                                        <div className="h-32 bg-muted relative group cursor-pointer">
                                            <div className="absolute inset-0 flex items-center justify-center bg-muted">
                                                 <MapPin className="h-8 w-8 text-primary drop-shadow-lg" />
                                            </div>
                                            <div className="absolute inset-0 bg-black/5 dark:bg-black/20"></div>
                                        </div>
                                        <div className="p-3 bg-primary/5 text-center border-t border-primary/10">
                                            <p className="text-xs text-primary font-bold">
                                                Entrega: {format(parseISO(order.delivery_date), 'd MMM', { locale: es })}, {formatTimeSlotForUI(order.delivery_time_slot)}
                                            </p>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Center Column: Product List */}
                            <div className="lg:col-span-6 space-y-6">
                                <h2 className="font-serif text-xl text-foreground mb-4 flex items-center gap-2 font-bold">
                                    <Flower2 className="h-5 w-5 text-primary" />
                                    Resumen del Pedido
                                </h2>
                                <div className="space-y-4">
                                    {order.items?.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-4 p-4 bg-card dark:bg-white/5 rounded-lg border border-border dark:border-white/5 hover:border-primary/30 transition-all shadow-sm">
                                            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted relative">
                                                <Image 
                                                    src={item.image} 
                                                    alt={item.product_name} 
                                                    fill 
                                                    className="object-cover"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-foreground font-medium">{item.product_name}</h3>
                                                {item.variant_name && (
                                                     <p className="text-muted-foreground text-sm">Variante: {item.variant_name}</p>
                                                )}
                                                {item.customPhotoUrl && (
                                                    <div className="flex items-center gap-1 mt-1 text-xs text-primary font-medium">
                                                        <span className="material-symbols-outlined text-[14px]">image</span>
                                                        Incluye foto personalizada
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-foreground font-bold">{formatCurrency(item.price)}</p>
                                                <p className="text-muted-foreground text-xs">Cant: {item.quantity}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Financial Summary */}
                                <div className="mt-8 pt-6 border-t border-border dark:border-white/10 space-y-3">
                                    <div className="flex justify-between text-muted-foreground text-sm">
                                        <span>Subtotal</span>
                                        <span>{formatCurrency(order.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground text-sm">
                                        <span>Gastos de Envío</span>
                                        <span className={order.shipping_cost === 0 ? "text-green-500 font-medium" : ""}>
                                            {order.shipping_cost === 0 ? 'Gratis' : formatCurrency(order.shipping_cost)}
                                        </span>
                                    </div>
                                    {/* Mock tax calculation just for display to match design if needed, or just standard summary */}
                                    <div className="hidden flex justify-between text-muted-foreground text-sm">
                                         <span>Impuestos (IVA 16%)</span>
                                         <span>{formatCurrency(order.total * 0.16)}</span>
                                    </div>

                                    <div className="flex justify-between items-center pt-4 mt-2 border-t border-primary/20">
                                        <span className="font-serif text-2xl text-foreground font-bold">Total del Pedido</span>
                                        <span className="font-serif text-3xl text-primary font-bold">{formatCurrency(order.total)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Timeline */}
                            <div className="lg:col-span-3">
                                <h2 className="font-serif text-xl text-foreground mb-6 flex items-center gap-2 font-bold">
                                    <History className="h-5 w-5 text-primary" />
                                    Seguimiento
                                </h2>
                                <div className="relative pl-2">
                                    {/* Vertical Line */}
                                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border dark:bg-white/10"></div>
                                    
                                    <ul className="space-y-8 relative">
                                        {/* Mock timeline steps based on mock status */}
                                        <li className="flex gap-4 items-start">
                                            <div className="z-10 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white shrink-0 shadow-lg shadow-primary/20">
                                                <Check className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-foreground text-sm font-bold">Pedido Recibido</p>
                                                <p className="text-muted-foreground text-xs">
                                                     {format(parseISO(order.created_at), "d MMM, HH:mm", { locale: es })}
                                                </p>
                                            </div>
                                        </li>
                                         
                                        {['procesando', 'enviado', 'completado'].includes(order.status) && (
                                             <li className="flex gap-4 items-start">
                                                <div className="z-10 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white shrink-0 shadow-lg shadow-primary/20">
                                                    <Package className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="text-foreground text-sm font-bold">En Preparación</p>
                                                    <p className="text-muted-foreground text-xs">Procesado por Floristas</p>
                                                </div>
                                            </li>
                                        )}

                                        {['enviado', 'completado'].includes(order.status) && (
                                            <li className="flex gap-4 items-start">
                                                <div className={cn(
                                                    "z-10 h-8 w-8 rounded-full flex items-center justify-center text-white shrink-0",
                                                    order.status === 'enviado' ? "bg-primary border-4 border-background ring-4 ring-primary/20" : "bg-primary"
                                                )}>
                                                    <Truck className={cn("h-4 w-4", order.status === 'enviado' && "animate-pulse")} />
                                                </div>
                                                <div>
                                                    <p className={cn("text-sm font-bold", order.status === 'enviado' ? "text-primary" : "text-foreground")}>
                                                        En Camino
                                                    </p>
                                                    <p className="text-muted-foreground text-xs font-medium">Repartidor: {order.deliveryDriverName || 'Asignando...'}</p>
                                                </div>
                                            </li>
                                        )}

                                        {order.status === 'completado' && (
                                             <li className="flex gap-4 items-start">
                                                <div className="z-10 h-8 w-8 rounded-full bg-muted-foreground flex items-center justify-center text-white shrink-0">
                                                    <Check className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="text-foreground text-sm font-bold">Entregado</p>
                                                    <p className="text-muted-foreground text-xs">Pedido finalizado</p>
                                                </div>
                                            </li>
                                        )}
                                    </ul>
                                </div>

                                {/* Internal Notes */}
                                <div className="mt-12">
                                    <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-3">Notas Internas</h3>
                                    <textarea 
                                        className="w-full bg-card dark:bg-white/5 border border-border dark:border-white/10 rounded-lg p-3 text-sm text-foreground focus:ring-primary focus:border-primary placeholder:text-muted-foreground focus-visible:outline-none focus:ring-1" 
                                        placeholder="Añadir nota para el equipo..." 
                                        rows={3}
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <footer className="px-8 py-6 bg-background dark:bg-card/50 border-t border-primary/10 flex flex-wrap gap-4 justify-between items-center sm:flex-row flex-col">
                            <div className="flex gap-3 w-full sm:w-auto">
                                <Button variant="outline" className="flex-1 sm:flex-none gap-2 border-border dark:border-white/10 text-muted-foreground hover:bg-primary hover:text-accent-foreground dark:hover:bg-white/10 dark:hover:text-white transition-all font-medium h-11">
                                    <Printer className="h-5 w-5" />
                                    Imprimir Ticket
                                </Button>
                                <Button variant="outline" className="flex-1 sm:flex-none gap-2 border-border dark:border-white/10 text-muted-foreground hover:bg-primary hover:text-accent-foreground dark:hover:bg-white/10 dark:hover:text-white transition-all font-medium h-11">
                                    <Mail className="h-5 w-5" />
                                    Reenviar Factura
                                </Button>
                            </div>
                            <div className="flex gap-3 w-full sm:w-auto">
                               
                                {order.status !== 'cancelado' && order.status !== 'completado' && (
                                     <Button variant="ghost" className="flex-1 sm:flex-none gap-2 border border-primary/30 text-primary hover:bg-primary/10 hover:text-primary transition-all font-medium h-11">
                                        <Ban className="h-5 w-5" />
                                        Cancelar Pedido
                                    </Button>
                                )}
                                <Button className="flex-1 sm:flex-none gap-2 bg-primary text-white hover:bg-primary/90 transition-all font-bold shadow-lg shadow-primary/20 h-11 px-8 rounded-lg">
                                    <RefreshCcw className="h-5 w-5" />
                                    Actualizar Estado
                                </Button>
                            </div>
                        </footer>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};