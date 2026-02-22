'use client';

import Header from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  Mail, 
  ShieldCheck, 
  Flower2, 
  CheckCircle2, 
  HelpCircle,
  ArrowRight
} from 'lucide-react';

export default function CustomerServicePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background relative overflow-hidden">
      <Header />
      
      {/* Elementos decorativos de fondo */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03] grayscale invert dark:invert-0" 
             style={{ backgroundImage: 'url(https://picsum.photos/seed/flowers/1920/1080)', backgroundSize: 'cover', backgroundPosition: 'center' }} 
        />
      </div>

      <main className="flex-grow relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-24">
          
          {/* Encabezado Principal */}
          <header className="text-center mb-12 md:mb-16 space-y-4 animate-fade-in-up">
            <div className="inline-flex items-center justify-center p-3 md:p-4 bg-primary/10 rounded-full mb-4 group">
              <Flower2 className="w-8 h-8 md:w-10 md:h-10 text-primary group-hover:rotate-12 transition-transform duration-500" />
            </div>
            <h1 className="font-headline text-4xl sm:text-5xl md:text-7xl font-bold text-foreground tracking-tight text-balance">
              Atención al Cliente
            </h1>
            <p className="max-w-2xl mx-auto text-base md:text-xl text-muted-foreground leading-relaxed px-4">
              En <span className="text-primary font-bold italic">Florería Florarte</span>, tu satisfacción es nuestra prioridad. Estamos aquí para acompañarte en cada detalle de tu experiencia floral.
            </p>
          </header>

          {/* Grid de Servicios */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-10 md:mb-12">
            
            {/* Horarios */}
            <section className="group bg-card/50 dark:bg-zinc-900/50 backdrop-blur-md p-6 md:p-8 rounded-2xl md:rounded-[2rem] border border-border/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
              <div className="flex items-center gap-4 mb-6 md:mb-8">
                <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl md:rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300">
                  <Clock className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold font-headline">Horarios de Atención</h2>
              </div>
              <p className="text-sm md:text-base text-muted-foreground mb-6 md:mb-8 font-medium">Nuestro equipo de soporte está disponible para atenderte en los siguientes horarios:</p>
              <div className="space-y-4 md:space-y-5 text-sm md:text-base">
                <div className="flex justify-between items-center pb-4 border-b border-border/50">
                  <span className="text-foreground font-semibold">Lunes a Viernes</span>
                  <span className="font-bold text-primary">9:00 AM - 7:00 PM</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-foreground font-semibold">Sábados y Domingos</span>
                  <span className="font-bold text-primary">10:00 AM - 5:00 PM</span>
                </div>
              </div>
            </section>

            {/* Canales de Contacto */}
            <section className="group bg-card/50 dark:bg-zinc-900/50 backdrop-blur-md p-6 md:p-8 rounded-2xl md:rounded-[2rem] border border-border/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
              <div className="flex items-center gap-4 mb-6 md:mb-8">
                <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl md:rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300">
                  <HelpCircle className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold font-headline">Canales de Contacto</h2>
              </div>
              <p className="text-sm md:text-base text-muted-foreground mb-8 md:mb-10 font-medium">Para cualquier duda o seguimiento de tu pedido, envíanos un correo directamente:</p>
              <div className="space-y-6 md:space-y-8">
                <Button 
                  asChild 
                  className="w-full h-14 md:h-16 rounded-xl md:rounded-2xl text-base md:text-lg font-bold shadow-xl shadow-primary/20 group/btn"
                >
                  <a href="mailto:soporte@floreriaflorarte.com" className="flex items-center justify-center gap-3">
                    <Mail className="w-5 h-5" />
                    Enviar Correo
                    <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                  </a>
                </Button>
                <div className="text-center">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-bold block mb-2">Email Directo</span>
                  <span className="text-base md:text-lg font-bold text-foreground hover:text-primary transition-colors cursor-pointer break-all">
                    soporte@floreriaflorarte.com
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* Compromiso de Servicio */}
          <section className="relative bg-card/30 dark:bg-zinc-900/30 backdrop-blur-sm p-6 md:p-16 rounded-2xl md:rounded-[3rem] border border-border/50 overflow-hidden group">
            <div className="absolute -top-10 -right-10 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
              <ShieldCheck className="w-40 h-40 md:w-80 md:h-80 text-foreground" />
            </div>
            
            <div className="relative z-10 max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 md:px-5 py-2 rounded-full bg-primary/10 text-primary text-[10px] md:text-xs font-bold uppercase tracking-widest mb-8 md:mb-10 border border-primary/20">
                <CheckCircle2 className="w-4 h-4" />
                Nuestro Compromiso de Servicio
              </div>
              
              <div className="space-y-6 md:space-y-8 text-foreground/80 leading-relaxed text-base md:text-xl font-medium">
                <p>
                  Entendemos que cada situación es importante. Atendemos todos los reportes y consultas en el orden en que son recibidos, con la delicadeza que tus flores merecen.
                </p>
                <p>
                  Te pedimos un poco de paciencia mientras nuestro equipo revisa tu caso con la atención que merece. Nos comprometemos a darte una respuesta en un plazo no mayor a <span className="text-primary font-bold">24 horas hábiles</span>.
                </p>
                
                <div className="inline-block mt-4 md:mt-6 p-4 md:p-6 rounded-xl md:rounded-2xl bg-primary/5 border-2 border-dashed border-primary/20 italic text-xs md:text-sm text-muted-foreground">
                  <span className="font-bold text-foreground not-italic mr-2">Pro tip:</span> 
                  Para agilizar el proceso, te recomendamos incluir tu número de pedido (ej. ORD1234) en el asunto de tu correo.
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
