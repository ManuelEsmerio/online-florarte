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
  <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10 mb-10">
    {/* VISA */}
    <svg className="h-4 w-auto text-slate-400 dark:text-slate-500 fill-current opacity-50 hover:opacity-100 transition-opacity duration-300" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path d="M31.8 14.4h-4.2c-.9 0-1.6.5-1.9 1.3l-7.4 17.9h4.6l.9-2.5h5.6l.5 2.5h4.1l-2.2-19.2zm-5.8 13.1l2.3-6.4 1.3 6.4h-3.6zM11.1 14.4l-4.2 13.8-.4-2.1c-.7-2.4-2.9-5-5.4-6.6l3.5 12.8h4.8l7.1-17.9H11.1zm35.8 0h-3.7c-1.1 0-2 .7-2.3 1.7l-3.3 16.2h4.6l.9-4.5h5.6l.5 4.5h4.1l-2.4-17.9z"/>
    </svg>
    {/* Mastercard */}
    <svg className="h-6 w-auto text-slate-400 dark:text-slate-500 fill-current opacity-50 hover:opacity-100 transition-opacity duration-300" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path d="M15.5 14c-5.5 0-10 4.5-10 10s4.5 10 10 10 10-4.5 10-10-4.5-10-10-10zm17 0c-5.5 0-10 4.5-10 10s4.5 10 10 10 10-4.5 10-10-4.5-10-10-10zm-8.5 3.3c1.8 1.8 2.8 4.2 2.8 6.7s-1 4.9-2.8 6.7c-1.8-1.8-2.8-4.2-2.8-6.7s1-4.9 2.8-6.7z"/>
    </svg>
    {/* AMEX */}
    <svg className="h-6 w-auto text-slate-400 dark:text-slate-500 fill-current opacity-50 hover:opacity-100 transition-opacity duration-300" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 10v28h40V10H4zm10.5 19.5h-2.2l-.4-1.2h-3.3l-.4 1.2H6l3.1-8.6h2.3l3.1 8.6zm10.2 0h-2.1V25l-1.8 4.5h-1.4l-1.8-4.5v4.5H15.5V20.9h2.5l2.1 5.3 2.1-5.3h2.5v8.6zm10.3 0h-6.5V20.9h6.5v1.8h-4.4v1.6h4.1v1.8h-4.1v1.6h4.4v1.8zm7 0h-2.3l-1.6-2.5-1.6 2.5h-2.3l2.7-4.3-2.7-4.3h2.3l1.6 2.5 1.6-2.5h2.3l-2.7 4.3 2.7 4.3zM10.8 26.5l-1.3-3.6-1.3 3.6h2.6z"/>
    </svg>
    {/* PayPal */}
    <svg className="h-6 w-auto text-slate-400 dark:text-slate-500 fill-current opacity-50 hover:opacity-100 transition-opacity duration-300" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.067 8.178c-.552 4.153-3.26 6.339-7.374 6.339h-1.693c-.469 0-.806.353-.933.839l-1.121 4.232c-.061.225-.242.412-.467.412h-3.41c-.367 0-.533-.33-.407-.67l2.226-8.41c.127-.48.519-.831.988-.831h1.121c3.738 0 5.952-1.885 6.411-5.355.218-1.656-.12-3.049-1.214-4.062-.305-.282-.015-.67.367-.67h.11c3.275 0 5.513 1.843 5.399 8.158zm-8.235-3.328h-1.121c-.469 0-.861.351-.988.831l-2.226 8.41c-.126.34.04.67.407.67h3.41c.225 0 .406-.187.467-.412l1.121-4.232c.127-.486.464-.839.933-.839h1.693c4.114 0 6.822-2.186 7.374-6.339.114-6.315-2.124-8.158-5.399-8.158h-.11c-.382 0-.672.388-.367.67 1.094 1.013 1.432 2.406 1.214 4.062-.459 3.47-2.673 5.355-6.411 5.355z"/>
    </svg>
    {/* OXXO PAY */}
    <div className="flex items-center text-[10px] font-bold tracking-[0.1em] text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-700 px-3 py-1.5 rounded-lg opacity-50 hover:opacity-100 transition-all duration-300 cursor-default">
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
    await new Promise((resolve) => setTimeout(resolve, 1500));
    toast.success('¡Suscrito!', {
      description: 'Te hemos añadido a nuestra lista de correos.',
    });
    form.reset();
    setIsSubmitting(false);
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
      "bg-background dark:bg-zinc-950 text-slate-600 dark:text-slate-400 pt-16 pb-8 border-t border-slate-200 dark:border-white/5 font-sans transition-colors duration-300",
      pathname !== '/' && "max-md:hidden"
    )}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-12 mb-16">
          {/* Brand Info */}
          <div className="col-span-2 lg:col-span-4 space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/20">
                <Isotype className="h-6 w-6 brightness-0 invert dark:brightness-0" />
              </div>
              <span className="text-3xl font-headline font-bold text-slate-900 dark:text-white tracking-tight">Florarte</span>
            </div>
            <p className="text-base leading-relaxed max-w-sm">
              Creando momentos inolvidables con el lenguaje de las flores en Tequila, Jalisco y la Región Valles.
            </p>
            <div className="flex items-center gap-5">
              <a href="#" className="social-icon text-slate-400 dark:text-slate-500 hover:text-primary transition-all duration-300 hover:-translate-y-1" aria-label="Facebook">
                <FacebookIcon />
              </a>
              <a href="#" className="social-icon text-slate-400 dark:text-slate-500 hover:text-primary transition-all duration-300 hover:-translate-y-1" aria-label="Instagram">
                <InstagramIcon />
              </a>
              <a href="#" className="social-icon text-slate-400 dark:text-slate-500 hover:text-primary transition-all duration-300 hover:-translate-y-1" aria-label="Twitter">
                <TwitterIcon />
              </a>
            </div>
          </div>

          {/* Collections */}
          <div className="col-span-1 lg:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white mb-8">Colecciones</h4>
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
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white mb-8">Empresa</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link href="/about" className="hover:text-primary transition-colors">Sobre Nosotros</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contacto</Link></li>
              <li><Link href="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
              <li><Link href="/customer-service" className="hover:text-primary transition-colors">Ayuda</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="col-span-2 lg:col-span-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white mb-8">Newsletter</h4>
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
                          className="h-12 rounded bg-slate-100 dark:bg-white/5 border-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
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
        <div className="pt-12 border-t border-slate-200 dark:border-white/5 flex flex-col items-center">
          <PaymentIcons />
          
          <nav className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-xs text-slate-400 dark:text-slate-500 mb-8">
            {legalLinks.map((link, index) => (
              <React.Fragment key={link.href}>
                <Link href={link.href} className="hover:text-primary transition-all active:scale-95">
                  {link.label}
                </Link>
                {index < legalLinks.length - 1 && (
                  <span className="hidden md:inline w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
                )}
              </React.Fragment>
            ))}
          </nav>

          <p className="text-[11px] text-slate-400 dark:text-slate-600 uppercase tracking-widest text-center font-bold">
            &copy; {currentYear} Florarte. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
