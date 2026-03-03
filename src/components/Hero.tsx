'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { ShippingDateSelector } from './ShippingDateSelector';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import * as React from 'react';

const slides = [
  {
    src: {
      desktop: '/assets/banner/banner-florarte-2.png',
      mobile: '/assets/banner/banner-florarte-2-mobile.png',
    },
    alt: 'Arreglos florales para toda ocasión',
    title: 'Flores que Hablan por Ti',
    description: 'Encuentra el arreglo perfecto para cada ocasión. Entregas en Tequila, Jalisco y toda la Región Valles.',
    buttonText: 'Ver Catálogo',
    buttonLink: '/products/all',
    dataAiHint: 'vibrant flower arrangement',
  },
  {
    src: {
      desktop: 'https://picsum.photos/seed/hero2/1920/1080',
      mobile: 'https://picsum.photos/seed/hero2/750/1200',
    },
    alt: 'Regalos y complementos para cumpleaños',
    title: 'Envía Alegría Hoy Mismo',
    description: 'Sorprende a esa persona especial con un detalle inolvidable. Envío el mismo día disponible.',
    buttonText: 'Regalos de Cumpleaños',
    buttonLink: '/categories/paquetes',
    dataAiHint: 'birthday gifts flowers',
  },
  {
    src: {
      desktop: 'https://picsum.photos/seed/hero3/1920/1080',
      mobile: 'https://picsum.photos/seed/hero3/750/1200',
    },
    alt: 'Ramos de rosas para aniversarios',
    title: 'Celebra el Amor y la Amistad',
    description: 'Nuestros ramos y arreglos son el lenguaje perfecto para expresar tus sentimientos.',
    buttonText: 'Ver Ramos de Amor',
    buttonLink: '/categories/ramos-florales',
    dataAiHint: 'romantic roses bouquet',
  },
];

export const Hero = () => {
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  return (
    <section className="relative w-full bg-background overflow-visible">
      {/* Wrapper for Carousel and Card */}
      <div className="relative">
        <Carousel
          plugins={[plugin.current]}
          className="w-full"
          onMouseEnter={plugin.current.stop}
          onMouseLeave={plugin.current.reset}
        >
          <CarouselContent>
            {slides.map((slide, index) => (
              <CarouselItem key={index}>
                <div className="relative h-[60vh] lg:h-[75vh]">
                  <Image
                    src={slide.src.desktop}
                    alt={slide.alt}
                    fill
                    className="object-cover brightness-75 md:brightness-90"
                    priority={index === 0}
                    data-ai-hint={slide.dataAiHint}
                    sizes="(max-width: 768px) 100vw, 100vw"
                    srcSet={
                      `${slide.src.mobile} 750w, ${slide.src.desktop} 1920w`
                    }
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 md:from-black/40" />
                  <div className="relative z-10 h-full container mx-auto px-4 flex flex-col items-center justify-center text-center pb-32 md:pb-0">
                    <h1 className="text-2xl sm:text-5xl md:text-6xl font-bold font-headline leading-tight mb-2 md:mb-4 animate-fade-in-up text-white text-shadow-lg max-w-4xl">
                      {slide.title}
                    </h1>
                    <p className="text-sm sm:text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-6 md:mb-8 animate-fade-in-up text-shadow-md px-4" style={{ animationDelay: '150ms' }}>
                      {slide.description}
                    </p>
                    <Button asChild size="lg" className="h-11 md:h-14 px-8 rounded-2xl font-bold text-base md:text-lg animate-fade-in-up active:scale-95 transition-all shadow-xl" style={{ animationDelay: '300ms' }}>
                      <Link href={slide.buttonLink}>{slide.buttonText}</Link>
                    </Button>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-20 text-white bg-black/20 hover:bg-black/40 border-white/20 hidden md:flex" />
          <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-20 text-white bg-black/20 hover:bg-black/40 border-white/20 hidden md:flex" />
        </Carousel>

        {/* Card positioned relative to Carousel area */}
        <div className="absolute bottom-0 left-0 w-full z-30 transform translate-y-1/2">
          <ShippingDateSelector />
        </div>
      </div>

      {/* Increased Spacer to ensure next section is clear of the absolute card */}
      <div className="h-64 md:h-48 lg:h-56 bg-background transition-all duration-300" />
    </section>
  );
};