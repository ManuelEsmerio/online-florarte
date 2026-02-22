'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Send, Flower2, Sparkles, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const newsletterSchema = z.object({
  email: z.string().email('Ingresa un correo electrónico válido.'),
});

type NewsletterFormValues = z.infer<typeof newsletterSchema>;

export function Newsletter() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const form = useForm<NewsletterFormValues>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: NewsletterFormValues) => {
    setIsSubmitting(true);
    // Simulación de suscripción a la API
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setIsSuccess(true);
    setIsSubmitting(false);
    
    toast({
      title: '¡Bienvenido al Club Florarte!',
      description: 'Te has suscrito correctamente a nuestras promociones.',
      variant: 'success',
    });

    setTimeout(() => {
      setIsSuccess(false);
      form.reset();
    }, 5000);
  };

  return (
    <section className="py-16 md:py-24 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        <div className={cn(
          "relative w-full max-w-5xl mx-auto rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-16 text-center md:text-left shadow-2xl transition-all duration-500",
          "bg-primary text-white overflow-hidden group"
        )}>
          {/* Decorative backgrounds */}
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <Flower2 className="w-64 h-64 rotate-12" />
          </div>
          <div className="absolute -bottom-10 -left-10 p-8 opacity-10 group-hover:-rotate-12 transition-transform duration-700">
            <Flower2 className="w-48 h-48" />
          </div>

          <div className="relative z-10 grid md:grid-cols-2 gap-10 md:gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm animate-fade-in mx-auto md:mx-0">
                <Sparkles className="w-4 h-4 text-white" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Beneficio Exclusivo</span>
              </div>
              
              <h2 className="text-3xl md:text-6xl font-bold font-headline leading-tight text-balance">
                Únete al <br className="hidden md:block" /> Club Florarte
              </h2>
              
              <p className="text-white/90 text-sm md:text-xl max-w-md leading-relaxed text-balance mx-auto md:mx-0">
                Recibe promociones especiales, consejos de cuidado floral y un regalo en tu primera compra después de suscribirte.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-white/20 shadow-xl">
              {isSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 animate-in zoom-in duration-300">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-lg">
                    <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold mb-2">¡Ya eres parte del club!</h3>
                  <p className="text-white/80 text-sm md:text-base">Revisa tu bandeja de entrada para tu sorpresa de bienvenida.</p>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" suppressHydrationWarning>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/70 ml-1 text-left block">Tu Correo Electrónico</label>
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                placeholder="ejemplo@correo.com"
                                {...field}
                                disabled={isSubmitting || !mounted}
                                className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-white border-none text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-black/10 transition-all text-base md:text-lg font-medium"
                              />
                            </FormControl>
                            <FormMessage className="text-white bg-black/20 rounded-lg px-3 py-1 text-[10px] font-bold" />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Button
                      type="submit"
                      disabled={isSubmitting || !mounted}
                      className="w-full h-14 md:h-16 bg-zinc-900 hover:bg-black text-white rounded-xl md:rounded-2xl text-base md:text-lg font-bold shadow-2xl transition-all active:scale-[0.98] group flex items-center justify-center gap-3 mt-4"
                    >
                      {isSubmitting ? (
                        "Procesando..."
                      ) : (
                        <>
                          <span>Quiero mis beneficios</span>
                          <Send className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </>
                      )}
                    </Button>
                    
                    <p className="text-[9px] md:text-[10px] text-center text-white/50 pt-2 uppercase tracking-tighter font-medium">
                      Al suscribirte, aceptas nuestras políticas de privacidad. Sin spam, solo flores.
                    </p>
                  </form>
                </Form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
