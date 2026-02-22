'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Skeleton } from './ui/skeleton';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import type { ProductCategory } from '@/lib/definitions';

interface CategoriesProps {
    categories: ProductCategory[];
    isLoading?: boolean;
}

export function Categories({ categories, isLoading }: CategoriesProps) {
  const mainCategories = categories.filter(c => c.show_on_home && !c.parent_id && c.slug !== 'complementos');

  if (!isLoading && mainCategories.length === 0) {
    return null;
  }

  return (
    <section className="bg-secondary/20 py-12 md:py-20 overflow-hidden">
      <div className="container mx-auto px-4">
         <div className="text-center mb-10 md:mb-16 animate-fade-in-up">
            <h2 className="text-2xl md:text-4xl font-bold font-headline mb-4">Explora Nuestras Colecciones</h2>
            <p className="text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto">Entregas el mismo día, de lunes a domingo, en Tequila y toda la Región Valles.</p>
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
              Array.from({ length: 4 }).map((_, index) => (
                 <CarouselItem key={index} className="basis-[70%] sm:basis-1/3 lg:basis-1/4 pl-2 md:pl-4">
                    <Card className="overflow-hidden aspect-[4/5] rounded-3xl">
                        <Skeleton className="h-full w-full" />
                    </Card>
                </CarouselItem>
              ))
            ) : (
              mainCategories.map((category, index) => (
                 <CarouselItem key={category.id} className="basis-[70%] sm:basis-1/3 lg:basis-1/4 pl-2 md:pl-4 animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                    <Link href={`/categories/${category.slug}`} className="group relative block h-full">
                        <Card className="overflow-hidden h-full aspect-[4/5] rounded-3xl shadow-md transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-2 border-none">
                            <Image
                                src={category.image_url || '/placehold.webp'}
                                alt={`Colección de ${category.name}`}
                                fill
                                className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                                data-ai-hint={category.name.toLowerCase()}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-6 flex flex-col justify-end items-center text-center transition-all duration-500 group-hover:via-black/40">
                                <h3 className="text-2xl md:text-3xl font-bold text-white mb-1 drop-shadow-md">{category.name}</h3>
                                <div className="h-1 w-8 bg-primary rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                            </div>
                        </Card>
                    </Link>
                </CarouselItem>
              ))
            )}
          </CarouselContent>
          <CarouselPrevious className="absolute -left-4 top-1/2 -translate-y-1/2 hidden lg:flex transition-opacity duration-300 opacity-0 group-hover:opacity-100" />
          <CarouselNext className="absolute -right-4 top-1/2 -translate-y-1/2 hidden lg:flex transition-opacity duration-300 opacity-0 group-hover:opacity-100" />
        </Carousel>
      </div>
    </section>
  );
}