'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Isotype } from './icons/Isotype';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from './ui/form';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const newsletterSchema = z.object({
  email: z.string().email('Ingresa un correo electrónico válido.'),
});

type NewsletterFormValues = z.infer<typeof newsletterSchema>;

const FacebookIcon = () => (
  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path></svg>
);

const InstagramIcon = () => (
  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path></svg>
);

const TwitterIcon = () => (
  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"></path></svg>
);

const PaymentIcons = () => (
  <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6 mb-10">
    {/* Visa — brand color badge */}
    <div className="h-8 px-3 bg-[#1A1F71] rounded flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity duration-300" title="Visa">
      <span className="text-white font-black text-sm italic tracking-wider select-none">VISA</span>
    </div>
    {/* Mastercard — two overlapping circles */}
    <div className="h-8 px-2 bg-card rounded border border-border/40 flex items-center opacity-60 hover:opacity-100 transition-opacity duration-300" title="Mastercard">
      <div className="relative flex items-center w-10">
        <div className="w-6 h-6 rounded-full bg-[#EB001B]" />
        <div className="w-6 h-6 rounded-full bg-[#F79E1B] -ml-3" />
      </div>
    </div>
    {/* American Express */}
    <div className="h-8 px-3 bg-[#2E77BC] rounded flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity duration-300" title="American Express">
      <span className="text-white font-bold text-[11px] tracking-wider select-none">AMEX</span>
    </div>
    {/* PayPal */}
    <div className="h-8 px-2.5 bg-[#003087] rounded flex items-center gap-0.5 opacity-60 hover:opacity-100 transition-opacity duration-300" title="PayPal">
      <span className="text-[#009CDE] font-black text-sm tracking-tight select-none">Pay</span>
      <span className="text-[#009CDE] font-black text-sm tracking-tight select-none opacity-70">Pal</span>
    </div>
    {/* OXXO PAY */}
    <div className="flex items-center h-8 text-[11px] font-bold tracking-[0.1em] text-muted-foreground border border-border px-3 rounded opacity-60 hover:opacity-100 transition-all duration-300 cursor-default select-none">
      OXXO PAY
    </div>
  </div>
);

export function Footer() {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const form = useForm<NewsletterFormValues>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: NewsletterFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          source: 'footer',
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        toast.error('No se pudo completar la suscripción', {
          description: result?.error || 'Intenta nuevamente en unos minutos.',
        });
        return;
      }

      toast.success('¡Suscripción exitosa!', {
        description: result?.message || 'Te hemos añadido a nuestra lista de correos.',
      });
      form.reset();
    } catch {
      toast.error('Error de conexión', {
        description: 'No se pudo enviar tu correo. Intenta nuevamente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const legalLinks = [
    { href: '/customer-service', label: 'Atención al Cliente' },
    { href: '/shipping-policy', label: 'Políticas de Envío' },
    { href: '/cancellation-policy', label: 'Política de Cancelación' },
    { href: '/substitution-policy', label: 'Política de Sustitución' },
    { href: '/terms-and-conditions', label: 'Términos y Condiciones' },
    { href: '/privacy-policy', label: 'Aviso de Privacidad' },
    { href: '/cookies-policy', label: 'Aviso de Cookies' },
  ];

  return (
    <footer className={cn(
      "bg-background text-muted-foreground pt-16 pb-8 border-t border-border font-sans transition-colors duration-300",
      pathname !== '/' && "max-md:hidden"
    )}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-12 mb-16">
          {/* Brand Info */}
          <div className="col-span-2 lg:col-span-4 space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/20">
                <Isotype className="h-6 w-6 brightness-0 invert" />
              </div>
              <span className="text-3xl font-headline font-bold text-foreground tracking-tight">Florarte</span>
            </div>
            <p className="text-base leading-relaxed max-w-sm">
              Creando momentos inolvidables con el lenguaje de las flores en Tequila, Jalisco y la Región Valles.
            </p>
            <div className="flex items-center gap-5">
              {/* TODO: reemplazar con las URLs reales de redes sociales de Florarte */}
              <a href="https://www.facebook.com/florarte" target="_blank" rel="noopener noreferrer" className="social-icon text-muted-foreground hover:text-primary transition-all duration-300 hover:-translate-y-1" aria-label="Facebook">
                <FacebookIcon />
              </a>
              <a href="https://www.instagram.com/florarte" target="_blank" rel="noopener noreferrer" className="social-icon text-muted-foreground hover:text-primary transition-all duration-300 hover:-translate-y-1" aria-label="Instagram">
                <InstagramIcon />
              </a>
              <a href="https://www.twitter.com/florarte" target="_blank" rel="noopener noreferrer" className="social-icon text-muted-foreground hover:text-primary transition-all duration-300 hover:-translate-y-1" aria-label="Twitter">
                <TwitterIcon />
              </a>
            </div>
          </div>

          {/* Collections */}
          <div className="col-span-1 lg:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-foreground mb-8">Colecciones</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link href="/products/all" className="hover:text-primary transition-colors">Ver Todo</Link></li>
              <li><Link href="/categories/arreglos-florales" className="hover:text-primary transition-colors">Arreglos</Link></li>
              <li><Link href="/categories/ramos-florales" className="hover:text-primary transition-colors">Ramos</Link></li>
              <li><Link href="/categories/plantas" className="hover:text-primary transition-colors">Plantas</Link></li>
              <li><Link href="/categories/paquetes" className="hover:text-primary transition-colors">Paquetes</Link></li>
              <li><Link href="/categories/complementos" className="hover:text-primary transition-colors">Complementos</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div className="col-span-1 lg:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-foreground mb-8">Empresa</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link href="/about" className="hover:text-primary transition-colors">Sobre Nosotros</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contacto</Link></li>
              <li><Link href="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
              <li><Link href="/customer-service" className="hover:text-primary transition-colors">Ayuda</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="col-span-2 lg:col-span-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-foreground mb-8">Newsletter</h4>
            <p className="text-sm mb-6 leading-relaxed">Suscríbete para recibir ofertas exclusivas y consejos de cuidado floral.</p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3" suppressHydrationWarning>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder="Tu correo electrónico"
                          {...field}
                          disabled={isSubmitting || !mounted}
                          className="h-12 rounded bg-muted border-none focus:ring-2 focus:ring-primary/50 text-foreground"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  loading={isSubmitting || !mounted}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium rounded transition-all shadow-lg shadow-primary/20 active:scale-[0.98]"
                >
                  Suscribirse
                </Button>
              </form>
            </Form>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-12 border-t border-border flex flex-col items-center">
          <PaymentIcons />

          <nav className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-xs text-muted-foreground mb-8">
            {legalLinks.map((link, index) => (
              <React.Fragment key={link.href}>
                <Link href={link.href} className="hover:text-primary transition-all active:scale-95">
                  {link.label}
                </Link>
                {index < legalLinks.length - 1 && (
                  <span className="hidden md:inline w-1 h-1 bg-border rounded-full"></span>
                )}
              </React.Fragment>
            ))}
          </nav>

          <p className="text-[11px] text-muted-foreground uppercase tracking-widest text-center font-bold">
            &copy; {currentYear} Florarte. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
