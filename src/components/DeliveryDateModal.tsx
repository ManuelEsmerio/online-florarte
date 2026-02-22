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
      <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl rounded-3xl max-h-[90vh] flex flex-col">
        <div className="px-8 pt-8 pb-4 text-center shrink-0">
          <DialogTitle className="font-headline text-3xl font-bold tracking-tight text-foreground mb-2">
            Seleccionar Fecha de Entrega
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm font-medium">
            ¿Cuándo quieres que lleguen tus flores?
          </DialogDescription>
        </div>
        
        <div className="flex-1 overflow-y-auto px-6 pb-10 custom-scrollbar">
          <div className="bg-muted/40 dark:bg-neutral-900/50 rounded-2xl p-6 flex justify-center border border-border/50">
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
          
          <div className="mt-8 space-y-6 px-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium text-xs uppercase tracking-widest">Entrega seleccionada:</span>
              <span className={cn("font-bold capitalize text-right", date ? "text-primary" : "text-muted-foreground")}>
                {formattedSelectedDate}
              </span>
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

            {/* Legend section */}
            <div className="pt-4 flex justify-center gap-6 text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60">
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
