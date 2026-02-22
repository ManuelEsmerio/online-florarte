// src/components/ContactSection.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, MapPin, Phone, Send } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const contactSchema = z.object({
    name: z.string().min(3, 'El nombre es requerido.'),
    email: z.string().email('Por favor, ingresa un correo válido.'),
    subject: z.string().min(5, 'El asunto es muy corto.'),
    message: z.string().min(10, 'El mensaje es muy corto.'),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const ContactSection = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '', subject: '', message: '' }
  });

  const { handleSubmit, reset } = form;

  const onSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
        title: '¡Mensaje Enviado!',
        description: 'Gracias por contactarnos. Te responderemos lo más pronto posible.',
        variant: 'success'
    });
    reset();
    setIsSubmitting(false);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32 items-start">
        
        {/* Info Column */}
        <div className="space-y-12 animate-fade-in">
          <div className="space-y-6">
            <h1 className="font-headline text-5xl md:text-7xl font-bold text-foreground leading-tight tracking-tight">
              Ponte en <br/><span className="italic text-primary">Contacto</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-md font-medium">
              ¿Tienes alguna pregunta o necesitas un arreglo personalizado? Estamos aquí para ayudarte en Tequila y toda la Región Valles.
            </p>
          </div>

          <div className="space-y-8">
            <div className="flex items-start gap-6 group">
              <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white group-hover:scale-110 transition-all duration-300 shadow-lg shadow-primary/5">
                <Phone className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Llámanos</p>
                <a href="tel:+523311091333" className="text-xl font-bold hover:text-primary transition-colors">+52 33 1109 1333</a>
              </div>
            </div>

            <div className="flex items-start gap-6 group">
              <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white group-hover:scale-110 transition-all duration-300 shadow-lg shadow-primary/5">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Correo Electrónico</p>
                <a href="mailto:contacto@floreriaflorarte.com" className="text-xl font-bold hover:text-primary transition-colors">contacto@floreriaflorarte.com</a>
              </div>
            </div>

            <div className="flex items-start gap-6 group">
              <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white group-hover:scale-110 transition-all duration-300 shadow-lg shadow-primary/5">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Visítanos</p>
                <p className="text-xl font-bold leading-tight">Av. Sixto Gorjón #68, Centro, <br/>Tequila, Jalisco, México</p>
              </div>
            </div>
          </div>

          {/* Map Container */}
          <div className="relative w-full h-[380px] rounded-[2.5rem] overflow-hidden bg-muted dark:bg-zinc-900 shadow-2xl group border border-border/50">
            <div className="absolute inset-0 bg-primary/5 z-10 pointer-events-none group-hover:opacity-0 transition-opacity duration-500"></div>
            <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3728.453392394018!2d-103.83984568899824!3d20.85382347712314!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x84260317e0615555%3A0x242488d35368a5!2sC.%20Sixto%20Gorj%C3%B3n%2068%2C%20Centro%2C%2046400%20Tequila%2C%20Jal.!5e0!3m2!1ses-419!2smx!4v1716333939633!5m2!1ses-419!2smx"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicación de Florería Florarte"
                className="grayscale invert dark:opacity-60 contrast-125 transition-all duration-700 group-hover:grayscale-0 group-hover:invert-0 group-hover:opacity-100"
            ></iframe>
          </div>
        </div>

        {/* Form Column */}
        <div className="bg-background dark:bg-zinc-900/50 p-8 md:p-12 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-white/5 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                <div className="space-y-8">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem className="space-y-2">
                                <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Tu Nombre</FormLabel>
                                <FormControl>
                                    <Input 
                                        placeholder="Juan Pérez" 
                                        {...field} 
                                        className="h-14 rounded-2xl bg-muted/30 dark:bg-zinc-800/50 border-none focus:ring-2 focus:ring-primary/20 font-medium transition-all"
                                    />
                                </FormControl>
                                <FormMessage className="text-xs" />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem className="space-y-2">
                                <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Tu Correo Electrónico</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="email" 
                                        placeholder="hola@ejemplo.com" 
                                        {...field} 
                                        className="h-14 rounded-2xl bg-muted/30 dark:bg-zinc-800/50 border-none focus:ring-2 focus:ring-primary/20 font-medium transition-all"
                                    />
                                </FormControl>
                                <FormMessage className="text-xs" />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                            <FormItem className="space-y-2">
                                <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Asunto</FormLabel>
                                <FormControl>
                                    <Input 
                                        placeholder="Consulta sobre evento" 
                                        {...field} 
                                        className="h-14 rounded-2xl bg-muted/30 dark:bg-zinc-800/50 border-none focus:ring-2 focus:ring-primary/20 font-medium transition-all"
                                    />
                                </FormControl>
                                <FormMessage className="text-xs" />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                            <FormItem className="space-y-2">
                                <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Tu Mensaje</FormLabel>
                                <FormControl>
                                    <Textarea 
                                        placeholder="Cuéntanos en qué podemos ayudarte..." 
                                        rows={5} 
                                        {...field} 
                                        className="rounded-2xl bg-muted/30 dark:bg-zinc-800/50 border-none focus:ring-2 focus:ring-primary/20 font-medium transition-all resize-none p-5"
                                    />
                                </FormControl>
                                <FormMessage className="text-xs" />
                            </FormItem>
                        )}
                    />
                </div>
                
                <Button 
                    type="submit" 
                    className="w-full h-16 rounded-3xl font-bold text-lg shadow-xl shadow-primary/30 transition-all transform hover:-translate-y-1 active:scale-[0.98] group flex items-center justify-center gap-3" 
                    loading={isSubmitting}
                >
                    <span>Enviar Mensaje</span>
                    <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default ContactSection;
