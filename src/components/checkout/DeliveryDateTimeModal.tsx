'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import TimeSlotPicker from '@/components/TimeSlotPicker';
import { format, parseISO, isValid, addDays, startOfToday, getDay, isToday, getHours } from 'date-fns';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form } from '../ui/form';
import { es } from 'date-fns/locale';
import { CheckCircle } from 'lucide-react';

const modalSchema = z.object({
  deliveryDate: z.date({ required_error: 'La fecha es requerida.' }),
  deliveryTimeSlot: z.string().min(1, 'El horario es requerido.'),
});

type ModalFormValues = z.infer<typeof modalSchema>;

interface DeliveryDateTimeModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  currentDate?: string;
  currentTimeSlot?: string;
  onSave: (date: Date, timeSlot: string) => void;
}

export function DeliveryDateTimeModal({
  isOpen,
  onOpenChange,
  currentDate,
  currentTimeSlot,
  onSave,
}: DeliveryDateTimeModalProps) {
  const [mounted, setMounted] = useState(false);
  const form = useForm<ModalFormValues>({
    resolver: zodResolver(modalSchema),
    defaultValues: {
      deliveryDate: undefined,
      deliveryTimeSlot: '',
    },
  });

  const { handleSubmit, control, watch, setValue } = form;
  const watchedDate = watch('deliveryDate');
  const watchedTimeSlot = watch('deliveryTimeSlot');

  const today = useMemo(() => startOfToday(), []);
  const maxDate = useMemo(() => addDays(today, 14), [today]);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
        const initialDate = currentDate ? parseISO(currentDate) : undefined;
        if (initialDate && isValid(initialDate)) {
            setValue('deliveryDate', initialDate);
        } else {
            setValue('deliveryDate', undefined as any);
        }
        setValue('deliveryTimeSlot', currentTimeSlot || '');
    }
  }, [isOpen, currentDate, currentTimeSlot, setValue]);

  useEffect(() => {
    if (watchedDate && watchedTimeSlot) {
      const isSunday = getDay(watchedDate) === 0;
      if (isSunday && watchedTimeSlot !== "9-13") {
        setValue('deliveryTimeSlot', '');
      }
      
      if (isToday(watchedDate)) {
        const currentHour = getHours(new Date());
        const startHour = parseInt(watchedTimeSlot.split('-')[0], 10);
        if (currentHour >= startHour) {
          setValue('deliveryTimeSlot', '');
        }
      }
    }
  }, [watchedDate, watchedTimeSlot, setValue]);

  const handleSave = (data: ModalFormValues) => {
    onSave(data.deliveryDate, data.deliveryTimeSlot);
  };

  const formattedSelectedDate = useMemo(() => {
    if (!mounted || !watchedDate) return 'No seleccionada';
    return format(watchedDate, "EEEE, d 'de' MMMM", { locale: es });
  }, [watchedDate, mounted]);
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border-none shadow-2xl rounded-3xl max-h-[95vh] flex flex-col">
        <div className="px-6 pt-6 pb-2 text-center shrink-0">
          <DialogTitle className="font-headline text-2xl md:text-3xl font-bold tracking-tight">Seleccionar Fecha de Entrega</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm mt-1">
            ¿Cuándo quieres que lleguen tus flores?
          </DialogDescription>
        </div>

        <FormProvider {...form}>
          <Form {...form}>
            <form onSubmit={handleSubmit(handleSave)} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto px-4 pb-6 custom-scrollbar">
                <div className="bg-muted/50 dark:bg-neutral-900/50 rounded-2xl p-4 md:p-6">
                  <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                    <div className="flex justify-center flex-1">
                        <Controller
                            control={control}
                            name="deliveryDate"
                            render={({ field }) => (
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={[
                                      { before: today },
                                      { after: maxDate }
                                    ]}
                                    initialFocus
                                    className="p-0 border-none bg-transparent"
                                    locale={es}
                                />
                            )}
                        />
                    </div>
                    <div className="flex-1 space-y-4">
                      <h3 className="font-bold text-center text-[10px] uppercase tracking-widest text-muted-foreground">Horario de entrega</h3>
                       <Controller
                          name="deliveryTimeSlot"
                          control={control}
                          render={({ field }) => (
                             <TimeSlotPicker
                               control={control}
                               name="deliveryTimeSlot"
                               deliveryDate={watchedDate}
                             />
                          )}
                        />
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-4 px-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground font-medium text-xs uppercase tracking-widest">Entrega seleccionada:</span>
                    <span className="font-bold text-primary capitalize text-right">{formattedSelectedDate}</span>
                  </div>
                  
                  <div className="space-y-3">
                    <Button 
                      type="submit" 
                      className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98] gap-2"
                      disabled={!watchedDate || !watchedTimeSlot}
                    >
                      Confirmar Fecha
                      <CheckCircle className="h-5 w-5" />
                    </Button>
                    
                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="w-full text-muted-foreground font-bold py-2 hover:bg-transparent hover:text-foreground text-sm uppercase tracking-widest"
                      onClick={() => onOpenChange(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </Form>
        </FormProvider>
      </DialogContent>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--primary) / 0.2);
          border-radius: 10px;
        }
      `}</style>
    </Dialog>
  );
}
