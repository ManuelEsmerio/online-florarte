'use client';

import Header from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { 
  Truck, 
  Clock, 
  Map, 
  Undo2,
  FileText,
  Scale,
  MessageCircle,
  ArrowUp,
  Download,
  Cookie,
  Zap,
  Phone,
  AlertCircle,
  Calendar,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';

export default function ShippingPolicyPage() {
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

    doc.setFontSize(22);
    doc.setTextColor(255, 46, 128);
    doc.setFont('helvetica', 'bold');
    doc.text('Políticas de Envío y Entrega', margin, cursorY);
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

    const policies = [
      { title: '1. Cobertura de Entrega', content: 'Florería Florarte ofrece servicio en Tequila, Jalisco, y municipios de la Región Valles. Envíos externos requieren consulta previa.' },
      { title: '2. Horarios de Entrega', content: 'Realizados en bloques seleccionables. Sujetos a tráfico, clima y demanda. Se consideran estimados, no garantizados.' },
      { title: '3. Costos de Envío', content: 'Calculados por dirección y zona. Pueden aplicar cargos extras en zonas de difícil acceso o entregas urgentes.' },
      { title: '4. Proceso de Entrega', content: 'Es responsabilidad del cliente dar datos correctos. En ausencia del destinatario, se intentará contactar o el pedido retornará para reprogramación con costo extra.' },
      { title: '5. Sustitución de Productos', content: 'Se usarán flores de igual o mayor valor si no hay stock, manteniendo el diseño original.' },
      { title: '6. Responsabilidad y Fuerza Mayor', content: 'No hay responsabilidad por retrasos derivados de accidentes, clima extremo o fallas de terceros.' },
      { title: '7. Temporadas de Alta Demanda', content: 'En San Valentín o Día de las Madres los tiempos pueden ampliarse. Recomendamos pedir con anticipación.' },
      { title: '8. Confirmación de Entrega', content: 'Se considera realizada al recibirla el destinatario o autorizado en el domicilio.' },
      { title: '9. Soporte', content: 'Contacto: soporte@floreriaflorarte.com' }
    ];

    policies.forEach(p => {
      addText(p.title, 13, 'bold', [255, 46, 128]);
      addText(p.content);
      cursorY += 5;
    });

    doc.save('politica-envio-florarte.pdf');
    toast({ title: 'Descarga iniciada', description: 'El documento oficial se está descargando.' });
  };

  const legalLinks = [
    { href: '/shipping-policy', label: 'Envío', icon: Truck, active: true },
    { href: '/cancellation-policy', label: 'Reembolsos', icon: Undo2, active: false },
    { href: '/terms-and-conditions', label: 'Términos', icon: FileText, active: false },
    { href: '/privacy-policy', label: 'Privacidad', icon: Scale, active: false },
    { href: '/cookies-policy', label: 'Cookies', icon: Cookie, active: false },
    { href: '/substitution-policy', label: 'Sustitución', icon: RefreshCw, active: false },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB] dark:bg-[#0F0F0F] text-slate-800 dark:text-slate-300 font-sans transition-colors duration-300">
      <Header />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-16 flex-grow w-full">
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

        <article className="space-y-12 md:space-y-16 animate-fade-in w-full px-2">
          <header className="border-b border-slate-200 dark:border-white/5 pb-10 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-8">
            <div>
              <h1 className="font-headline text-4xl sm:text-5xl md:text-7xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight text-balance">
                Políticas de <span className="italic text-primary">Envío</span>
              </h1>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-4">Actualización: 19 de febrero de 2026</p>
            </div>
            <Button onClick={handleDownloadPDF} variant="outline" className="rounded-full h-12 px-6 border-2 font-bold gap-2 bg-white dark:bg-zinc-900 transition-all hover:bg-primary hover:text-white hover:border-primary">
              <Download className="w-4 h-4" />
              Descargar PDF
            </Button>
          </header>

          <div className="space-y-16">
            <section className="group relative pl-0 md:pl-20 animate-fade-in-up">
              <div className="hidden md:flex absolute left-0 top-0 w-14 h-14 rounded-2xl bg-primary/10 items-center justify-center text-primary shadow-lg shadow-primary/5 transition-all group-hover:bg-primary group-hover:text-white">
                <Map className="w-7 h-7" />
              </div>
              <h2 className="font-headline text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-4">1. Cobertura de Entrega</h2>
              <p className="text-base md:text-lg leading-relaxed text-slate-600 dark:text-slate-400 font-medium">
                Servicio en Tequila, Jalisco y municipios de la Región Valles. Para envíos externos, consultar disponibilidad y costos adicionales previamente.
              </p>
            </section>

            <section className="group relative pl-0 md:pl-20 animate-fade-in-up">
              <div className="hidden md:flex absolute left-0 top-0 w-14 h-14 rounded-2xl bg-primary/10 items-center justify-center text-primary shadow-lg shadow-primary/5 transition-all group-hover:bg-primary group-hover:text-white">
                <Clock className="w-7 h-7" />
              </div>
              <h2 className="font-headline text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-4">2. Horarios de Entrega</h2>
              <div className="space-y-4">
                <p className="text-base md:text-lg leading-relaxed text-slate-600 dark:text-slate-400 font-medium">
                  Los horarios se realizan en bloques estimados. Factores como tráfico, clima o alta demanda pueden afectar los tiempos.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/30 rounded-2xl border border-border/50 text-sm font-bold flex items-center gap-3">
                    <Zap className="w-4 h-4 text-primary" />
                    Entrega Hoy (L-S antes 2:30 PM)
                  </div>
                  <div className="p-4 bg-muted/30 rounded-2xl border border-border/50 text-sm font-bold flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-primary" />
                    Entregas Domingo (9:00 AM - 2:30 PM)
                  </div>
                </div>
              </div>
            </section>

            {/* Premium Support CTA */}
            <div className="mt-16 md:mt-20 p-8 md:p-16 bg-slate-950 rounded-[2.5rem] md:rounded-[3.5rem] text-center relative overflow-hidden shadow-2xl">
              <h3 className="font-headline text-3xl md:text-5xl text-white mb-4 md:mb-6 relative z-10 font-bold px-4">¿Aún tienes dudas?</h3>
              <p className="text-slate-400 max-w-2xl mx-auto mb-8 md:mb-10 relative z-10 text-base md:text-xl font-medium leading-relaxed px-4">
                Nuestro equipo de atención al cliente está listo para ayudarte con cualquier consulta sobre tu envío.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10 px-4 items-center">
                <Button asChild size="lg" className="w-full sm:w-auto h-14 md:h-16 px-10 rounded-full font-bold text-base md:text-lg bg-primary hover:bg-primary/90 premium-glow-strong gap-3 border-none">
                  <Link href="/contact">
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
