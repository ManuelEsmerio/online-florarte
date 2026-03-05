'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO, isValid, addDays, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeliveryDateModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  currentDate?: string | null;
  onSave: (date: Date) => void;
}

export function DeliveryDateModal({
  isOpen,
  onOpenChange,
  currentDate,
  onSave,
}: DeliveryDateModalProps) {
  const [date, setDate] = useState<Date | undefined>();
  const [mounted, setMounted] = useState(false);

  // Definir los límites de fecha (Hoy hasta 2 semanas en el futuro)
  const today = useMemo(() => startOfToday(), []);
  const maxDate = useMemo(() => addDays(today, 14), [today]);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      if (currentDate && !currentDate.includes('No especificada')) {
        try {
            // Manejar formato YYYY-MM-DD
            const dateParts = currentDate.split('-').map(Number);
            const safeDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
             if (!isNaN(safeDate.getTime())) {
                setDate(safeDate);
            }
        } catch (e) {
            setDate(undefined);
        }
      } else {
        setDate(undefined);
      }
    }
  }, [isOpen, currentDate]);

  const handleSave = () => {
    if (date) {
      onSave(date);
      onOpenChange(false);
    }
  };

  const formattedSelectedDate = useMemo(() => {
    if (!mounted || !date) return 'No seleccionada';
    return format(date, "EEEE, d 'de' MMMM", { locale: es });
  }, [date, mounted]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-3xl md:w-[90vw] p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] max-h-[92vh]">
        <div className="px-8 md:px-12 pt-8 pb-6 text-center">
          <DialogTitle className="font-headline text-3xl font-bold tracking-tight text-foreground mb-2">
            Seleccionar Fecha de Entrega
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm font-medium">
            ¿Cuándo quieres que lleguen tus flores?
          </DialogDescription>
        </div>
        
        <div className="px-6 md:px-12 pb-10">
          <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr] items-start">
            <div className="bg-muted/40 dark:bg-neutral-900/50 rounded-3xl p-4 md:p-6 border border-border/50">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={[
                  { before: today },
                  { after: maxDate }
                ]}
                initialFocus
                locale={es}
                className="p-0 border-none bg-transparent"
              />
            </div>

            <div className="space-y-8">
              <div className="rounded-2xl bg-muted/20 dark:bg-neutral-900/60 p-5 border border-border/40">
                <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground mb-3 font-semibold">Entrega seleccionada</p>
                <p className={cn("text-2xl font-bold capitalize", date ? "text-primary" : "text-muted-foreground")}>{formattedSelectedDate}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Puedes programar tu entrega hasta 2 semanas a partir de hoy.
                </p>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={handleSave} 
                  className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  disabled={!date}
                >
                  Confirmar Fecha
                  <CheckCircle className="h-5 w-5" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full text-muted-foreground font-bold py-2 hover:bg-transparent hover:text-foreground text-sm uppercase tracking-widest"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
              </div>

              <div className="pt-2 flex flex-wrap justify-center gap-6 text-[11px] uppercase tracking-wider font-bold text-muted-foreground/60">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full border-2 border-primary"></span>
                  <span>Hoy</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  <span>Seleccionado</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
