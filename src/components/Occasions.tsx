'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { Occasion } from '@/lib/definitions';

interface OccasionsProps {
  occasions: Occasion[];
  isLoading?: boolean;
}

const OccasionSkeleton = () => (
    <CarouselItem className="basis-[45%] sm:basis-1/3 lg:basis-1/4 xl:basis-1/5 pl-2 md:pl-4">
        <Skeleton className="h-full w-full aspect-square rounded-full" />
    </CarouselItem>
)

export function Occasions({ occasions, isLoading }: OccasionsProps) {
  const homeOccasions = occasions.filter(o => o.show_on_home);

  if (!isLoading && homeOccasions.length === 0) {
    return null;
  }

  return (
    <section className="bg-background py-16 md:py-24 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 animate-fade-in-up">
            <h2 className="text-3xl md:text-5xl font-bold font-headline mb-4">Regala Momentos</h2>
            <p className="text-muted-foreground text-sm md:text-lg">Diseñamos sentimientos para cada historia que quieras contar.</p>
        </div>
        
        <Carousel
          opts={{
            align: 'start',
            loop: false,
            skipSnaps: true
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <OccasionSkeleton key={i} />)
            ) : (
                homeOccasions.map((occasion, index) => (
                <CarouselItem key={occasion.id} className="basis-[45%] sm:basis-1/3 lg:basis-1/4 xl:basis-1/5 pl-2 md:pl-4 animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                    <Link href={`/products/all?occasion=${occasion.slug}`} className="group block h-full text-center">
                        <div className="relative aspect-square w-full rounded-full overflow-hidden mb-4 border-4 border-transparent group-hover:border-primary/40 group-hover:ring-4 group-hover:ring-primary/10 transition-all duration-500 shadow-lg group-hover:shadow-2xl">
                            <Image
                                src={occasion.image_url || '/placehold.webp'}
                                alt={`Flores para ${occasion.name}`}
                                fill
                                className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                                data-ai-hint={occasion.name}
                            />
                            <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </div>
                        <h3 className="text-lg md:text-xl font-bold font-headline group-hover:text-primary transition-colors duration-300">{occasion.name}</h3>
                    </Link>
                </CarouselItem>
                ))
            )}
          </CarouselContent>
          <CarouselPrevious className="absolute -left-4 top-1/2 -translate-y-1/2 hidden lg:flex" />
          <CarouselNext className="absolute -right-4 top-1/2 -translate-y-1/2 hidden lg:flex" />
        </Carousel>
      </div>
    </section>
  );
}