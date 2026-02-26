
'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Lock, AlertCircle, Trash2, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { StepPhone } from '@/components/checkout/StepPhone';
import { StepAddress } from '@/components/checkout/StepAddress';
import { StepTimeSlot } from '@/components/checkout/StepTimeSlot';
import { StepDedication } from '@/components/checkout/StepDedication';
import { StepPayment } from '@/components/checkout/StepPayment';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { handleApiResponse } from '@/utils/handleApiResponse';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
};

const checkoutSchema = z.object({
  guestName: z.string().optional(),
  guestEmail: z.string().optional(),
  phone: z.string().min(10, 'El teléfono debe tener 10 dígitos.'),
  addressId: z.number().optional().default(0),
  deliveryDate: z.string().min(1, 'La fecha de entrega es requerida.'),
  deliveryTimeSlot: z.string().min(1, 'Debes seleccionar un horario.'),
  dedication: z.string().optional(),
  isAnonymous: z.boolean().optional(),
  signature: z.string().optional(),
  couponCode: z.string().optional(),
  gateway: z.string().min(1, 'Debes seleccionar un método de pago.').default('stripe'),
}).superRefine((values, ctx) => {
  const phoneDigits = String(values.phone ?? '').replace(/\D/g, '');
  if (!/^\d{10}$/.test(phoneDigits)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'El teléfono debe tener exactamente 10 dígitos.',
      path: ['phone'],
    });
  }

  const hasGuestIdentity = values.guestName || values.guestEmail;
  if (hasGuestIdentity) {
    const fullName = String(values.guestName ?? '').trim();
    const email = String(values.guestEmail ?? '').trim().toLowerCase();

    if (fullName.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Ingresa tu nombre completo.',
        path: ['guestName'],
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Ingresa un email válido.',
        path: ['guestEmail'],
      });
    }
  }
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;

interface ValidationIssue {
    cartItemId: string;
    productId: number;
    name: string;
    reason: 'out_of_stock' | 'not_published' | 'not_found';
    message: string;
}

const CheckoutSkeleton = () => (
    <div className="w-full max-w-[1440px] mx-auto px-4 md:px-6 py-10 animate-pulse">
        <Skeleton className="h-6 w-48 mb-10 rounded-md" />
        <Skeleton className="h-12 w-2/3 mb-12 rounded-lg" />
        <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-[2.5rem]" />
                ))}
            </div>
            <div className="lg:col-span-4">
                <Skeleton className="h-[500px] w-full rounded-[2.5rem]" />
            </div>
        </div>
    </div>
);

const CheckoutPageContent = () => {
  const { cart, subtotal, isLoading: isCartLoading, cartItemCount, appliedCoupon, deliveryDate, removeFromCart, getDiscountAmount, shippingCost: ctxShippingCost } = useCart();
  const { user, loading: authLoading, apiFetch } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [activeStep, setActiveStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [shippingCost, setShippingCost] = useState<number | null>(null);
  
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [isValidatingCart, setIsValidatingCart] = useState(true);
  const [isDataSettled, setIsDataSettled] = useState(false);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      guestName: '',
      guestEmail: '',
      phone: '',
      addressId: 0,
      deliveryDate: '',
      deliveryTimeSlot: '',
      dedication: '',
      isAnonymous: false,
      signature: '',
      couponCode: '',
      gateway: 'stripe',
    },
    mode: 'onChange'
  });

  const { watch, handleSubmit, trigger, getValues, setValue } = form;
  
  const watchedGuestName = watch('guestName');
  const watchedGuestEmail = watch('guestEmail');
  const watchedPhone = watch('phone');
  const watchedAddressId = watch('addressId');
  const watchedDate = watch('deliveryDate');
  const watchedSlot = watch('deliveryTimeSlot');

  const totalDiscount = useMemo(() => getDiscountAmount(subtotal), [getDiscountAmount, subtotal]);
  
  const total = useMemo(() => {
    const safeSubtotal = Number(subtotal) || 0;
    const safeTotalDiscount = Number(totalDiscount) || 0;
    const currentShipping = shippingCost ?? ctxShippingCost;
    const safeShipping = (currentShipping !== null && !isNaN(Number(currentShipping))) ? Number(currentShipping) : 0;
    return Math.max(0, safeSubtotal - safeTotalDiscount + safeShipping);
  }, [subtotal, shippingCost, ctxShippingCost, totalDiscount]);

  const validateCart = useCallback(async () => {
    if (isCartLoading) return;
    setIsValidatingCart(true);
    try {
        const response = await apiFetch('/api/cart/validate', { method: 'POST' });
        const issues = await handleApiResponse(response, []);
        setValidationIssues(issues);
    } catch (error: any) {
        console.error("[Checkout] Cart validation failed");
    } finally {
        setIsValidatingCart(false);
    }
  }, [apiFetch, isCartLoading]);

  useEffect(() => {
    if (!authLoading && !isCartLoading && !isDataSettled) {
        if (user) {
            if (user.phone) setValue('phone', user.phone, { shouldValidate: true });
            const defaultAddr = user.addresses?.find(a => a.isDefault)?.id || user.addresses?.[0]?.id || 0;
            if (defaultAddr > 0) setValue('addressId', defaultAddr, { shouldValidate: true });
        }
        if (deliveryDate) setValue('deliveryDate', deliveryDate, { shouldValidate: true });
        if (appliedCoupon) setValue('couponCode', appliedCoupon.code, { shouldValidate: true });
        setIsDataSettled(true);
    }
  }, [authLoading, isCartLoading, user, deliveryDate, appliedCoupon, setValue, isDataSettled]);

  useEffect(() => {
    validateCart();
  }, [cart, validateCart]);

  const hasValidationIssues = useMemo(() => validationIssues.length > 0, [validationIssues]);
  const isGuestCheckout = useMemo(() => !user?.id, [user?.id]);

  const isCurrentStepValid = useMemo(() => {
    if (!isDataSettled || isValidatingCart || hasValidationIssues || isProcessing) return false;

    const phoneDigits = String(watchedPhone ?? '').replace(/\D/g, '');
    const isPhoneValid = /^\d{10}$/.test(phoneDigits);
    const isGuestIdentityValid = !isGuestCheckout || (
      String(watchedGuestName ?? '').trim().length >= 3 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(watchedGuestEmail ?? '').trim().toLowerCase())
    );
    const isStep1Valid = isPhoneValid && isGuestIdentityValid;
    const isStep2Valid = isGuestCheckout
      ? isStep1Valid
      : (isStep1Valid && !!watchedAddressId && watchedAddressId > 0 && (shippingCost !== null || ctxShippingCost !== null));
    const isStep3Valid = isStep2Valid && !!watchedDate && !!watchedSlot;

    switch (activeStep) {
      case 1: return isStep1Valid;
      case 2: return isStep2Valid;
      case 3: return isStep3Valid;
      case 4: return isStep3Valid; 
      case 5: return isStep3Valid;
      default: return false;
    }
  }, [activeStep, watchedGuestName, watchedGuestEmail, watchedPhone, watchedAddressId, watchedDate, watchedSlot, isValidatingCart, hasValidationIssues, isProcessing, shippingCost, ctxShippingCost, isDataSettled, isGuestCheckout]);

  const handleRemoveAndRevalidate = async (cartItemId: string) => {
    setIsValidatingCart(true); 
    await removeFromCart(cartItemId);
    await validateCart();
  };

  useEffect(() => {
    if (authLoading || !isDataSettled) return;
    if (!isCartLoading && cartItemCount === 0 && !isProcessing) {
      router.push('/');
    }
  }, [authLoading, isCartLoading, cartItemCount, router, isProcessing, isDataSettled]);
  
  const handleFinalizeOrder = async () => {
    if (hasValidationIssues || !isCurrentStepValid) {
        toast({ title: 'Información incompleta', description: 'Por favor, completa todos los pasos obligatorios.', variant: 'warning' });
        return;
    }
    setIsProcessing(true);
    try {
      const data = getValues();
      const selectedAddress = user?.addresses?.find((address) => address.id === data.addressId);
      const endpoint = data.gateway === 'mercadopago'
        ? '/api/mercadopago/checkout-session'
        : '/api/stripe/checkout-session';

      const response = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          addressId: data.addressId,
          guestName: isGuestCheckout ? data.guestName : undefined,
          guestEmail: isGuestCheckout ? data.guestEmail : undefined,
          guestPhone: data.phone,
          recipientName: selectedAddress?.recipientName,
          recipientPhone: selectedAddress?.recipientPhone,
          shippingAddressSnapshot: isGuestCheckout ? 'Compra como invitado - dirección por confirmar' : undefined,
          couponCode: data.couponCode,
          deliveryDate: data.deliveryDate,
          deliveryTimeSlot: data.deliveryTimeSlot,
          dedication: data.dedication,
          isAnonymous: data.isAnonymous,
          signature: data.signature,
          shippingCost: shippingCost || ctxShippingCost || 0,
        }),
      });
      const result = await handleApiResponse(response);

      if (!result?.checkoutUrl) {
        throw new Error('No se pudo generar la sesión de pago.');
      }

      window.location.href = result.checkoutUrl;
    } catch (error: any) {
      toast({ title: 'Error al procesar', description: error.message, variant: 'destructive' });
      setIsProcessing(false);
    } finally {
      // El estado se mantiene en processing hasta redirección para evitar doble click.
    }
  };

  if (authLoading || !isDataSettled) {
    return <CheckoutSkeleton />;
  }

  const steps = [
    { id: 1, component: StepPhone, props: { setActiveStep, disabled: hasValidationIssues, currentStep: activeStep } },
    { id: 2, component: StepAddress, props: { setActiveStep, setShippingCost, disabled: hasValidationIssues, currentStep: activeStep } },
    { id: 3, component: StepTimeSlot, props: { setActiveStep, disabled: hasValidationIssues, currentStep: activeStep } },
    { id: 4, component: StepDedication, props: { setActiveStep, disabled: hasValidationIssues, currentStep: activeStep } },
    { id: 5, component: StepPayment, props: { isProcessing, disabled: hasValidationIssues, isActive: activeStep === 5 } },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans overflow-x-hidden">
      <Header />
      <main className="flex-grow bg-secondary/30">
          <div className="w-full max-w-[1440px] mx-auto px-4 md:px-6 py-10 pb-32">
              <Breadcrumb className="mb-10 hidden md:flex">
                  <BreadcrumbList className="text-[10px] uppercase tracking-[0.2em] font-bold">
                      <BreadcrumbItem><BreadcrumbLink href="/">Inicio</BreadcrumbLink></BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem><BreadcrumbLink href="/cart">Carrito</BreadcrumbLink></BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem><BreadcrumbPage className="text-foreground">Finalizar Compra</BreadcrumbPage></BreadcrumbItem>
                  </BreadcrumbList>
              </Breadcrumb>
              
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold font-headline mb-12 text-slate-900 dark:text-white leading-tight">Proceso de compra</h1>
              
              <FormProvider {...form}>
                  <form id="checkout-form" onSubmit={handleSubmit(handleFinalizeOrder)} className="grid lg:grid-cols-12 gap-8 items-start w-full">
                      <div className="lg:col-span-8 space-y-6 sm:space-y-8 w-full">
                          {isValidatingCart && validationIssues.length === 0 ? (
                              <Skeleton className="h-24 w-full rounded-[2.5rem]" />
                          ) : hasValidationIssues && (
                              <Alert variant="destructive" className="rounded-[2.5rem] p-6 sm:p-8 border-2 border-destructive/20 bg-destructive/5">
                                  <AlertCircle className="h-6 w-6" />
                                  <AlertTitle className="font-bold text-xl mb-2">Problemas con tu pedido</AlertTitle>
                                  <AlertDescription className="space-y-4 mt-4">
                                      <p className="text-sm font-medium">Algunos productos ya no están disponibles. Elimínalos para continuar.</p>
                                      <div className="space-y-3">
                                          {validationIssues.map(issue => (
                                              <div key={issue.cartItemId} className="flex items-center justify-between gap-4 p-4 bg-background dark:bg-zinc-900 rounded-2xl border border-destructive/10">
                                                  <span className="text-sm font-bold truncate">{issue.name} - <span className="text-destructive">{issue.message}</span></span>
                                                  <Button
                                                      size="sm"
                                                      variant="ghost"
                                                      className="text-destructive font-bold text-xs uppercase"
                                                      onClick={() => handleRemoveAndRevalidate(issue.cartItemId)}
                                                  >
                                                     <Trash2 className="w-4 h-4 mr-2"/> Quitar
                                                  </Button>
                                              </div>
                                          ))}
                                      </div>
                                  </AlertDescription>
                              </Alert>
                          )}
                         {steps.map(({ id, component: Component, props }) => (
                              <Component key={id} isActive={activeStep === id} {...props} />
                          ))}
                      </div>
                      <div className="lg:col-span-4 lg:sticky lg:top-24 w-full">
                          <OrderSummary shippingCost={shippingCost ?? ctxShippingCost} validationIssues={validationIssues} isValidating={isValidatingCart} />
                      </div>
                  </form>
              </FormProvider>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
          <div className="max-w-[480px] mx-auto p-4 sm:p-5 bg-background/95 dark:bg-zinc-950/95 backdrop-blur-xl border-t border-border/50 shadow-2xl rounded-t-[2rem]">
              <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col shrink-0">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total</span>
                      <span className="text-xl sm:text-2xl font-bold text-foreground font-sans">
                          {formatCurrency(total)}
                      </span>
                  </div>
                  <Button 
                      className="flex-1 h-14 sm:h-16 text-base sm:text-lg font-bold rounded-2xl shadow-xl transition-all active:scale-[0.98] bg-primary hover:bg-[#E6286B]"
                      onClick={async () => {
                          if (!isCurrentStepValid) return;
                          if (activeStep === 5) handleFinalizeOrder();
                          else {
                              const stepFields: any = {
                                1: isGuestCheckout ? ['guestName', 'guestEmail', 'phone'] : ['phone'],
                                2: isGuestCheckout ? [] : ['addressId'],
                                3: ['deliveryDate', 'deliveryTimeSlot']
                              };
                              const valid = await trigger(stepFields[activeStep]);
                              if (valid) setActiveStep(prev => prev + 1);
                          }
                      }}
                      disabled={isProcessing || !isCurrentStepValid}
                      loading={isProcessing}
                  >
                      {activeStep < 5 ? "Continuar" : "Pagar Ahora"}
                      {activeStep < 5 && <ArrowRight className="w-5 h-5 ml-2" />}
                  </Button>
              </div>
              <div className="mt-2 text-center text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">
                  <Lock className="w-3 h-3 inline mr-1" /> Pago Seguro SSL
              </div>
          </div>
      </div>

      <Footer />
    </div>
  );
};

export default function CheckoutPage() {
  return <CheckoutPageContent />;
}
