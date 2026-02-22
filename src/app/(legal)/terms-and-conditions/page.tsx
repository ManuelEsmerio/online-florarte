'use client';

import Header from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  ArrowUp,
  Download,
  Truck,
  Undo2,
  FileText,
  Scale,
  MessageCircle,
  Cookie,
  Globe,
  Gavel,
  History,
  Lock,
  Package,
  CreditCard,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import { cn } from '@/lib/utils';

export default function TermsAndConditionsPage() {
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

    const addText = (text: string, size = 10, style = 'normal', color = [0, 0, 0]) => {
      doc.setFontSize(size);
      doc.setFont('helvetica', style);
      doc.setTextColor(color[0], color[1], color[2]);
      const lines = doc.splitTextToSize(text, contentWidth);
      
      if (cursorY + (lines.length * (size * 0.5)) > 280) {
        doc.addPage();
        cursorY = 20;
      }
      
      doc.text(lines, margin, cursorY);
      cursorY += (lines.length * (size * 0.5)) + 4;
    };

    // Header
    doc.setFontSize(20);
    doc.setTextColor(255, 46, 128); // Rosa Florarte
    doc.setFont('helvetica', 'bold');
    doc.text('TÉRMINOS Y CONDICIONES DE USO', margin, cursorY);
    cursorY += 10;

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Florería Florarte', margin, cursorY);
    cursorY += 8;

    doc.setFontSize(9);
    doc.text('Última actualización: 19 de febrero de 2026', margin, cursorY);
    doc.setLineWidth(0.5);
    cursorY += 5;
    doc.line(margin, cursorY, pageWidth - margin, cursorY);
    cursorY += 10;

    const fullContent = [
      { t: '1. Aceptación de los Términos', c: 'Al acceder y realizar compras en www.floreriaflorarte.com, el usuario acepta plena y expresamente los presentes Términos. Si no está de acuerdo, deberá abstenerse de utilizar el sitio.' },
      { t: '2. Identidad del Responsable', c: 'Irene García Hernández. Nombre comercial: Florería Florarte. Tequila, Jalisco, México. Correo: soporte@floreriaflorarte.com.' },
      { t: '3. Uso del Sitio Web', c: 'Prohibido: proporcionar información falsa, usar el sitio para fraudes, alterar sistemas o reproducir contenidos sin autorización.' },
      { t: '4. Registro y Cuenta', c: 'El usuario es responsable de la confidencialidad de sus credenciales y de las operaciones realizadas desde su perfil.' },
      { t: '5. Productos y Disponibilidad', c: 'Sujetos a disponibilidad. Por su naturaleza floral, la apariencia y colores pueden variar levemente según estacionalidad.' },
      { t: '6. Sustitución de Productos', c: 'En falta de stock, se podrán sustituir flores o accesorios por otros de igual o mayor valor, manteniendo el diseño original.' },
      { t: '7. Precios y Pagos', c: 'Precios en MXN incluyen IVA. No almacenamos datos completos de tarjetas bancarias.' },
      { t: '8. Confirmación de Pedidos', c: 'Un pedido se confirma tras acreditar el pago y emitir estatus "Confirmado".' },
      { t: '9. Envíos y Entregas', c: 'Regidos por las Políticas de Envío vigentes. Los horarios son estimados y no garantizados.' },
      { t: '10. Cancelaciones y Reembolsos', c: 'Regidos por sus propias políticas. No procede tras inicio de elaboración.' },
      { t: '11. Facturación', c: 'El usuario puede solicitar factura con datos fiscales correctos.' },
      { t: '12. Propiedad Intelectual', c: 'Logotipos, imágenes y diseños son propiedad exclusiva de Florería Florarte.' },
      { t: '13. Protección de Datos', c: 'Conforme al Aviso de Privacidad disponible en el sitio.' },
      { t: '14. Limitación de Responsabilidad', c: 'Limitada al monto efectivamente pagado por el cliente.' },
      { t: '15. Fuerza Mayor', c: 'No hay responsabilidad por desastres naturales, fallas eléctricas o cierres viales.' },
      { t: '16. Enlaces a Terceros', c: 'No nos hacemos responsables de contenidos en sitios externos enlazados.' },
      { t: '17. Modificaciones', c: 'Entran en vigor al publicarse en el sitio web.' },
      { t: '18. Legislación y Jurisdicción', c: 'Leyes mexicanas. Tribunales competentes en el estado de Jalisco.' },
      { t: '19. Contacto', c: 'Email: soporte@floreriaflorarte.com' }
    ];

    fullContent.forEach(item => {
      addText(item.t, 11, 'bold', [255, 46, 128]);
      addText(item.c, 10, 'normal');
      cursorY += 4;
    });

    doc.save('terminos-condiciones-florarte.pdf');
    toast({ title: 'Descarga iniciada', description: 'El documento PDF oficial se está descargando.' });
  };

  const legalLinks = [
    { href: '/shipping-policy', label: 'Envío', icon: Truck, active: false },
    { href: '/cancellation-policy', label: 'Reembolsos', icon: Undo2, active: false },
    { href: '/terms-and-conditions', label: 'Términos', icon: FileText, active: true },
    { href: '/privacy-policy', label: 'Privacidad', icon: Scale, active: false },
    { href: '/cookies-policy', label: 'Cookies', icon: Cookie, active: false },
    { href: '/substitution-policy', label: 'Sustitución', icon: RefreshCw, active: false },
  ];

  const sections = [
    { id: 'aceptacion', title: 'Aceptación y Alcance', num: '01', icon: Gavel },
    { id: 'productos', title: 'Productos y Calidad', num: '05', icon: Package },
    { id: 'pagos', title: 'Precios y Pagos', num: '07', icon: CreditCard },
    { id: 'entregas', title: 'Envíos y Entregas', num: '09', icon: Truck },
    { id: 'intelectual', title: 'Propiedad Intelectual', num: '12', icon: Lock },
    { id: 'jurisdiccion', title: 'Ley Aplicable', num: '18', icon: Globe },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFCFB] dark:bg-[#0F0F0F] text-slate-800 dark:text-slate-300 font-sans transition-colors duration-300">
      <Header />
      
      <main className="flex-grow max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-16 w-full">
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
        <header className="mb-12 md:mb-16 text-center md:text-left px-2 flex flex-col md:flex-row justify-between items-center gap-8 animate-fade-in">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
              Actualización: 19 de febrero de 2026
            </div>
            <h1 className="font-headline text-4xl sm:text-5xl md:text-7xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight text-balance">
              Términos y <br className="hidden md:block"/><span className="italic text-primary">Condiciones</span> de Uso
            </h1>
            <p className="text-base md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed font-medium">
              Al navegar y comprar en <span className="text-primary font-bold">floreriaflorarte.com</span>, usted acepta los presentes términos que rigen nuestra relación comercial.
            </p>
          </div>
          <Button onClick={handleDownloadPDF} variant="outline" className="rounded-full h-12 px-6 border-2 font-bold gap-2 shrink-0 bg-white dark:bg-zinc-900 transition-all hover:bg-primary hover:text-white hover:border-primary">
            <Download className="w-4 h-4" />
            Descargar PDF
          </Button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start px-2">
          
          {/* Navegación Lateral Interna */}
          <aside className="lg:col-span-4 sticky top-44 hidden lg:block animate-fade-in">
            <div className="space-y-8">
              <div className="bg-white dark:bg-[#1A1A1A] border border-slate-100 dark:border-white/5 p-8 rounded-[2rem] shadow-xl shadow-black/5">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-8 border-b border-slate-50 dark:border-white/5 pb-4">
                  Contenido Destacado
                </h3>
                <nav className="space-y-5">
                  {sections.map((section) => (
                    <a 
                      key={section.id}
                      href={`#${section.id}`} 
                      className="group flex items-center gap-4 text-sm font-bold text-slate-500 hover:text-primary transition-all"
                    >
                      <span className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-[10px] group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                        <section.icon className="w-4 h-4" />
                      </span>
                      {section.title}
                    </a>
                  ))}
                </nav>
              </div>

              <div className="bg-primary/5 border-2 border-dashed border-primary/20 p-8 rounded-[2rem] space-y-4">
                <h4 className="text-slate-900 dark:text-white font-bold flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  ¿Dudas legales?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  Nuestro equipo de atención al cliente puede asistirte con cualquier duda sobre estos términos.
                </p>
                <Button variant="link" className="p-0 h-auto font-bold gap-2 group text-primary" asChild>
                  <Link href="/contact">
                    Contactar soporte <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </div>
          </aside>

          {/* Contenido Principal */}
          <article className="lg:col-span-8 space-y-12 md:space-y-16 animate-fade-in-up w-full pb-20">
            
            <section id="aceptacion" className="scroll-mt-44 space-y-6">
              <h2 className="text-2xl md:text-3xl font-headline font-bold text-slate-900 dark:text-white flex items-center gap-4">
                <span className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">1</span>
                Aceptación de los Términos
              </h2>
              <p className="text-base md:text-lg leading-relaxed text-slate-600 dark:text-slate-400 font-medium">
                Al acceder, navegar y realizar compras en el sitio web <span className="text-primary font-bold">www.floreriaflorarte.com</span>, el usuario acepta plena y expresamente los presentes Términos y Condiciones. Si el usuario no está de acuerdo, deberá abstenerse de utilizar el sitio y los servicios.
              </p>
            </section>

            <section id="productos" className="scroll-mt-44 space-y-6">
              <h2 className="text-2xl md:text-3xl font-headline font-bold text-slate-900 dark:text-white flex items-center gap-4">
                <span className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">5</span>
                Productos y Calidad
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-6 bg-white dark:bg-[#1A1A1A] rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest"><Globe className="w-4 h-4"/> Naturaleza Floral</div>
                  <p className="text-sm text-slate-500 leading-relaxed">Debido a la naturaleza floral, la apariencia, colores y flores pueden variar según la estacionalidad.</p>
                </div>
                <div className="p-6 bg-white dark:bg-[#1A1A1A] rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest"><RefreshCw className="w-4 h-4"/> Sustituciones</div>
                  <p className="text-sm text-slate-500 leading-relaxed">Podremos sustituir accesorios o follajes por otros de igual o mayor valor si no hay disponibilidad.</p>
                </div>
              </div>
            </section>

            <section id="intelectual" className="scroll-mt-44 space-y-6">
              <h2 className="text-2xl md:text-3xl font-headline font-bold text-slate-900 dark:text-white flex items-center gap-4">
                <span className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">12</span>
                Propiedad Intelectual
              </h2>
              <p className="text-base text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                Todos los contenidos, diseños, logotipos y fotografías son propiedad exclusiva de <span className="text-primary font-bold">Florería Florarte</span>. Queda terminantemente prohibida su reproducción o uso sin autorización previa.
              </p>
            </section>

            {/* Premium Support CTA */}
            <div className="mt-20 p-8 md:p-16 bg-slate-950 rounded-[2.5rem] md:rounded-[3.5rem] text-center relative overflow-hidden shadow-2xl">
              <h3 className="font-headline text-3xl md:text-5xl text-white mb-6 font-bold px-4">¿Aún tienes dudas?</h3>
              <p className="text-slate-400 max-w-2xl mx-auto mb-10 text-base md:text-xl font-medium leading-relaxed px-4">
                Nuestro equipo de atención al cliente está listo para ayudarte con cualquier consulta legal o sobre tu pedido.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4">
                <Button asChild size="lg" className="w-full sm:w-auto h-14 md:h-16 px-10 rounded-full font-bold text-base md:text-lg bg-primary hover:bg-primary/90 shadow-[0_0_30px_rgba(255,45,120,0.3)] gap-3 border-none">
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

          </article>
        </div>
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
