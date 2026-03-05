// src/components/checkout/StepPayment.tsx
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Lock, CreditCard, CheckCircle, Sparkles, MapPin, Calendar, MessageSquare, User, AlertTriangle } from 'lucide-react';
import { cn, formatTimeSlotForUI } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useFormContext } from 'react-hook-form';
import { CheckoutFormValues } from '@/app/checkout/CheckoutClientPage';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthContext';
import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import * as RadioGroup from '@radix-ui/react-radio-group';

interface StepPaymentProps {
  isProcessing: boolean;
  isActive: boolean;
  disabled?: boolean;
}

function StripeLogo() {
  return (
    <svg viewBox="0 0 60 25" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto">
      <path d="M5.45 10.22c0-.7.57-1 1.51-1 1.35 0 3.06.41 4.41 1.14V6.53a11.7 11.7 0 0 0-4.4-.81C3.87 5.72 2 7.2 2 10.4c0 5.02 6.9 4.22 6.9 6.38 0 .83-.72 1.1-1.72 1.1-1.48 0-3.38-.61-4.88-1.44v3.88a12.4 12.4 0 0 0 4.87 1.02c3.72 0 6.28-1.84 6.28-5.08 0-5.42-6.99-4.46-6.99-6.04zM22.27 5.72l-2.44.52-.01 11.73c0 2.16 1.62 3.37 3.78 3.37 1.2 0 2.08-.22 2.57-.48v-3.17c-.47.19-2.8.87-2.8-1.3V9.12h2.8V5.92h-2.8l-.01-2.2h-.09zM33.1 7.05l-.22-1.13H29.6v15.25h3.64V11.5c.86-1.13 2.3-.93 2.76-.77V7.05c-.47-.18-2.22-.5-2.9.01zM37.84 5.92h3.65v15.25h-3.65zM37.84 4.7l3.65-.78V.95l-3.65.78V4.7zM50.6 5.71c-1.43 0-2.35.67-2.86 1.14l-.19-.93H44.3v20.35l3.65-.78.01-4.93c.52.38 1.3.92 2.6.92 2.63 0 5.03-2.11 5.03-6.77 0-4.28-2.44-5.99-5-5.99zm-.88 9.26c-.86 0-1.37-.31-1.73-.69l-.01-5.43c.39-.43.91-.72 1.74-.72 1.33 0 2.25 1.49 2.25 3.4 0 1.96-.9 3.44-2.25 3.44z" fill="currentColor"/>
    </svg>
  );
}

function MercadoPagoLogo() {
  return (
    <svg viewBox="0 0 120 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto">
      <rect width="120" height="32" rx="4" fill="#009EE3"/>
      <text x="8" y="22" fontFamily="Arial" fontWeight="bold" fontSize="13" fill="white">Mercado Pago</text>
    </svg>
  );
}

export function StepPayment({
    isProcessing,
    isActive,
    disabled = false,
}: StepPaymentProps) {
  const { user } = useAuth();
  const { watch, setValue, formState: { isSubmitting } } = useFormContext<CheckoutFormValues>();

  const values = watch();
  const selectedGateway = values.gateway || 'stripe';

  const selectedAddress = useMemo(() => {
    return user?.addresses?.find(a => a.id === values.addressId);
  }, [user, values.addressId]);

    const recipientDisplay = selectedAddress?.recipientName || values.guestName || 'Cliente invitado';

  const formattedDate = useMemo(() => {
    if (!values.deliveryDate) return 'No seleccionada';
    try {
      return format(parseISO(values.deliveryDate), "EEEE d 'de' MMMM", { locale: es });
    } catch (error) {
      return values.deliveryDate;
    }
  }, [values.deliveryDate]);

  const hasNoDedication = !values.dedication || values.dedication.trim() === '';
  const hasNoSignature = !values.signature || values.signature.trim() === '';

  return (
    <Card className={cn("rounded-[2rem] border-border/50 shadow-sm overflow-hidden transition-all", disabled && "opacity-50 pointer-events-none")}>
      <CardHeader className={cn("flex-row justify-between items-center p-6 md:p-8")}>
        <div className="flex items-center gap-4">
          <div className={cn("w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-lg transition-colors", !isActive && "bg-muted text-muted-foreground")}>
             5
          </div>
          <h3 className={cn("text-xl font-bold font-headline", !isActive && "text-muted-foreground")}>Revisión Final y Pago</h3>
        </div>
      </CardHeader>

      {isActive && (
        <CardContent className="p-6 md:p-8 pt-0 space-y-8 animate-in fade-in slide-in-from-top-2 font-sans">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-[1.5rem] md:rounded-2xl bg-muted/30 border border-border/50 space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary">
                        <Calendar className="w-3 h-3" />
                        <span>Entrega</span>
                    </div>
                    <div>
                        <p className="text-sm font-bold capitalize">{formattedDate}</p>
                        <p className="text-xs text-muted-foreground">{formatTimeSlotForUI(values.deliveryTimeSlot)}</p>
                    </div>
                </div>

                <div className="p-5 rounded-[1.5rem] md:rounded-2xl bg-muted/30 border border-border/50 space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary">
                        <MapPin className="w-3 h-3" />
                        <span>Destinatario</span>
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{selectedAddress?.alias || 'Ubicación'}</p>
                        <p className="text-xs text-muted-foreground truncate">Recibe: {recipientDisplay}</p>
                    </div>
                </div>

                <div className="p-5 md:p-6 rounded-[1.5rem] md:rounded-2xl bg-muted/30 border border-border/50 space-y-4 md:col-span-2 relative">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary">
                            <MessageSquare className="w-3 h-3" />
                            <span>Tu Tarjeta de Dedicatoria</span>
                        </div>
                        {(hasNoDedication || (hasNoSignature && !values.isAnonymous)) && (
                            <Badge variant="warning" className="text-[8px] h-5 font-bold tracking-tight rounded-full px-2 gap-1.5 animate-pulse bg-amber-100 text-amber-700 border-amber-200 flex items-center justify-center">
                                <AlertTriangle className="w-2.5 h-2.5" strokeWidth={3} />
                                <span className="translate-y-[0.5px]">Tarjeta Incompleta</span>
                            </Badge>
                        )}
                    </div>
                    <div>
                        <p className={cn("text-sm italic leading-relaxed", hasNoDedication ? "text-muted-foreground/50" : "text-foreground font-medium")}>
                            {hasNoDedication ? 'Sin mensaje personalizado seleccionado.' : `"${values.dedication}"`}
                        </p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-3 pt-3 border-t border-border/20">
                            <div className="flex items-center gap-2">
                                <User className="w-3 h-3 text-muted-foreground" />
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                                    Firma: {values.isAnonymous ? 'Envío Anónimo' : (hasNoSignature ? 'NO ESPECIFICADA' : values.signature)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Separator className="bg-border/50" />

            {/* Payment method selector */}
            <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                    <CreditCard className="w-3 h-3" />
                    Método de pago
                </p>
                <RadioGroup.Root
                    value={selectedGateway}
                    onValueChange={(val) => setValue('gateway', val, { shouldValidate: true })}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                    aria-label="Método de pago"
                >
                    <RadioGroup.Item value="stripe" asChild>
                        <button
                            type="button"
                            aria-label="Pagar con tarjeta de crédito o débito (Stripe)"
                            aria-pressed={selectedGateway === 'stripe'}
                            className={cn(
                                "flex flex-col items-start gap-3 p-5 rounded-2xl border-2 text-left transition-all cursor-pointer w-full",
                                selectedGateway === 'stripe'
                                    ? "border-primary bg-primary/5 shadow-sm"
                                    : "border-border/50 bg-muted/20 hover:border-border"
                            )}
                        >
                            <div className="flex items-center justify-between w-full">
                                <div className={cn("text-foreground", selectedGateway !== 'stripe' && "text-muted-foreground")}>
                                    <StripeLogo />
                                </div>
                                <div className={cn(
                                    "w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all",
                                    selectedGateway === 'stripe'
                                        ? "border-primary bg-primary"
                                        : "border-border"
                                )} />
                            </div>
                            <div>
                                <p className="text-xs font-bold">Tarjeta de crédito / débito</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">Visa, Mastercard, American Express</p>
                            </div>
                        </button>
                    </RadioGroup.Item>

                    <RadioGroup.Item value="mercadopago" asChild>
                        <button
                            type="button"
                            aria-label="Pagar con Mercado Pago (efectivo, transferencia y más)"
                            aria-pressed={selectedGateway === 'mercadopago'}
                            className={cn(
                                "flex flex-col items-start gap-3 p-5 rounded-2xl border-2 text-left transition-all cursor-pointer w-full",
                                selectedGateway === 'mercadopago'
                                    ? "border-primary bg-primary/5 shadow-sm"
                                    : "border-border/50 bg-muted/20 hover:border-border"
                            )}
                        >
                            <div className="flex items-center justify-between w-full">
                                <div className={cn(selectedGateway !== 'mercadopago' && "opacity-60")}>
                                    <MercadoPagoLogo />
                                </div>
                                <div className={cn(
                                    "w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all",
                                    selectedGateway === 'mercadopago'
                                        ? "border-primary bg-primary"
                                        : "border-border"
                                )} />
                            </div>
                            <div>
                                <p className="text-xs font-bold">Mercado Pago</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">Efectivo, transferencia y más</p>
                            </div>
                        </button>
                    </RadioGroup.Item>
                </RadioGroup.Root>
            </div>

            <Alert className="rounded-2xl bg-primary/5 border-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
                <AlertTitle className="font-bold text-sm">¡Todo listo para florecer!</AlertTitle>
                <AlertDescription className="text-xs text-muted-foreground">
                    Al confirmar, tu pedido se guardará en tu historial. Recibirás una notificación por correo al momento del pago.
                </AlertDescription>
            </Alert>

            <div className='p-8 border border-border/50 rounded-[2.5rem] bg-muted/20 flex flex-col items-center text-center space-y-6'>
                <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center shadow-inner">
                    <CreditCard className="w-8 h-8 text-primary/40" />
                </div>
                <div className="space-y-1">
                    <p className="font-bold text-lg">Confirmar y Pagar</p>
                    <p className="text-xs text-muted-foreground max-w-[250px] mx-auto leading-relaxed">Tu pago será procesado de forma segura a través de nuestra pasarela cifrada.</p>
                </div>
                <Button
                    type="submit"
                    className="w-full h-16 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 transition-all active:scale-[0.98] group bg-primary hover:bg-[#E6286B] border-none"
                    disabled={isProcessing || isSubmitting}
                    loading={isProcessing || isSubmitting}
                >
                    <span className="flex items-center gap-2">
                        Pagar Ahora
                        <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </span>
                </Button>
            </div>

            <div className="flex items-center justify-center gap-2 text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.25em]">
                <Lock className="w-3 h-3" />
                Pago Seguro SSL • Florarte
            </div>
        </CardContent>
      )}
    </Card>
  );
}
