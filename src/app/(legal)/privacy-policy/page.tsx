'use client';

import Header from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowUp,
  Download,
  Truck,
  Undo2,
  Scale,
  FileText,
  MessageCircle,
  Cookie,
  Mail,
  User,
  Globe,
  Lock,
  Star,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import { cn } from '@/lib/utils';

export default function PrivacyPolicyPage() {
  const { toast } = useToast();
  
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownloadPDF = () => {
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
    doc.setTextColor(255, 46, 128); // Rosa Florarte
    doc.setFont('helvetica', 'bold');
    doc.text('Aviso de Privacidad Integral', margin, cursorY);
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
      { title: '1. Identidad y Domicilio', content: 'Irene García Hernández, operando como "Florería Florarte", con domicilio en Tequila, Jalisco, México, es responsable del tratamiento de sus datos personales bajo la LFPDPPP.' },
      { title: '2. Datos Personales', content: 'Recabamos datos de Identificación, Contacto, Fiscales, Transaccionales y de Navegación necesarios para el servicio.' },
      { title: '3. Finalidades', content: '3.1 Primarias: Procesar pedidos, entregas y atención al cliente. 3.2 Secundarias: Envío de promociones y encuestas.' },
      { title: '4. Cookies', content: 'Utilizamos cookies para optimizar la navegación y seguridad. Puede gestionarlas desde su navegador.' },
      { title: '5. Transferencias', content: 'Compartimos datos con pasarelas de pago y logística solo para cumplir con el servicio.' },
      { title: '6. Derechos ARCO', content: 'Usted puede ejercer Acceso, Rectificación, Cancelación u Oposición vía correo soporte@floreriaflorarte.com.' }
    ];

    sections.forEach(s => {
      addText(s.title, 13, 'bold', [255, 46, 128]);
      addText(s.content);
      cursorY += 5;
    });

    doc.save('aviso-privacidad-florarte.pdf');
    toast({ title: 'Descarga iniciada', description: 'El documento oficial se está descargando.' });
  };

  const legalLinks = [
    { href: '/shipping-policy', label: 'Envío', icon: Truck, active: false },
    { href: '/cancellation-policy', label: 'Reembolsos', icon: Undo2, active: false },
    { href: '/terms-and-conditions', label: 'Términos', icon: FileText, active: false },
    { href: '/privacy-policy', label: 'Privacidad', icon: Scale, active: true },
    { href: '/cookies-policy', label: 'Cookies', icon: Cookie, active: false },
    { href: '/substitution-policy', label: 'Sustitución', icon: RefreshCw, active: false },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB] dark:bg-[#0F0F0F] text-slate-800 dark:text-slate-300 font-sans transition-colors duration-300">
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
            <header className="mb-12 border-b border-slate-50 dark:border-white/5 pb-10 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <span className="text-primary font-bold tracking-[0.3em] text-[10px] uppercase mb-4 block">Protección de Datos</span>
                <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold text-slate-900 dark:text-white leading-tight mb-4 text-balance">
                  Aviso de Privacidad <br className="hidden md:block"/><span className="italic text-primary">Integral</span>
                </h1>
                <div className="flex items-center justify-center md:justify-start gap-4 text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-4">
                  <Calendar className="w-4 h-4 text-primary/60" />
                  <span>Actualización: 19 de febrero de 2026</span>
                </div>
              </div>
              <Button onClick={handleDownloadPDF} variant="outline" className="rounded-full h-12 px-6 border-2 font-bold gap-2 bg-white dark:bg-zinc-900 transition-all hover:bg-primary hover:text-white hover:border-primary">
                <Download className="w-4 h-4" />
                Descargar PDF
              </Button>
            </header>

            <section className="space-y-16">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <span className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">1</span>
                  <h2 className="text-2xl md:text-3xl font-headline font-bold text-slate-900 dark:text-white">Identidad del Responsable</h2>
                </div>
                <div className="p-6 md:p-8 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 space-y-4 sm:pl-14">
                  <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                    Irene García Hernández, operando como <span className="text-primary font-bold">"Florería Florarte"</span>, con domicilio en Tequila, Jalisco, México, es responsable del tratamiento de sus datos personales.
                  </p>
                </div>
              </div>

              {/* Finalidades */}
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <span className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">3</span>
                  <h2 className="text-2xl md:text-3xl font-headline font-bold text-slate-900 dark:text-white">Finalidades del Tratamiento</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:pl-14">
                  <div className="p-8 bg-emerald-50/30 dark:bg-emerald-500/5 rounded-[2rem] border border-emerald-100 dark:border-emerald-500/20">
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 mb-6 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4"/> Primarias
                    </h3>
                    <ul className="space-y-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                      <li>• Procesamiento de pedidos y entregas.</li>
                      <li>• Atención al cliente y facturación.</li>
                    </ul>
                  </div>
                  <div className="p-8 bg-blue-50/30 dark:bg-blue-500/5 rounded-[2rem] border border-blue-100 dark:border-blue-500/20">
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-6 flex items-center gap-2">
                      <Star className="w-4 h-4"/> Secundarias
                    </h3>
                    <ul className="space-y-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                      <li>• Envío de promociones y ofertas.</li>
                      <li>• Encuestas de satisfacción.</li>
                    </ul>
                  </div>
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
                <Button asChild size="lg" className="w-full sm:w-auto h-14 md:h-16 px-10 rounded-full font-bold text-base md:text-lg bg-primary hover:bg-primary/90 premium-glow-strong gap-3 border-none">
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
        className="fixed bottom-24 right-6 w-12 h-12 md:w-14 md:h-14 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl flex items-center justify-center hover:bg-primary dark:hover:bg-primary dark:hover:text-white transition-all group z-40 active:scale-90"
      >
        <ArrowUp className="w-5 h-5 md:w-6 md:h-6 group-hover:-translate-y-1 transition-transform" />
      </button>

      <Footer />
    </div>
  );
}
