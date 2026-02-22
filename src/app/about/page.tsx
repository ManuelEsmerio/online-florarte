'use client';

import Header from '@/components/Header';
import { Footer } from '@/components/Footer';
import Image from 'next/image';
import { Heart, Target, Leaf, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AboutPage() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans transition-colors duration-300">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <header className="relative h-[60vh] md:h-[80vh] w-full flex items-center justify-center overflow-hidden">
          <Image
            src="https://picsum.photos/seed/florarte-history/1920/1080"
            alt="Vibrante campo de flores en Jalisco"
            fill
            className="object-cover brightness-[0.4] md:brightness-50"
            priority
            data-ai-hint="flower field"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-background" />
          
          <div className="relative z-10 text-center space-y-4 px-6">
            <span className="text-primary uppercase tracking-[0.4em] text-[10px] md:text-sm font-bold animate-fade-in">
              Tequila, Jalisco
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-8xl font-headline italic text-white leading-tight animate-fade-in-up text-balance">
              Nuestra Historia
            </h1>
            <div className="w-16 md:w-24 h-px bg-primary mx-auto mt-6 md:mt-8 animate-scale-x" />
          </div>
        </header>

        {/* Story Section */}
        <section className="py-16 md:py-32 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12 md:mb-24">
              <h2 className="text-3xl sm:text-4xl md:text-6xl font-headline text-foreground leading-tight text-balance">
                Pasión por las Flores, <br className="hidden sm:block" />
                <span className="italic text-primary">Tradición en Tequila</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-20 text-base md:text-lg leading-relaxed text-muted-foreground">
              <div className="space-y-6 md:space-y-8">
                <p className="drop-cap first-letter:text-6xl first-letter:md:text-7xl first-letter:font-headline first-letter:text-primary first-letter:mr-3 first-letter:float-left first-letter:leading-none">
                  Florería Florarte nació en el corazón de Tequila, Jalisco, de un sueño familiar por compartir la belleza y el lenguaje de las flores. Desde nuestra fundación en 2010, hemos dedicado cada día a crear arreglos que no solo decoran, sino que también transmiten emociones profundas y conectan personas.
                </p>
                <p className="font-medium text-slate-700 dark:text-slate-300">
                  Somos más que una florería; somos artesanos de la naturaleza, curadores de momentos felices y cómplices de tus sorpresas más especiales.
                </p>
              </div>
              
              <div className="space-y-6 md:space-y-8">
                <p>
                  Nuestra conexión con la Región Valles nos permite seleccionar las flores más frescas y vibrantes directamente de los productores locales, asegurando que cada ramo y arreglo sea una obra de arte efímera pero inolvidable.
                </p>
                
                <div className="p-6 md:p-10 border-l-4 border-primary bg-primary/5 italic font-headline text-xl md:text-3xl text-foreground rounded-r-2xl md:rounded-r-3xl shadow-sm">
                  "Convertimos la naturaleza en el lenguaje del corazón."
                </div>
                
                <p>
                  Gracias por dejarnos ser parte de tu historia y por confiar en nosotros para llevar alegría a quienes más quieres en cada entrega.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Philosophy Section */}
        <section className="py-16 md:py-24 px-4 sm:px-6 bg-secondary/30 relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 lg:gap-12">
              
              {/* Pasión */}
              <div className="bg-background/40 dark:bg-zinc-900/40 backdrop-blur-xl p-8 md:p-12 rounded-[2rem] md:rounded-[2.5rem] border border-border/50 text-center space-y-6 hover:-translate-y-2 transition-all duration-500 group shadow-lg">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/10 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-xl shadow-primary/5 group-hover:scale-110 transition-transform duration-500">
                  <Heart className="w-8 h-8 md:w-10 md:h-10 text-primary fill-primary/20" />
                </div>
                <h3 className="text-xl md:text-2xl font-headline font-bold text-foreground tracking-wide">Nuestra Pasión</h3>
                <p className="text-sm md:text-base text-muted-foreground font-medium leading-relaxed">
                  Crear momentos inolvidables a través de la belleza de las flores, con diseños únicos y un servicio al cliente excepcional en cada detalle.
                </p>
              </div>

              {/* Misión */}
              <div className="bg-background/40 dark:bg-zinc-900/40 backdrop-blur-xl p-8 md:p-12 rounded-[2rem] md:rounded-[2.5rem] border border-border/50 text-center space-y-6 hover:-translate-y-2 transition-all duration-500 group shadow-lg">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/10 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-xl shadow-primary/5 group-hover:scale-110 transition-transform duration-500">
                  <Target className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                </div>
                <h3 className="text-xl md:text-2xl font-headline font-bold text-foreground tracking-wide">Nuestra Misión</h3>
                <p className="text-sm md:text-base text-muted-foreground font-medium leading-relaxed">
                  Ser la florería de referencia en Tequila y la Región Valles, reconocida por nuestra calidad, creatividad y compromiso total con la satisfacción.
                </p>
              </div>

              {/* Valores */}
              <div className="bg-background/40 dark:bg-zinc-900/40 backdrop-blur-xl p-8 md:p-12 rounded-[2rem] md:rounded-[2.5rem] border border-border/50 text-center space-y-6 hover:-translate-y-2 transition-all duration-500 group shadow-lg">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/10 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-xl shadow-primary/5 group-hover:scale-110 transition-transform duration-500">
                  <Leaf className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                </div>
                <h3 className="text-xl md:text-2xl font-headline font-bold text-foreground tracking-wide">Nuestros Valores</h3>
                <p className="text-sm md:text-base text-muted-foreground font-medium leading-relaxed">
                  Calidad, frescura, creatividad, puntualidad y un profundo respeto por la naturaleza y nuestros clientes en cada entrega realizada.
                </p>
              </div>

            </div>
          </div>
        </section>
      </main>

      {/* Botón Flotante para subir */}
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
