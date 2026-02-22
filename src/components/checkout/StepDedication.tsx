
// src/components/checkout/StepDedication.tsx
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useFormContext } from 'react-hook-form';
import { CheckoutFormValues } from '@/app/checkout/page';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { MessageSquare, CheckCircle, Heart, ArrowRight } from 'lucide-react';

interface StepDedicationProps {
  isActive: boolean;
  setActiveStep: (step: number) => void;
  disabled?: boolean;
  currentStep: number;
}

export function StepDedication({ isActive, setActiveStep, disabled = false, currentStep }: StepDedicationProps) {
  const { control, watch, setValue } = useFormContext<CheckoutFormValues>();
  const isAnonymous = watch('isAnonymous');
  const dedication = watch('dedication');
  const signature = watch('signature');

  const isCompleted = !!(dedication || isAnonymous || signature) || currentStep > 4;

  useEffect(() => {
    if (isAnonymous) {
      setValue('signature', '');
    }
  }, [isAnonymous, setValue]);

  return (
    <Card className={cn(
        "rounded-[2rem] border-border/50 shadow-sm overflow-hidden transition-all duration-300", 
        disabled && "opacity-50 pointer-events-none",
        isActive ? "ring-2 ring-primary/20 shadow-xl" : ""
    )}>
       <CardHeader 
        className={cn("flex-row justify-between items-center p-6 md:p-8", !isActive && "cursor-pointer")} 
        onClick={() => !isActive && isCompleted && setActiveStep(4)}
      >
        <div className="flex items-center gap-4">
          <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center text-lg transition-all", 
              isCompleted && !isActive ? "bg-green-500/10 text-green-600" : "bg-primary/10 text-primary",
              isActive && "bg-primary text-white"
          )}>
            {isCompleted && !isActive ? <CheckCircle className="w-6 h-6"/> : <Heart className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-xl font-bold font-headline">Agrega una dedicatoria</h3>
            {!isActive && isCompleted && (
                <p className="text-sm font-medium text-muted-foreground mt-0.5 tracking-tight line-clamp-1 italic">
                    {dedication ? `"${dedication}"` : 'Envío sin mensaje.'}
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
                onClick={(e) => { e.stopPropagation(); setActiveStep(4); }}
            >
                Editar
            </Button>
        )}
      </CardHeader>
      
      {isActive && (
        <CardContent className="p-6 md:p-8 pt-0 space-y-8 animate-in fade-in slide-in-from-top-2 duration-500">
          <FormField 
            control={control} 
            name="dedication" 
            render={({ field }) => (
                <FormItem className="space-y-2">
                    <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Tu mensaje personalizado</FormLabel>
                    <FormControl>
                        <Textarea 
                            {...field} 
                            placeholder="Escribe aquí las palabras que acompañarán a tus flores..." 
                            className="min-h-[150px] rounded-[1.5rem] bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 font-medium p-5 resize-none text-lg leading-relaxed"
                        />
                    </FormControl>
                    <FormMessage className="text-xs font-bold uppercase tracking-tighter" />
                </FormItem>
            )} 
          />
          
          <div className="space-y-6">
            <FormField 
                control={control} 
                name="isAnonymous" 
                render={({ field }) => (
                    <FormItem className="flex items-center space-x-3 space-y-0 p-4 bg-muted/30 rounded-2xl border border-border/50 cursor-pointer transition-colors hover:bg-muted/40">
                        <FormControl>
                            <Checkbox 
                                checked={field.value} 
                                onCheckedChange={field.onChange} 
                                className="h-6 w-6 rounded-lg border-2 border-primary data-[state=checked]:bg-primary"
                            />
                        </FormControl>
                        <FormLabel className='font-bold text-sm text-foreground/80 cursor-pointer flex-1'>Quiero que mi envío sea totalmente anónimo</FormLabel>
                    </FormItem>
                )} 
            />
            
            <FormField 
                control={control} 
                name="signature" 
                render={({ field }) => (
                    <FormItem className="space-y-2">
                        <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">¿Quién envía? (Firma)</FormLabel>
                        <FormControl>
                            <Input 
                                {...field} 
                                placeholder="Tu nombre o un apodo especial..." 
                                disabled={isAnonymous} 
                                className="h-14 rounded-xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 font-medium px-5"
                            />
                        </FormControl>
                        <FormMessage className="text-xs font-bold uppercase tracking-tighter" />
                    </FormItem>
                )} 
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button 
                type="button" 
                onClick={() => setActiveStep(5)} 
                className="h-14 px-10 rounded-2xl font-bold next-step-btn shadow-lg shadow-primary/20 gap-2 transition-all active:scale-95 bg-primary hover:bg-[#E6286B]"
            >
                Siguiente Paso
                <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
