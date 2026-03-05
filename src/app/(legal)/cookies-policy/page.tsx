'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Cookie, 
  Settings,
  ArrowUp,
  Download,
  MessageCircle,
  Truck,
  Undo2,
  FileText,
  Scale,
  ShieldCheck,
  Globe,
  LineChart,
  Megaphone,
  RefreshCw,
  X
} from 'lucide-react';
import Link from 'next/link';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function CookiesPolicyPage() {
  const { toast } = useToast();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [cookiePrefs, setCookiePrefs] = useState({
    necessary: true,
    functional: true,
    analytics: false,
    advertising: false
  });

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownloadPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();
    const margin = 20;
    const pageWidth = 210;
    const contentWidth = pageWidth - (margin * 2);
    let cursorY = 20;

    const addText = (text: string, size = 11, style = 'normal', color = [0, 0, 0]) => {
      doc.setFontSize(size);
      doc.setFont('helvetica', style);
      doc.setTextColor(color[0], color[1], color[2]);
      const lines = doc.splitTextToSize(text, contentWidth);
      
      if (cursorY + (lines.length * (size * 0.5)) > 280) {
        doc.addPage();
        cursorY = 20;
      }
      
      doc.text(lines, margin, cursorY);
      cursorY += (lines.length * (size * 0.5)) + 5;
    };

    // Header
    doc.setFontSize(22);
    doc.setTextColor(238, 43, 108); // Pink #ee2b6c
    doc.setFont('helvetica', 'bold');
    doc.text('AVISO DE USO DE COOKIES', margin, cursorY);
    cursorY += 10;

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Florería Florarte', margin, cursorY);
    cursorY += 8;

    doc.setFontSize(10);
    doc.text('Última actualización: 19 de febrero de 2026', margin, cursorY);
    doc.setLineWidth(0.5);
    cursorY += 5;
    doc.line(margin, cursorY, pageWidth - margin, cursorY);
    cursorY += 10;

    const sections = [
      { title: '1. ¿Qué son las Cookies?', content: 'Las cookies son pequeños archivos de texto que se almacenan en su dispositivo al visitar un sitio web. Estas permiten reconocer su navegador, recordar información y mejorar su experiencia de navegación.' },
      { title: '2. Tipos de Cookies que Utilizamos', content: 'a) Necesarias: Funcionamiento básico (login, carrito, seguridad). b) Preferencias: Idioma, ubicación y configuraciones. c) Analíticas: Tráfico y comportamiento para mejora. d) Marketing: Anuncios relevantes y remarketing.' },
      { title: '3. Finalidad del Uso de Cookies', content: 'Optimizar navegación, facilitar procesos de compra, garantizar seguridad, analizar desempeño, mejorar contenidos y ofrecer promociones.' },
      { title: '4. Cookies de Terceros', content: 'Podemos utilizar cookies de plataformas de pago, herramientas analíticas y redes sociales que se rigen por sus propias políticas.' },
      { title: '5. Consentimiento del Usuario', content: 'El usuario puede aceptar todas, rechazar no esenciales o configurar preferencias. El uso continuo implica aceptación.' },
      { title: '6. Gestión y Desactivación', content: 'El usuario puede configurar su navegador para bloquear o eliminar cookies. Consulte la documentación oficial de su navegador.' },
      { title: '7. Relación con el Aviso de Privacidad', content: 'El tratamiento de datos personales obtenidos mediante cookies se realiza conforme a nuestro Aviso de Privacidad, disponible en el sitio web.' },
      { title: '8. Cambios al Aviso', content: 'Florería Florarte se reserva el derecho de modificar el presente aviso en cualquier momento.' },
      { title: '9. Contacto', content: '📧 soporte@floreriaflorarte.com | 📞 +52 33 1109 1333' }
    ];

    sections.forEach(s => {
      addText(s.title, 13, 'bold', [238, 43, 108]);
      addText(s.content);
      cursorY += 5;
    });

      doc.save('aviso-uso-cookies-florarte.pdf');
      toast({ title: 'Descarga iniciada', description: 'El documento oficial se está descargando.' });
    } catch (error) {
      console.error('[cookies-policy] Error generando PDF', error);
      toast({ title: 'No pudimos generar el PDF', description: 'Intenta de nuevo en unos segundos.', variant: 'destructive' });
    }
  };

  const handleSaveSettings = () => {
    localStorage.setItem('cookie_preferences', JSON.stringify(cookiePrefs));
    localStorage.setItem('cookie_consent', 'accepted');
    setIsSettingsOpen(false);
    toast({ title: 'Preferencias guardadas', description: 'Tus ajustes de privacidad han sido actualizados.', variant: 'success' });
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      functional: true,
      analytics: true,
      advertising: true
    };
    setCookiePrefs(allAccepted);
    localStorage.setItem('cookie_preferences', JSON.stringify(allAccepted));
    localStorage.setItem('cookie_consent', 'accepted');
    setIsSettingsOpen(false);
    toast({ title: '¡Gracias!', description: 'Has aceptado todas las cookies para una mejor experiencia.', variant: 'success' });
  };

  const legalLinks = [
    { href: '/shipping-policy', label: 'Envío', icon: Truck, active: false },
    { href: '/cancellation-policy', label: 'Reembolsos', icon: Undo2, active: false },
    { href: '/terms-and-conditions', label: 'Términos', icon: FileText, active: false },
    { href: '/privacy-policy', label: 'Privacidad', icon: Scale, active: false },
    { href: '/cookies-policy', label: 'Cookies', icon: Cookie, active: true },
    { href: '/substitution-policy', label: 'Sustitución', icon: RefreshCw, active: false },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFCFD] dark:bg-[#0F0F0F] text-slate-800 dark:text-slate-300 font-sans transition-colors duration-300">
      <Header />
      
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-16 w-full">
        {/* Pill Navigation - Sticky */}
        <div className="flex justify-center mb-12 sticky top-24 z-40 px-2">
          <nav className="inline-flex items-center bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-xl p-1.5 rounded-full border border-slate-200 dark:border-white/10 shadow-xl shadow-black/5 overflow-x-auto no-scrollbar max-w-full">
            {legalLinks.map((link) => (
              <Link 
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-300 font-bold text-xs md:text-sm whitespace-nowrap",
                  link.active 
                    ? "bg-primary text-white shadow-lg shadow-primary/20" 
                    : "text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-white"
                )}
              >
                <link.icon className={cn("w-4 h-4", link.active ? "text-white" : "text-slate-400")} />
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <article className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-[#1A1A1A] rounded-[2rem] md:rounded-[2.5rem] p-6 sm:p-8 md:p-16 shadow-2xl shadow-black/5 dark:shadow-none border border-slate-100 dark:border-white/5 animate-fade-in">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 border-b border-slate-50 dark:border-white/5 pb-10 text-center md:text-left">
              <div>
                <span className="text-primary font-bold tracking-[0.3em] text-[10px] uppercase mb-4 block">Gestión de Privacidad</span>
                <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold text-slate-900 dark:text-white leading-tight text-balance">
                  Aviso de Uso de <br className="hidden md:block"/><span className="italic text-primary">Cookies</span>
                </h1>
                <div className="flex items-center justify-center md:justify-start gap-4 text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-6">
                  <Calendar className="w-4 h-4 text-primary/60" />
                  <span>Actualización: 19 de febrero de 2026</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <Button onClick={handleDownloadPDF} variant="outline" className="h-12 px-6 rounded-full font-bold gap-2 bg-white dark:bg-zinc-900 border-2 transition-all hover:bg-primary hover:text-white hover:border-primary">
                  <Download className="w-4 h-4" />
                  Descargar PDF
                </Button>
                <Button onClick={() => setIsSettingsOpen(true)} className="h-12 px-8 rounded-full font-bold shadow-xl shadow-primary/20 gap-3 group">
                  <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                  Configurar
                </Button>
              </div>
            </header>

            <section className="space-y-16">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <span className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">1</span>
                  <h2 className="text-2xl md:text-3xl font-headline font-bold text-slate-900 dark:text-white">¿Qué son las Cookies?</h2>
                </div>
                <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed sm:pl-14">
                  Las cookies son pequeños archivos de texto que se almacenan en su dispositivo al visitar un sitio web. Estas permiten reconocer su navegador, recordar información y mejorar su experiencia de navegación.
                </p>
              </div>

              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <span className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">2</span>
                  <h2 className="text-2xl md:text-3xl font-headline font-bold text-slate-900 dark:text-white">Tipos de Cookies que Utilizamos</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:pl-14">
                  {[
                    { label: 'Necesarias', icon: ShieldCheck, text: 'Inicio de sesión, carrito y seguridad.' },
                    { label: 'Preferencias', icon: Globe, text: 'Idioma, ubicación y ajustes personales.' },
                    { label: 'Analíticas', icon: LineChart, text: 'Tráfico y comportamiento de usuarios.' },
                    { label: 'Marketing', icon: Megaphone, text: 'Anuncios relevantes y campañas.' },
                  ].map((item) => (
                    <div key={item.label} className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 group hover:border-primary/30 transition-all">
                      <item.icon className="w-6 h-6 text-primary mb-3" />
                      <h4 className="font-bold text-sm uppercase tracking-widest text-slate-900 dark:text-white mb-1">{item.label}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Premium Support CTA */}
            <div className="mt-20 p-8 md:p-16 bg-slate-950 rounded-[2.5rem] md:rounded-[3.5rem] text-center relative overflow-hidden shadow-2xl">
              <h3 className="font-headline text-3xl md:text-5xl text-white mb-4 md:mb-6 relative z-10 font-bold px-4">¿Aún tienes dudas?</h3>
              <p className="text-slate-400 max-w-2xl mx-auto mb-8 md:mb-10 relative z-10 text-base md:text-xl font-medium leading-relaxed px-4">
                Nuestro equipo de atención al cliente está listo para ayudarte con cualquier consulta sobre tu privacidad.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10 px-4 items-center">
                <Button asChild size="lg" className="w-full sm:w-auto h-14 md:h-16 px-10 rounded-full font-bold text-base md:text-lg bg-primary hover:bg-primary/90 shadow-[0_0_30px_rgba(255,45,120,0.3)] gap-3 group border-none">
                  <Link href="/contact" className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    Hablar con Soporte
                  </Link>
                </Button>
                <Button 
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto h-14 md:h-16 px-10 rounded-full font-bold text-base md:text-lg border-2 border-white/20 text-white hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 bg-transparent"
                  asChild
                >
                  <Link href="/customer-service">
                    Ver Ayuda General
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </article>
      </main>

      <button 
        onClick={scrollToTop}
        aria-label="Volver al inicio"
        className="fixed bottom-24 right-6 w-12 h-12 md:w-14 md:h-14 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl flex items-center justify-center hover:bg-primary dark:hover:bg-primary dark:hover:text-white transition-all group z-40 active:scale-90"
      >
        <ArrowUp className="w-5 h-5 md:w-6 md:h-6 group-hover:-translate-y-1 transition-transform" />
      </button>

      <Footer />

      {/* Nuevo Rediseño de la Modal de Cookies - Ahora respeta el tema y evita cierre al hacer click fuera */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent 
          className="max-w-2xl p-0 overflow-hidden bg-background border shadow-2xl rounded-2xl sm:rounded-2xl"
          hideCloseButton={true}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-muted/20">
            <DialogTitle className="text-2xl md:text-3xl font-headline text-foreground tracking-tight">Preferencias de Privacidad</DialogTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSettingsOpen(false)}
              className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground h-10 w-10"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 max-h-[65vh] space-y-6 custom-scrollbar custom-scrollbar--contrast">
            {/* Intro Text */}
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                En <span className="text-primary font-semibold">Florarte</span>, utilizamos cookies para mejorar tu experiencia al elegir las flores perfectas. Gestiona tus preferencias de privacidad a continuación para personalizar cómo interactuamos contigo.
              </p>
            </div>

            {/* Cookie Categories Accordion */}
            <Accordion type="single" collapsible defaultValue="necessary" className="space-y-4">
              {/* Necesarias */}
              <AccordionItem value="necessary" className="bg-muted/30 border rounded-xl overflow-hidden px-4">
                <div className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-primary/60" />
                    <span className="font-semibold text-foreground">Necesarias</span>
                    <span className="text-[10px] uppercase tracking-wider bg-muted px-2 py-0.5 rounded-full text-muted-foreground">Siempre Activas</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Switch checked={true} disabled className="opacity-50 cursor-not-allowed data-[state=checked]:bg-primary" />
                    <AccordionTrigger className="p-0 hover:no-underline text-muted-foreground" />
                  </div>
                </div>
                <AccordionContent className="pb-4 pt-0 text-muted-foreground text-sm leading-relaxed border-t mt-0">
                  <p className="pt-3">
                    Estas cookies son fundamentales para que el sitio web funcione correctamente, permitiendo funciones básicas como la navegación de páginas, la seguridad del carrito de compra y el acceso a áreas protegidas. Sin ellas, el sitio no puede funcionar.
                  </p>
                </AccordionContent>
              </AccordionItem>

              {/* Preferencias */}
              <AccordionItem value="preferences" className="bg-muted/30 border rounded-xl overflow-hidden px-4">
                <div className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <Settings className="h-5 w-5 text-primary/60" />
                    <span className="font-semibold text-foreground">Preferencias</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Switch 
                      checked={cookiePrefs.functional} 
                      onCheckedChange={(val) => setCookiePrefs({...cookiePrefs, functional: val})} 
                      className="data-[state=checked]:bg-primary"
                    />
                    <AccordionTrigger className="p-0 hover:no-underline text-muted-foreground" />
                  </div>
                </div>
                <AccordionContent className="pb-4 pt-0 text-muted-foreground text-sm leading-relaxed border-t mt-0">
                  <p className="pt-3">
                    Permiten que el sitio web recuerde información que cambia la forma en que el sitio se comporta o se ve, como tu idioma preferido o la región en la que te encuentras.
                  </p>
                </AccordionContent>
              </AccordionItem>

              {/* Estadísticas */}
              <AccordionItem value="analytics" className="bg-muted/20 border rounded-xl overflow-hidden px-4">
                <div className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <LineChart className="h-5 w-5 text-primary/60" />
                    <span className="font-semibold text-foreground">Estadísticas</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Switch 
                      checked={cookiePrefs.analytics} 
                      onCheckedChange={(val) => setCookiePrefs({...cookiePrefs, analytics: val})} 
                      className="data-[state=checked]:bg-primary"
                    />
                    <AccordionTrigger className="p-0 hover:no-underline text-muted-foreground" />
                  </div>
                </div>
                <AccordionContent className="pb-4 pt-0 text-muted-foreground text-sm leading-relaxed border-t mt-0">
                  <p className="pt-3">
                    Nos ayudan a comprender cómo los visitantes interactúan con nuestra web reuniendo y proporcionando información de forma anónima, permitiéndonos optimizar la navegación de nuestra boutique online.
                  </p>
                </AccordionContent>
              </AccordionItem>

              {/* Marketing */}
              <AccordionItem value="marketing" className="bg-muted/20 border rounded-xl overflow-hidden px-4">
                <div className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <Megaphone className="h-5 w-5 text-primary/60" />
                    <span className="font-semibold text-foreground">Marketing</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Switch 
                      checked={cookiePrefs.advertising} 
                      onCheckedChange={(val) => setCookiePrefs({...cookiePrefs, advertising: val})} 
                      className="data-[state=checked]:bg-primary"
                    />
                    <AccordionTrigger className="p-0 hover:no-underline text-muted-foreground" />
                  </div>
                </div>
                <AccordionContent className="pb-4 pt-0 text-muted-foreground text-sm leading-relaxed border-t mt-0">
                  <p className="pt-3">
                    Se utilizan para rastrear a los visitantes a través de las webs. La intención es mostrar anuncios que sean relevantes y atractivos para el usuario individual, y por lo tanto, más valiosos para los editores y terceros anunciantes.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Footer Link */}
            <div className="pt-2 text-center">
              <Link href="/privacy-policy" className="text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-4">
                Leer nuestra Política de Privacidad completa
              </Link>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t bg-muted/20 flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              onClick={handleSaveSettings}
              className="flex-1 h-12 rounded-full border-primary text-primary font-bold hover:bg-primary/10 transition-all text-sm uppercase tracking-wide bg-transparent"
            >
              Guardar Preferencias
            </Button>
            <Button 
              onClick={handleAcceptAll}
              className="flex-1 h-12 rounded-full bg-primary text-white font-bold hover:bg-opacity-90 transition-all text-sm uppercase tracking-wide shadow-lg shadow-primary/20 border-none"
            >
              Aceptar Todas
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
