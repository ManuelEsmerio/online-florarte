// src/app/admin/peak-dates/peak-date-form.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, RefreshCcw } from 'lucide-react';
import { cn, formatDateIntl, parseToUTCDate } from '@/lib/utils';
import { format, addYears, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { PeakDate } from '@/lib/definitions';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';

const peakDateSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  peak_date: z.date({ required_error: 'La fecha es requerida.' }).nullable(),
  is_coupon_restricted: z.boolean().default(false),
  repeat_annually: z.boolean().default(false),
});

type PeakDateFormValues = z.infer<typeof peakDateSchema>;

interface PeakDateFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (data: PeakDateFormValues, id?: number) => void;
  peakDate: PeakDate | null;
  allPeakDates: PeakDate[];
  isSaving: boolean;
}

export function PeakDateForm({ isOpen, onOpenChange, onSave, peakDate, allPeakDates, isSaving }: PeakDateFormProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const form = useForm<PeakDateFormValues>({
    resolver: zodResolver(peakDateSchema),
    defaultValues: {
      name: '',
      peak_date: null,
      is_coupon_restricted: false,
      repeat_annually: false,
    },
  });
  
  const { watch, setValue } = form;
  const isEditing = !!peakDate;

  useEffect(() => {
    if (isOpen) {
        if (isEditing && peakDate) {
            const localDate = peakDate.peak_date instanceof Date ? peakDate.peak_date : parseToUTCDate(String(peakDate.peak_date));
            if(localDate && !isNaN(localDate.getTime())) {
                const nextYearDate = addYears(localDate, 1);
                const isRecurring = allPeakDates.some(p => p.name === peakDate.name && p.peak_date.getFullYear() === nextYearDate.getFullYear());
                
                form.reset({
                    name: peakDate.name,
                    peak_date: localDate,
                    is_coupon_restricted: peakDate.is_coupon_restricted,
                    repeat_annually: isRecurring,
                });
            } else {
                 form.reset({ name: peakDate.name, peak_date: null, is_coupon_restricted: peakDate.is_coupon_restricted, repeat_annually: false });
            }
        } else {
            form.reset({ name: '', peak_date: null, is_coupon_restricted: false, repeat_annually: false });
        }
    }
  }, [peakDate, allPeakDates, isOpen, form, isEditing]);


  const onSubmit = (data: PeakDateFormValues) => {
    if (!data.peak_date) {
        form.setError('peak_date', { type: 'custom', message: 'La fecha es requerida.' });
        return;
    }
    onSave(data, peakDate?.id);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">{peakDate ? 'Editar Fecha Pico' : 'Crear Fecha Pico'}</DialogTitle>
          <DialogDescription>{peakDate ? 'Modifica los detalles del periodo.' : 'Completa el formulario para definir un nuevo periodo de alta demanda.'}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Evento</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Día de las Madres" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="peak_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha</FormLabel>
                   <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                                formatDateIntl(field.value)
                            ) : (
                                <span>Selecciona una fecha</span>
                            )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-50" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            setIsCalendarOpen(false);
                          }}
                          initialFocus
                          month={field.value || new Date()}
                          locale={es}
                        />
                      </PopoverContent>
                    </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="is_coupon_restricted"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Restringir Cupones</FormLabel>
                    <FormMessage />
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {!isEditing && (
              <FormField
                control={form.control}
                name="repeat_annually"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-lg border p-3 shadow-sm">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-0.5">
                      <FormLabel className="flex items-center gap-2">Repetir anualmente por 5 años <RefreshCcw className='w-4 h-4 text-muted-foreground'/></FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            )}
            
            <DialogFooter className="pt-4 sticky bottom-0 bg-background py-3 -mx-2 px-2">
              <DialogClose asChild>
                <Button type="button" variant="secondary" disabled={isSaving}>Cancelar</Button>
              </DialogClose>
              <Button type="submit" loading={isSaving}>Guardar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
