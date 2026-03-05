
'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFormContext } from 'react-hook-form';
import { CheckoutFormValues } from '@/app/checkout/CheckoutClientPage';
import { cn, formatTimeSlotForUI } from '@/lib/utils';
import { CalendarIcon, Clock as ClockIcon, CheckCircle, ArrowRight } from 'lucide-react';
import { DeliveryDateTimeModal } from './DeliveryDateTimeModal';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useCart } from '@/context/CartContext';

interface StepTimeSlotProps {
  isActive: boolean;
  setActiveStep: (step: number) => void;
  disabled?: boolean;
  currentStep: number;
}

export function StepTimeSlot({ isActive, setActiveStep, disabled = false, currentStep }: StepTimeSlotProps) {
  const { trigger, watch, setValue } = useFormContext<CheckoutFormValues>();
  const { setDeliveryDate: setGlobalDeliveryDate } = useCart();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const deliveryDate = watch('deliveryDate');
  const deliveryTimeSlot = watch('deliveryTimeSlot');

  const isCompleted = (!!deliveryDate && !!deliveryTimeSlot) || currentStep > 3;

  const handleNext = async () => {
    const isValid = await trigger(['deliveryDate', 'deliveryTimeSlot']);
    if (isValid) {
      setActiveStep(4);
    }
  };

  const handleSaveFromModal = (date: Date, timeSlot: string) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    setValue('deliveryDate', formattedDate, { shouldValidate: true, shouldDirty: true });
    setValue('deliveryTimeSlot', timeSlot, { shouldValidate: true, shouldDirty: true });
    if(setGlobalDeliveryDate) setGlobalDeliveryDate(formattedDate);
    setIsModalOpen(false);
  };
  
  const formatDateLabel = (dateString?: string): string => {
    if (!dateString) return 'No especificada';
    try {
      const date = parseISO(dateString);
      if (isNaN(date.getTime())) return dateString;
      return format(date, "EEEE d 'de' MMMM", { locale: es });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <Card className={cn(
        "rounded-[2rem] border-border/50 shadow-sm overflow-hidden transition-all duration-300", 
        disabled && "opacity-50 pointer-events-none",
        isActive ? "ring-2 ring-primary/20 shadow-xl" : ""
    )}>
      <CardHeader 
        className={cn("flex-row justify-between items-center p-6 md:p-8", !isActive && "cursor-pointer")} 
        onClick={() => !isActive && isCompleted && setActiveStep(3)}
      >
        <div className="flex items-center gap-4">
           <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center text-lg transition-all", 
              isCompleted && !isActive ? "bg-green-500/10 text-green-600" : "bg-primary/10 text-primary",
              isActive && "bg-primary text-white"
          )}>
            {isCompleted && !isActive ? <CheckCircle className="w-6 h-6"/> : <ClockIcon className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-xl font-bold font-headline">Escoge un horario</h3>
            {!isActive && isCompleted && (
                <p className="text-sm font-medium text-muted-foreground mt-0.5 tracking-tight capitalize">
                    {formatDateLabel(deliveryDate)} – {formatTimeSlotForUI(deliveryTimeSlot)}
                </p>
            )}
          </div>
        </div>
        {!isActive && isCompleted && (
            <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="text-primary font-bold text-xs uppercase tracking-widest"
                onClick={(e) => { e.stopPropagation(); setActiveStep(3); }}
            >
                Cambiar
            </Button>
        )}
      </CardHeader>
      
      {isActive && (
        <CardContent className="p-6 md:p-8 pt-0 space-y-8 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 bg-muted/30 rounded-[2rem] border border-border/50 flex flex-col items-center text-center space-y-3 group hover:bg-muted/40 transition-all cursor-pointer" onClick={() => setIsModalOpen(true)}>
                 <div className="w-12 h-12 rounded-2xl bg-background flex items-center justify-center shadow-sm text-primary group-hover:scale-110 transition-transform">
                     <CalendarIcon className="w-6 h-6"/>
                 </div>
                 <div>
                     <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Fecha de Entrega</p>
                     <p className="font-bold text-foreground capitalize">{deliveryDate ? formatDateLabel(deliveryDate) : 'No seleccionada'}</p>
                 </div>
              </div>

              <div className="p-6 bg-muted/30 rounded-[2rem] border border-border/50 flex flex-col items-center text-center space-y-3 group hover:bg-muted/40 transition-all cursor-pointer" onClick={() => setIsModalOpen(true)}>
                 <div className="w-12 h-12 rounded-2xl bg-background flex items-center justify-center shadow-sm text-primary group-hover:scale-110 transition-transform">
                     <ClockIcon className="w-6 h-6"/>
                 </div>
                 <div>
                     <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Horario Seleccionado</p>
                     <p className="font-bold text-foreground">{deliveryTimeSlot ? formatTimeSlotForUI(deliveryTimeSlot) : 'No seleccionado'}</p>
                 </div>
              </div>
          </div>

          <Button 
            type="button" 
            variant="outline" 
            className="w-full h-14 rounded-2xl border-2 border-primary/20 text-primary font-bold text-base hover:bg-primary/5 hover:border-primary transition-all active:scale-[0.98]" 
            onClick={() => setIsModalOpen(true)}
          >
            Modificar Fecha u Horario
          </Button>

          <div className="flex justify-end pt-2">
            <Button 
                type="button" 
                onClick={handleNext} 
                disabled={!(!!deliveryDate && !!deliveryTimeSlot)}
                className="h-14 px-10 rounded-2xl font-bold shadow-lg shadow-primary/20 gap-2 transition-all active:scale-95 bg-primary hover:bg-[#E6286B]"
            >
                Continuar
                <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </CardContent>
      )}

      <DeliveryDateTimeModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        currentDate={deliveryDate}
        currentTimeSlot={deliveryTimeSlot}
        onSave={handleSaveFromModal}
      />
    </Card>
  );
}
