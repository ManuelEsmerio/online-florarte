'use client';

import Header from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  CheckCircle2, 
  ArrowUp,
  Download,
  Truck,
  Undo2,
  FileText,
  Scale,
  MessageCircle,
  Cookie,
  Flower2,
  RefreshCw,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import { cn } from '@/lib/utils';

export default function SubstitutionPolicyPage() {
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
    doc.setTextColor(255, 46, 128);
    doc.setFont('helvetica', 'bold');
    doc.text('Políticas de Sustitución de Productos', margin, cursorY);
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
      { title: '1. Consideraciones Generales', content: 'Debido a la naturaleza de los productos florales (perecederos y estacionales), la disponibilidad de flores específicas puede variar sin previo aviso.' },
      { title: '2. Regla de Valor Equivalente', content: 'Sustituiremos flores, follajes o accesorios por otros de igual o mayor valor y calidad, manteniendo siempre la integridad del arreglo.' },
      { title: '3. Respeto al Diseño', content: 'Procuramos siempre conservar el estilo, color y diseño original del arreglo seleccionado por el cliente.' },
      { title: '4. Flores Principales', content: 'Las flores protagonistas (ej. Orquídeas o rosas específicas) no serán sustituidas por especies distintas sin autorización previa del cliente.' },
      { title: '5. Bases y Accesorios', content: 'Bases de cerámica, canastas o cajas podrán sustituirse por modelos de similar estilo y valor si el diseño original está agotado.' },
      { title: '6. Productos Complementarios', content: 'Globos, peluches y chocolates están sujetos a modelos vigentes. Se sustituirán por versiones similares de igual valor.' },
      { title: '7. Temporadas Altas', content: 'En fechas como San Valentín o Día de las Madres, la necesidad de sustituciones puede ser mayor debido a la alta demanda.' },
      { title: '8. Aclaraciones', content: 'Cualquier duda sobre una sustitución realizada puede ser consultada a soporte@floreriaflorarte.com.' }
    ];

    sections.forEach(s => {
      addText(s.title, 13, 'bold', [255, 46, 128]);
      addText(s.content);
      cursorY += 5;
    });

    doc.save('politica-sustitucion-florarte.pdf');
    toast({ title: 'Descarga iniciada', description: 'El documento oficial se está descargando.' });
  };

  const legalLinks = [
    { href: '/shipping-policy', label: 'Envío', icon: Truck, active: false },
    { href: '/cancellation-policy', label: 'Reembolsos', icon: Undo2, active: false },
    { href: '/terms-and-conditions', label: 'Términos', icon: FileText, active: false },
    { href: '/privacy-policy', label: 'Privacidad', icon: Scale, active: false },
    { href: '/cookies-policy', label: 'Cookies', icon: Cookie, active: false },
    { href: '/substitution-policy', label: 'Sustitución', icon: RefreshCw, active: true },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFCFD] dark:bg-[#0F0F0F] text-slate-800 dark:text-slate-300 font-sans transition-colors duration-300">
      <Header />
      
      <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-16 w-full">
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

        {/* Header Section */}
        <header className="mb-10 md:mb-12 text-center md:text-left px-2 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="space-y-4">
            <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight text-balance">
              Política de <br className="hidden md:block"/><span className="italic text-primary">Sustitución</span>
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary/60" />
                Actualización: 19 de febrero de 2026
              </span>
            </div>
          </div>
          <Button onClick={handleDownloadPDF} variant="outline" className="rounded-full h-12 px-6 border-2 font-bold gap-2 shrink-0 bg-white dark:bg-zinc-900 transition-all hover:bg-primary hover:text-white hover:border-primary">
            <Download className="w-4 h-4" />
            Descargar PDF
          </Button>
        </header>

        {/* Main Content Card */}
        <section className="bg-white dark:bg-[#1A1A1A] rounded-[2rem] md:rounded-[2.5rem] p-6 sm:p-8 md:p-16 shadow-2xl shadow-black/5 dark:shadow-none border border-slate-100 dark:border-white/5">
          
          <div className="space-y-16">
            {/* 1. Consideraciones */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">1</span>
                <h2 className="text-2xl md:text-3xl font-headline font-bold text-slate-900 dark:text-white">Consideraciones Generales</h2>
              </div>
              <p className="text-base md:text-lg leading-relaxed text-slate-600 dark:text-slate-400 font-medium sm:pl-14">
                En Florería Florarte, trabajamos con productos naturales y vivos que están sujetos a la disponibilidad del mercado y a la estacionalidad. Por ello, en ocasiones es necesario realizar sustituciones para garantizar la frescura y la calidad de tu regalo.
              </p>
            </div>

            {/* 2. Reglas de Sustitución */}
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <span className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">2</span>
                <h2 className="text-2xl md:text-3xl font-headline font-bold text-slate-900 dark:text-white">Reglas de Calidad</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:pl-14">
                <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 group hover:border-primary/30 transition-all">
                  <CheckCircle2 className="w-6 h-6 text-primary mb-3" />
                  <h4 className="font-bold text-sm uppercase tracking-widest text-slate-900 dark:text-white mb-2">Valor Equivalente</h4>
                  <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    Si una flor o accesorio no está disponible, se sustituirá por uno de igual o mayor valor comercial.
                  </p>
                </div>
                <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 group hover:border-primary/30 transition-all">
                  <Flower2 className="w-6 h-6 text-primary mb-3" />
                  <h4 className="font-bold text-sm uppercase tracking-widest text-slate-900 dark:text-white mb-2">Estilo Original</h4>
                  <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    Respetamos siempre el color predominante y la forma del diseño para que la esencia del regalo no cambie.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Complementos */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">3</span>
                <h2 className="text-2xl md:text-3xl font-headline font-bold text-slate-900 dark:text-white">Bases y Complementos</h2>
              </div>
              <div className="bg-muted/30 p-8 rounded-3xl sm:pl-14">
                <p className="text-base text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                  Las bases de cerámica, cajas, globos y peluches están sujetos a modelos vigentes en nuestro inventario. En caso de agotarse un modelo específico, se enviará uno del mismo valor y con la misma temática (ej. Amor, Cumpleaños).
                </p>
              </div>
            </div>

            {/* Premium Support CTA */}
            <div className="mt-20 p-8 md:p-16 bg-slate-950 rounded-[2.5rem] md:rounded-[3.5rem] text-center relative overflow-hidden shadow-2xl">
              <div className="relative z-10 space-y-6">
                <h3 className="font-headline text-3xl md:text-5xl text-white font-bold px-4">¿Necesitas una flor específica?</h3>
                <p className="text-slate-400 max-w-2xl mx-auto text-base md:text-xl font-medium leading-relaxed px-4">
                  Si buscas algo muy particular, contáctanos antes de realizar tu pedido para confirmar existencias.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4 px-4">
                  <Button asChild size="lg" className="w-full sm:w-auto h-14 md:h-16 px-10 rounded-full font-bold text-base md:text-lg bg-primary hover:bg-primary/90 premium-glow-strong gap-3 border-none">
                    <Link href="/contact">
                      <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      Preguntar por Existencias
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
          </div>
        </section>
      </main>

      {/* Floating Scroll Top */}
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
