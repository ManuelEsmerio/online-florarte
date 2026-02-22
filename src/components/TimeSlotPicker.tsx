'use client';

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { isToday, getHours, getDay } from "date-fns";
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Controller, Control, useFormContext } from 'react-hook-form';
import { formatTimeSlotForUI } from "@/lib/utils";

interface TimeSlotPickerProps {
  control: Control<any>; // Allow any form values
  name: any;
  deliveryDate?: Date;
}

const timeSlots = [
  { value: "9-13", label: formatTimeSlotForUI("9-13") },
  { value: "13-18", label: formatTimeSlotForUI("13-18") },
  { value: "18-20", label: formatTimeSlotForUI("18-20") },
];

function TimeSlotPicker({ control, name, deliveryDate }: TimeSlotPickerProps) {
  const isDeliveryToday = useMemo(() => {
    return deliveryDate ? isToday(deliveryDate) : false;
  }, [deliveryDate]);

  const isSunday = useMemo(() => {
    return deliveryDate ? getDay(deliveryDate) === 0 : false;
  }, [deliveryDate]);

  const currentHour = useMemo(() => getHours(new Date()), []);
  
  const availableSlots = useMemo(() => {
    if (!deliveryDate) return []; 
    
    // Si es domingo, solo permitimos el bloque de la mañana (9:00 AM - 1:00 PM)
    let slots = isSunday 
      ? timeSlots.filter(slot => slot.value === "9-13") 
      : timeSlots;

    // Filtrar por horario de operación si es hoy
    if (isDeliveryToday) {
      slots = slots.filter(slot => {
        const startHour = parseInt(slot.value.split('-')[0], 10);
        return currentHour < startHour;
      });
    }
    
    return slots;
  }, [isSunday, isDeliveryToday, currentHour, deliveryDate]);
  
  const { formState: { errors } } = useFormContext();
  const error = errors[name];

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className="space-y-4">
          {!deliveryDate ? (
            <div className="text-center text-muted-foreground p-4 border rounded-md">
              <p>Selecciona una fecha para ver los horarios disponibles.</p>
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/10 text-center">
                <p className="text-sm font-medium text-destructive">
                    {isSunday && isDeliveryToday && currentHour >= 9 
                        ? "La florería cierra temprano los domingos. Ya no hay horarios de entrega disponibles para hoy." 
                        : "Ya no hay horarios de entrega disponibles para la fecha seleccionada."}
                </p>
            </div>
          ) : (
            <RadioGroup
              onValueChange={field.onChange}
              value={field.value}
              className="grid grid-cols-1 gap-3"
            >
              {availableSlots.map(slot => (
                <Label
                  key={slot.value}
                  htmlFor={`slot-${slot.value}`}
                  className={cn(
                    "flex items-center justify-center rounded-full border-2 h-12 px-4 text-sm font-bold transition-all cursor-pointer",
                    field.value === slot.value 
                      ? "border-primary bg-primary/10 text-primary shadow-sm" 
                      : "border-border text-muted-foreground hover:border-primary/50"
                  )}
                >
                  <RadioGroupItem value={slot.value} id={`slot-${slot.value}`} className="sr-only" />
                  {slot.label}
                </Label>
              ))}
            </RadioGroup>
          )}

           {error && <p className="text-sm font-medium text-destructive">{String(error.message)}</p>}
        </div>
      )}
    />
  );
}

export default TimeSlotPicker;
