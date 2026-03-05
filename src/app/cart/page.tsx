'use client';

import React from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { 
  ShoppingCart, 
  Lock, 
  Gem, 
  ShieldCheck, 
  CalendarIcon, 
  TicketIcon, 
  X, 
  Truck, 
  ChevronRight as ChevronRightIcon, 
  ArrowLeft,
  Clock as ClockIcon,
  Sparkles,
  ShoppingBag,
  Plus,
  Minus,
  Loader2
} from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Image from 'next/image';
import { ShippingCityModal, type SelectedCity } from '@/components/ShippingCityModal';
import type { ShippingZone } from '@/lib/definitions';
import { Skeleton } from '@/components/ui/skeleton';
import { DeliveryDateModal } from '@/components/DeliveryDateModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Label } from '@/components/ui/label';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
};

const CartItemSkeleton = () => (
    <div className="flex gap-4 p-6 border-b last:border-b-0 animate-pulse bg-background dark:bg-zinc-900">
        <Skeleton className="h-24 w-24 rounded-2xl flex-shrink-0" />
        <div className="flex-grow flex flex-col justify-between py-1">
            <div className="flex justify-between items-start">
                <div className="space-y-2 w-full">
                    <Skeleton className="h-5 w-3/4 rounded-md" />
                    <Skeleton className="h-3 w-1/4 rounded-md" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <div className="flex items-center justify-between mt-auto">
                <Skeleton className="h-6 w-20 rounded-md" />
                <Skeleton className="h-10 w-24 rounded-full" />
            </div>
        </div>
    </div>
);

const CartPageSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
            <div className="bg-background dark:bg-zinc-900 rounded-[2.5rem] shadow-sm border border-border/50 overflow-hidden">
                <CartItemSkeleton />
                <CartItemSkeleton />
                <CartItemSkeleton />
            </div>
            <div className="space-y-3">
                <Skeleton className="h-16 w-full rounded-2xl" />
                <Skeleton className="h-16 w-full rounded-2xl" />
            </div>
        </div>
        <div className="lg:col-span-5">
            <div className="bg-background dark:bg-zinc-900 rounded-[2.5rem] shadow-sm border border-border/50 p-8 space-y-8">
                <div className="space-y-4">
                    <Skeleton className="h-4 w-1/3 rounded-md" />
                    <Skeleton className="h-14 w-full rounded-2xl" />
                    <Skeleton className="h-14 w-full rounded-2xl" />
                    <Skeleton className="h-16 w-full rounded-2xl" />
                </div>
                <div className="pt-6 border-t border-border/50">
                    <Skeleton className="h-14 w-full rounded-2xl" />
                </div>
                <div className="pt-6 space-y-4">
                    <Skeleton className="h-4 w-1/4 rounded-md" />
                    <div className="space-y-3">
                        <div className="flex justify-between"><Skeleton className="h-4 w-20 rounded-md" /><Skeleton className="h-4 w-16 rounded-md" /></div>
                        <div className="flex justify-between"><Skeleton className="h-4 w-20 rounded-md" /><Skeleton className="h-4 w-16 rounded-md" /></div>
                        <div className="pt-4 flex justify-between border-t border-border/50"><Skeleton className="h-6 w-16 rounded-md" /><Skeleton className="h-8 w-24 rounded-md" /></div>
                    </div>
                </div>
                <div className="pt-4">
                    <Skeleton className="h-16 w-full rounded-2xl" />
                </div>
            </div>
        </div>
    </div>
);

export default function CartPage() {
  const { 
    cart, 
    updateQuantity, 
    removeFromCart, 
    deliveryDate, 
    setDeliveryDate, 
    appliedCoupon, 
    applyCoupon, 
    removeCoupon, 
    getDiscountAmount, 
    selectedCity, 
    setSelectedCity, 
    shippingCost, 
    setShippingCost, 
    updatingItemId, 
    isLoading, 
    subtotal 
  } = useCart();
  
    const { shippingZones: authShippingZones, user } = useAuth();
    const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isShippingDateModalOpen, setIsShippingDateModalOpen] = useState(false);
  const [isShippingCityModalOpen, setIsShippingCityModalOpen] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

    useEffect(() => {
        if (authShippingZones?.length) {
            setShippingZones(authShippingZones);
        }
    }, [authShippingZones]);

  const isShippingInfoComplete = useMemo(() => {
    return deliveryDate && !deliveryDate.includes('No especificada');
  }, [deliveryDate]);

  const canProceed = useMemo(() => {
    return isShippingInfoComplete && selectedCity !== null && cart.length > 0;
  }, [isShippingInfoComplete, selectedCity, cart]);

    const isAuthenticated = Boolean(user?.id);

  const handleSaveShippingDate = (date: Date) => {
    if (setDeliveryDate) {
      setDeliveryDate(format(date, 'yyyy-MM-dd'));
    }
  };
  
  const handleConfirmCity = (city: SelectedCity) => {
    if (setSelectedCity) setSelectedCity(city);
    if (setShippingCost) setShippingCost(city.shippingCost);
    setIsShippingCityModalOpen(false);
  }

  const formatDateLabel = (dateString?: string | null): string => {
    if (!isClient) return 'Cargando...';
    if (!dateString || dateString.includes('No especificada')) return 'Selecciona una fecha';
    try {
      const safeDate = new Date(dateString.replace(/-/g, '/'));
      if (isNaN(safeDate.getTime())) return dateString;
      return format(safeDate, "EEEE, d 'de' MMMM", { locale: es });
    } catch (error) {
      return dateString;
    }
  };

  const handleApplyCoupon = async () => {
        if (!isAuthenticated) {
            toast({
                title: 'Inicia sesión para usar cupones',
                description: 'Los cupones están disponibles únicamente para usuarios autenticados.',
                variant: 'info',
            });
            return;
        }

    if (!isShippingInfoComplete) {
        toast({
            title: 'Fecha requerida',
            description: 'Para agregar un cupón, debes seleccionar una fecha de envío.',
            variant: 'info'
        });
        return;
    }
    if (!couponCode.trim()) {
      toast({ title: 'Ingresa un código de cupón.', variant: 'info' });
      return;
    }
    setIsApplyingCoupon(true);
    const success = await applyCoupon(couponCode);
    if (success) {
      setIsCouponModalOpen(false);
      setCouponCode('');
    }
    setIsApplyingCoupon(false);
  };

  const handleRemoveCoupon = () => {
    if (removeCoupon) {
      removeCoupon();
    }
  };

  const handleCheckoutClick = () => {
    if (!canProceed) return;
    setIsNavigating(true);
    router.push('/checkout');
  };
  
  const discountAmount = useMemo(() => getDiscountAmount(subtotal), [getDiscountAmount, subtotal]);

  const total = useMemo(() => {
    const safeSubtotal = Number(subtotal) || 0;
    const safeTotalDiscount = Number(discountAmount) || 0;
    const safeShipping = (shippingCost !== null && !isNaN(Number(shippingCost))) ? Number(shippingCost) : 0;
    const finalTotal = safeSubtotal - safeTotalDiscount + safeShipping;
    return finalTotal < 0 ? 0 : finalTotal;
  }, [subtotal, shippingCost, discountAmount]);

  if (!isClient) return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <Header />
      <main className="flex-grow bg-secondary/20">
        <div className="container mx-auto px-4 md:px-6 py-6 md:py-12 max-w-5xl w-full pb-32">
            <CartPageSkeleton />
        </div>
      </main>
      <Footer />
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <Header />
      <main className="flex-grow bg-secondary/20">
        <div className="container mx-auto px-4 md:px-6 py-6 md:py-12 max-w-5xl w-full pb-32">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                </div>
                <h1 className="text-2xl md:text-4xl font-bold font-headline">Tu Carrito</h1>
            </div>

            {(isLoading && !cart?.length) ? (
                <CartPageSkeleton />
            ) : cart?.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-7 space-y-6">
                        <div className="bg-background dark:bg-zinc-900 rounded-[2.5rem] shadow-sm border border-border/50 overflow-hidden">
                            {cart.map((item) => {
                                const isUpdating = updatingItemId === item.cartItemId;
                                return (
                                    <div key={item.cartItemId} className="flex gap-4 p-6 border-b last:border-b-0 bg-background dark:bg-zinc-900 transition-colors font-sans">
                                        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-border/50 shadow-sm">
                                            <Image src={item.image || '/placehold.webp'} alt={item.name ?? ''} fill className="object-cover" />
                                        </div>
                                        <div className="flex-grow flex flex-col justify-between py-1">
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-semibold text-foreground text-sm md:text-base leading-tight pr-2 line-clamp-2">{item.name}</h3>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-muted-foreground/40 hover:text-destructive transition-colors -mt-1 -mr-1" 
                                                    onClick={() => removeFromCart(item.cartItemId ?? String(item.id))}
                                                    disabled={isUpdating}
                                                >
                                                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                            <div className="flex items-center justify-between mt-auto">
                                                <span className="text-primary font-bold text-base md:text-lg font-sans">
                                                    {formatCurrency(item.price ?? item.unitPrice)}
                                                </span>
                                                <div className="flex items-center bg-muted/50 dark:bg-zinc-800 rounded-full border border-border/50 p-1">
                                                    <button 
                                                        className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-primary active:scale-90 transition-all disabled:opacity-30" 
                                                        onClick={() => updateQuantity(item.cartItemId ?? String(item.id), item.quantity - 1)}
                                                        disabled={isUpdating || item.quantity <= 1}
                                                    >
                                                        <Minus className="h-3.5 w-3.5" />
                                                    </button>
                                                    <span className="w-8 text-center text-xs font-bold font-sans">{item.quantity}</span>
                                                    <button 
                                                        className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-primary active:scale-90 transition-all disabled:opacity-30" 
                                                        onClick={() => updateQuantity(item.cartItemId ?? String(item.id), item.quantity + 1)}
                                                        disabled={isUpdating}
                                                    >
                                                        <Plus className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        <div className="space-y-3">
                            <Accordion type="single" collapsible className="w-full space-y-3">
                                <AccordionItem value="item-1" className="border rounded-[2rem] bg-background dark:bg-zinc-900 px-6 border-border/50 shadow-sm">
                                    <AccordionTrigger className="text-sm font-bold hover:no-underline">
                                        <div className='flex items-center gap-4'>
                                            <ShieldCheck className="w-5 h-5 text-primary" />
                                            <span>Garantía Florarte</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground text-xs leading-relaxed pb-6">
                                        Nos comprometemos a que tu regalo llegue fresco y a tiempo. Si no estás 100% satisfecho, contacta a nuestro equipo de felicidad en las primeras 24 horas.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-2" className="border rounded-[2rem] bg-background dark:bg-zinc-900 px-6 border-border/50 shadow-sm">
                                    <AccordionTrigger className="text-sm font-bold hover:no-underline">
                                        <div className='flex items-center gap-4'>
                                            <Gem className="w-5 h-5 text-blue-400" />
                                            <span>Puntos de Lealtad</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground text-xs leading-relaxed pb-6">
                                        Gana 1 punto por cada $1 de compra. Al acumular 3,000 puntos, podrás canjearlos por un cupón de $200 MXN para tu próxima sorpresa.
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>
                    </div>

                    <div className="lg:col-span-5">
                        <div className="bg-background dark:bg-zinc-900 rounded-[2.5rem] shadow-sm border border-border/50 p-6 md:p-8 space-y-8">
                            <div className="space-y-6">
                                <h2 className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">Configuración de Envío</h2>
                                <div className="space-y-4">
                                    <button 
                                        className="relative w-full flex items-center group" 
                                        onClick={() => setIsShippingCityModalOpen(true)}
                                    >
                                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-primary/60 group-hover:text-primary transition-colors">
                                            <Truck className="w-5 h-5" />
                                        </div>
                                        <div className="w-full pl-12 pr-4 py-4 bg-muted/30 dark:bg-zinc-800 rounded-2xl text-sm font-medium text-left transition-all border border-transparent group-hover:border-primary/20">
                                            <span className={cn(selectedCity ? "text-foreground" : "text-muted-foreground")}>
                                                {selectedCity?.locality || '¿A dónde quieres enviar?'}
                                            </span>
                                        </div>
                                    </button>
                                    <button 
                                        className="relative w-full flex items-center group" 
                                        onClick={() => setIsShippingDateModalOpen(true)}
                                    >
                                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-primary/60 group-hover:text-primary transition-colors">
                                            <CalendarIcon className="w-5 h-5" />
                                        </div>
                                        <div className="w-full pl-12 pr-4 py-4 bg-muted/30 dark:bg-zinc-800 rounded-2xl text-sm font-medium text-left transition-all border border-transparent group-hover:border-primary/20">
                                            <span className={cn(deliveryDate ? "text-foreground font-bold capitalize" : "text-muted-foreground")}>
                                                {formatDateLabel(deliveryDate)}
                                            </span>
                                        </div>
                                    </button>
                                    <div className="p-4 bg-primary/5 rounded-2xl flex gap-3 border border-primary/10">
                                        <ClockIcon className="w-5 h-5 text-primary shrink-0" />
                                        <p className="text-[11px] leading-relaxed text-muted-foreground font-medium">
                                            Podrás elegir el <span className="font-bold text-primary">horario de entrega</span> exacto al finalizar tu compra.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {isAuthenticated && (
                              <div className="pt-6 border-t border-border/50">
                                  {appliedCoupon ? (
                                      <div className="flex items-center justify-between px-5 py-4 bg-green-50 dark:bg-green-950/20 rounded-2xl border border-green-100 dark:border-green-900/30">
                                          <div className="flex items-center gap-3">
                                              <TicketIcon className="w-5 h-5 text-green-600" />
                                              <span className="text-sm font-bold text-green-700 dark:text-green-400 font-sans">{appliedCoupon.code}</span>
                                          </div>
                                          <Button variant="ghost" size="icon" className="h-8 w-8 text-green-700 hover:bg-green-100" onClick={handleRemoveCoupon}>
                                              <X className="h-4 w-4" />
                                          </Button>
                                      </div>
                                  ) : (
                                      <button 
                                          className="w-full flex items-center justify-between px-5 py-4 bg-muted/30 dark:bg-zinc-800 rounded-2xl active:bg-muted/50 transition-all group"
                                          onClick={() => isShippingInfoComplete && setIsCouponModalOpen(true)}
                                          disabled={!isShippingInfoComplete}
                                      >
                                          <div className="flex items-center gap-3">
                                              <TicketIcon className="w-5 h-5 text-primary/60 group-hover:text-primary transition-colors" />
                                              <span className={cn("text-sm font-medium transition-colors", !isShippingInfoComplete ? "text-muted-foreground/40" : "text-muted-foreground group-hover:text-foreground")}>Tengo un cupón</span>
                                          </div>
                                          <ChevronRightIcon className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary" />
                                      </button>
                                  )}
                              </div>
                            )}

                            <div className="pt-6 space-y-4">
                                <h2 className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">Resumen de Compra</h2>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground font-medium">Subtotal</span>
                                        <span className="font-bold text-foreground font-sans">{formatCurrency(subtotal)}</span>
                                    </div>
                                    {discountAmount > 0 && (
                                        <div className="flex justify-between text-sm text-green-600">
                                            <span className="flex items-center gap-1.5 font-medium"><Sparkles className="w-3.5 h-3.5"/> Descuento</span>
                                            <span className="font-bold font-sans">-{formatCurrency(discountAmount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground font-medium">Envío</span>
                                        <span className={cn("font-bold font-sans", (shippingCost === null || isNaN(shippingCost as number)) && "italic text-muted-foreground/50 font-medium")}>
                                            {(shippingCost !== null && !isNaN(shippingCost as number)) ? formatCurrency(shippingCost as number) : "Pendiente"}
                                        </span>
                                    </div>
                                    <div className="pt-4 flex justify-between items-center border-t border-border/50">
                                        <span className="font-bold text-base font-headline">Total</span>
                                        <span className="text-3xl font-bold text-primary font-sans">
                                            {formatCurrency(total)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="hidden lg:block pt-4">
                                <Button 
                                    size="lg" 
                                    className="w-full h-16 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2" 
                                    disabled={!canProceed || isNavigating} 
                                    onClick={handleCheckoutClick}
                                    loading={isNavigating}
                                >
                                    <span>Pagar de forma segura</span>
                                    <ChevronRightIcon className="w-5 h-5" />
                                </Button>
                                {!canProceed && (
                                    <p className="text-[10px] text-center text-muted-foreground mt-3 font-bold uppercase tracking-[0.15em]">
                                        Elige ciudad y fecha para continuar
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-24 bg-background dark:bg-zinc-900 rounded-[3rem] shadow-xl border border-border/50 max-w-2xl mx-auto animate-fade-in-up">
                    <div className="inline-flex p-6 bg-secondary/50 rounded-full mb-6">
                        <ShoppingBag className="h-12 w-12 text-muted-foreground/20" />
                    </div>
                    <h2 className="text-3xl font-bold font-headline mb-3">Tu carrito está esperando</h2>
                    <p className="text-muted-foreground max-w-sm mx-auto mb-10 leading-relaxed font-medium">
                        Parece que aún no has elegido flores para hoy. Explora nuestra colección y encuentra el detalle perfecto.
                    </p>
                    <Button asChild size="lg" className="h-14 px-10 rounded-2xl font-bold text-lg shadow-lg shadow-primary/20">
                        <Link href="/products/all">Ver arreglos florales</Link>
                    </Button>
                </div>
            )}
        </div>
      </main>

      {cart?.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
            <div className="max-w-[480px] mx-auto p-5 bg-background/95 dark:bg-zinc-950/95 backdrop-blur-xl border-t border-border/50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                <div className="flex flex-col gap-3">
                    <Button 
                        size="lg" 
                        className="w-full h-16 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3" 
                        disabled={!canProceed || isNavigating} 
                        onClick={handleCheckoutClick}
                        loading={isNavigating}
                    >
                        <span>Finalizar mi compra</span>
                        <ArrowLeft className="w-5 h-5 rotate-180" />
                    </Button>
                    <div className="flex items-center justify-center gap-1.5 text-[9px] font-bold tracking-widest text-muted-foreground/60 uppercase">
                        <Lock className="w-3 h-3 font-bold" />
                        PAGO SEGURO CON STRIPE
                    </div>
                </div>
            </div>
        </div>
      )}

      <Footer />
      
      <DeliveryDateModal 
        isOpen={isShippingDateModalOpen}
        onOpenChange={setIsShippingDateModalOpen}
        currentDate={deliveryDate}
        onSave={handleSaveShippingDate}
      />

       <ShippingCityModal
        isOpen={isShippingCityModalOpen}
        onOpenChange={setIsShippingCityModalOpen}
        shippingZones={shippingZones}
        onConfirm={handleConfirmCity}
      />

      <Dialog open={isCouponModalOpen} onOpenChange={setIsCouponModalOpen}>
        <DialogContent className="sm:max-w-md p-8 rounded-[2.5rem] border-none shadow-2xl">
          <DialogHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                <TicketIcon className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="font-headline text-3xl font-bold">Cupón de descuento</DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2 font-medium">
              Ingresa tu código promocional para aplicarlo a tu compra.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="space-y-2">
                <Label htmlFor="coupon-modal-input" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Código Promocional</Label>
                <Input
                    id="coupon-modal-input"
                    placeholder="Ej: FLORARTE2024"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    disabled={isApplyingCoupon}
                    className="h-14 rounded-2xl text-center font-bold tracking-widest text-lg bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 transition-all uppercase font-sans"
                />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button
              type="button"
              className="w-full h-14 rounded-2xl font-bold text-lg shadow-lg shadow-primary/20"
              onClick={handleApplyCoupon}
              loading={isApplyingCoupon}
            >
              Aplicar Descuento
            </Button>
            <Button variant="ghost" className="w-full text-muted-foreground rounded-2xl font-bold" onClick={() => setIsCouponModalOpen(false)}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
