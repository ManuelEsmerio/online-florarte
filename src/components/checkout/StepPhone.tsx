
'use client';

import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useFormContext } from 'react-hook-form';
import { CheckoutFormValues } from '@/app/checkout/CheckoutClientPage';
import { cn } from '@/lib/utils';
import { CheckCircle, ArrowRight, BookOpenText } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface StepPhoneProps {
  isActive: boolean;
  setActiveStep: (step: number) => void;
  disabled?: boolean;
  currentStep: number;
}

export function StepPhone({ isActive, setActiveStep, disabled = false, currentStep }: StepPhoneProps) {
  const { control, trigger, watch } = useFormContext<CheckoutFormValues>();
  const { user } = useAuth();
  const isGuestCheckout = !user?.id;

  const guestName = watch('guestName');
  const guestEmail = watch('guestEmail');
  const phone = watch('phone');

  const isStepValid = isGuestCheckout
    ? (!!guestName && guestName.trim().length >= 3 && !!guestEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim().toLowerCase()) && !!phone && /^\d{10}$/.test(phone))
    : (!!phone && /^\d{10}$/.test(phone));

  const isCompleted = isStepValid || currentStep > 1;

  const handleNext = async () => {
    const isValid = await trigger(isGuestCheckout ? ['guestName', 'guestEmail', 'phone'] : 'phone');
    if (isValid) {
      setActiveStep(2);
    }
  };

  return (
    <Card className={cn(
        "w-full rounded-[2.5rem] border-border/50 shadow-sm overflow-hidden transition-all duration-300 bg-background dark:bg-zinc-900/50", 
        disabled && "opacity-50 pointer-events-none",
        isActive ? "ring-2 ring-primary/20 shadow-xl" : ""
    )}>
      <CardHeader 
        className={cn("p-6 md:p-8 !pb-4", !isActive && "cursor-pointer")} 
        onClick={() => !isActive && isCompleted && setActiveStep(1)}
      >
        <div className="flex flex-row justify-between items-center w-full gap-4">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <div className={cn(
                "w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center text-lg transition-all shrink-0", 
                isCompleted && !isActive ? "bg-green-500/10 text-green-600" : "bg-primary/10 text-primary",
                isActive && "bg-primary text-white"
            )}>
              {isCompleted && !isActive ? <CheckCircle className="w-5 h-5 md:w-6 md:h-6"/> : <BookOpenText className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-base md:text-xl font-bold font-headline truncate">Confirma tus datos</h3>
              {!isActive && isCompleted && (
                  <p className="text-xs md:text-sm font-medium text-muted-foreground mt-0.5 tracking-tight truncate">+52 {phone}</p>
              )}
            </div>
          </div>
          {!isActive && isCompleted && (
            <button 
                type="button"
                className="text-primary font-bold text-[10px] md:text-xs uppercase tracking-widest hover:underline px-2 py-1 shrink-0 ml-auto"
                onClick={(e) => { e.stopPropagation(); setActiveStep(1); }}
            >
                Cambiar
            </button>
          )}
        </div>
      </CardHeader>
      
      {isActive && (
        <CardContent className="p-6 md:p-8 pt-0 space-y-6 animate-in fade-in slide-in-from-top-2 duration-500">
          <p className="text-sm text-muted-foreground leading-relaxed font-medium">
            Lo usaremos para comunicarnos contigo de forma inmediata si hay algún detalle con la entrega de tus flores.
          </p>

          {isGuestCheckout && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={control}
                name="guestName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre completo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nombre y apellidos"
                        {...field}
                        className="h-12 rounded-xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 font-semibold"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="guestEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="correo@ejemplo.com"
                        type="email"
                        autoComplete="email"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.trim())}
                        className="h-12 rounded-xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 font-semibold"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          <div className="flex gap-3">
            <div className="flex items-center justify-center bg-muted/30 rounded-2xl border border-border/50 px-5 font-bold text-sm text-foreground shrink-0">+52</div>
            <FormField
              control={control}
              name="phone"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input 
                        placeholder="33 1234 5678" 
                        {...field} 
                        type="tel"
                        inputMode="numeric"
                        onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                            field.onChange(val);
                        }}
                        className="h-14 rounded-2xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 font-bold text-lg tracking-wider"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex justify-center sm:justify-end pt-2">
            <Button 
                type="button" 
                onClick={handleNext} 
              disabled={!isStepValid}
                className="w-full sm:w-auto h-14 px-10 rounded-2xl font-bold shadow-lg shadow-primary/20 gap-2 transition-all active:scale-95 bg-primary hover:bg-[#E6286B]"
            >
                Continuar
                <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
