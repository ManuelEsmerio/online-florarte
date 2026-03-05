
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useFormContext } from 'react-hook-form';
import { CheckoutFormValues } from '@/app/checkout/CheckoutClientPage';
import { cn } from '@/lib/utils';
import { CheckCircle, ArrowRight, BookOpenText, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { formatPhoneDisplay, sanitizePhoneDigits } from '@/utils/phone';

interface StepPhoneProps {
  isActive: boolean;
  setActiveStep: (step: number) => void;
  disabled?: boolean;
  currentStep: number;
}

export function StepPhone({ isActive, setActiveStep, disabled = false, currentStep }: StepPhoneProps) {
  const { control, trigger, watch } = useFormContext<CheckoutFormValues>();
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const isGuestCheckout = !user?.id;

  const guestName = watch('guestName');
  const guestEmail = watch('guestEmail');
  const phone = watch('phone');
  const phoneCountryCode = watch('phoneCountryCode');
  const savePhoneToProfile = watch('savePhoneToProfile');

  const phoneDigits = sanitizePhoneDigits(phone);
  const phonePreview = formatPhoneDisplay(phoneCountryCode, phoneDigits);

  const isStepValid = isGuestCheckout
    ? (!!guestName && guestName.trim().length >= 3 && !!guestEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim().toLowerCase()) && /^\d{10}$/.test(phoneDigits))
    : /^\d{10}$/.test(phoneDigits);

  const isCompleted = isStepValid || currentStep > 1;

  const handleNext = async () => {
    const isValid = await trigger(isGuestCheckout ? ['guestName', 'guestEmail', 'phone'] : 'phone');
    if (!isValid) return;

    if (!isGuestCheckout && savePhoneToProfile && phoneDigits.length === 10) {
      const formattedPhone = formatPhoneDisplay(phoneCountryCode, phoneDigits);
      if (formattedPhone && formattedPhone !== (user?.phone ?? '')) {
        try {
          setIsSavingPhone(true);
          const result = await updateUser?.({ phone: formattedPhone });
          if (result?.success) {
            toast({ title: 'Teléfono actualizado', description: 'Guardamos este número en tu perfil.' });
          } else if (result && !result.success) {
            toast({ title: 'No pudimos guardar tu teléfono', description: result.message ?? 'Inténtalo más tarde.', variant: 'destructive' });
          }
        } catch (error) {
          console.error('[Checkout] phone update error', error);
          toast({ title: 'No pudimos guardar tu teléfono', description: 'Inténtalo más tarde.', variant: 'destructive' });
        } finally {
          setIsSavingPhone(false);
        }
      }
    }

    setActiveStep(2);
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
                  <p className="text-xs md:text-sm font-medium text-muted-foreground mt-0.5 tracking-tight truncate">
                    {phonePreview || 'Completa tus datos de contacto'}
                  </p>
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

          <div className="flex flex-col sm:flex-row gap-3">
            <FormField
              control={control}
              name="phoneCountryCode"
              render={({ field }) => (
                <FormItem className="sm:w-[170px]">
                  <FormLabel>País</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-14 rounded-2xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 font-bold">
                        <SelectValue placeholder="Selecciona un prefijo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="+52">México (+52)</SelectItem>
                      <SelectItem value="+1">Estados Unidos / Canadá (+1)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="phone"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input 
                        placeholder="33 1234 5678" 
                        {...field} 
                        type="tel"
                        inputMode="numeric"
                        onChange={(e) => {
                            const val = sanitizePhoneDigits(e.target.value);
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

          {!isGuestCheckout && (
            <FormField
              control={control}
              name="savePhoneToProfile"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start gap-3 rounded-2xl border border-border/40 bg-muted/20 p-4">
                  <FormControl>
                    <Checkbox
                      checked={Boolean(field.value)}
                      onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                      className="mt-1"
                    />
                  </FormControl>
                  <div className="space-y-1">
                    <FormLabel className="font-semibold text-sm">Guardar este teléfono en mi perfil</FormLabel>
                    <p className="text-xs text-muted-foreground">Lo usaremos para siguientes compras y notificaciones importantes.</p>
                  </div>
                </FormItem>
              )}
            />
          )}

          <div className="flex justify-center sm:justify-end pt-2">
            <Button 
                type="button" 
                onClick={handleNext} 
                disabled={!isStepValid || isSavingPhone}
                className="w-full sm:w-auto h-14 px-10 rounded-2xl font-bold shadow-lg shadow-primary/20 gap-2 transition-all active:scale-95 bg-primary hover:bg-[#E6286B]"
            >
                {isSavingPhone ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Guardando
                  </>
                ) : (
                  <>
                    Continuar
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
