// src/components/checkout/StepPayment.tsx
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Lock, CreditCard, CheckCircle, Sparkles, MapPin, Calendar, MessageSquare, User, AlertTriangle } from 'lucide-react';
import { cn, formatTimeSlotForUI } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useFormContext } from 'react-hook-form';
import { CheckoutFormValues } from '@/app/checkout/page';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthContext';
import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';

interface StepPaymentProps {
  isProcessing: boolean;
  isActive: boolean;
  disabled?: boolean;
}

export function StepPayment({ 
    isProcessing, 
    isActive, 
    disabled = false,
}: StepPaymentProps) {
  const { user } = useAuth();
  const { watch, formState: { isSubmitting } } = useFormContext<CheckoutFormValues>();
  
  const values = watch();

  const selectedAddress = useMemo(() => {
    return user?.addresses?.find(a => a.id === values.addressId);
  }, [user, values.addressId]);

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
                        <p className="text-xs text-muted-foreground truncate">Recibe: {selectedAddress?.recipientName}</p>
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
