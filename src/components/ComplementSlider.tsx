
'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import type { Product } from '@/lib/definitions';
import { handleApiResponse } from '@/utils/handleApiResponse';
import { ComplementQuickView } from './ComplementQuickView';
import { ComplementCategoryModal } from './ComplementCategoryModal';
import { ComplementCard, ComplementCardSkeleton } from './ComplementCard';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

interface ComplementSliderProps {
  product: Product;
  parentCartItemId?: string;
}

export function ComplementSlider({ product, parentCartItemId }: ComplementSliderProps) {
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [activeComplement, setActiveComplement] = useState<Product | null>(null);
  const [api, setApi] = useState<CarouselApi>();
  const [progress, setProgress] = useState(0);

  const { data: complements = [], isLoading } = useQuery<Product[]>({
    queryKey: ['complements', product.slug],
    queryFn: async () => {
      const res = await fetch(`/api/products/${product.slug}/complements`);
      const data = await handleApiResponse<{ complements?: Product[] }>(res, { complements: [] });
      return data.complements || [];
    },
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      const snapList = api.scrollSnapList();
      const current = api.selectedScrollSnap();
      const totalSnaps = snapList.length;
      if (totalSnaps > 0) {
        setProgress(((current + 1) / totalSnaps) * 100);
      }
    };

    api.on("select", onSelect);
    onSelect(); // Initial call

    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  const handleQuickView = (complement: Product) => {
    setActiveComplement(complement);
    setIsQuickViewOpen(true);
  };
  
  if (!isLoading && complements.length === 0) {
    return null;
  }

  const itemsToShow = complements.slice(0, 10);
  const hasMoreItems = complements.length > 0;

  return (
    <>
      <div className="space-y-6 pt-4">
        <div className="text-center md:text-left space-y-1">
            <h2 className="text-[9px] font-bold tracking-[0.3em] text-primary uppercase">Eleva tu detalle</h2>
            <h1 className="text-lg md:text-xl font-headline font-bold text-foreground tracking-tight">
                COMPLEMENTA TU REGALO
            </h1>
        </div>

        <div className="relative group/slider px-2">
            {/* Custom Navigation - Desktop Only */}
            <Button 
                variant="ghost" 
                size="icon" 
                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-background/80 dark:bg-zinc-900/80 border border-border/50 text-foreground backdrop-blur-md opacity-0 group-hover/slider:opacity-100 transition-all duration-300 hover:bg-primary hover:text-white shadow-xl -ml-4 hidden md:flex"
                onClick={() => api?.scrollPrev()}
            >
                <ChevronLeft className="w-6 h-6" />
            </Button>
            <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-background/80 dark:bg-zinc-900/80 border border-border/50 text-foreground backdrop-blur-md opacity-0 group-hover/slider:opacity-100 transition-all duration-300 hover:bg-primary hover:text-white shadow-xl -mr-4 hidden md:flex"
                onClick={() => api?.scrollNext()}
            >
                <ChevronRight className="w-6 h-6" />
            </Button>

            <div className="relative overflow-hidden">
                <Carousel 
                    setApi={setApi}
                    opts={{ align: 'start', skipSnaps: true }} 
                    className="w-full"
                >
                    <CarouselContent className="-ml-4 py-4 px-2">
                        {isLoading ? (
                            Array.from({ length: 4 }).map((_, index) => (
                               <CarouselItem key={index} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/2">
                                    <ComplementCardSkeleton />
                                </CarouselItem>
                            ))
                        ) : (
                            <>
                            {itemsToShow.map((complement) => (
                               <CarouselItem key={complement.id} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/2">
                                    <ComplementCard
                                        complement={complement}
                                        onQuickView={() => handleQuickView(complement)}
                                        parentCartItemId={parentCartItemId}
                                    />
                                </CarouselItem>
                            ))}
                            {hasMoreItems && (
                                <CarouselItem className="pl-4 basis-full sm:basis-1/2 lg:basis-1/2">
                                    <button 
                                        className="w-full h-full min-h-[350px] rounded-[2rem] border-2 border-dashed border-primary/30 flex flex-col items-center justify-center gap-6 group/more transition-all duration-500 hover:bg-primary/5 hover:border-primary/60 bg-primary/5"
                                        onClick={() => setIsCategoryModalOpen(true)}
                                    >
                                        <div className="w-16 h-16 rounded-full border border-primary/30 flex items-center justify-center text-primary bg-background group-hover/more:bg-primary group-hover/more:text-white group-hover/more:scale-110 transition-all duration-300 shadow-lg shadow-primary/10">
                                            <PlusCircle className="h-8 w-8"/>
                                        </div>
                                        <div className="text-center">
                                            <span className="block text-xs font-bold tracking-[0.3em] text-foreground uppercase mb-1">Ver Más</span>
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Explorar catálogo</span>
                                        </div>
                                    </button>
                                </CarouselItem>
                            )}
                            </>
                        )}
                    </CarouselContent>
                </Carousel>
                
                <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none z-10 hidden md:block"></div>
                <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10 hidden md:block"></div>
            </div>
        </div>

        {/* Progress bar - Mobile Only */}
        <div className="mt-4 max-w-xs mx-auto md:hidden">
            <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                <div 
                    className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(255,45,117,0.5)] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            <div className="flex justify-between mt-3 text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">
                <span>Inicio</span>
                <span>Explorar</span>
            </div>
        </div>
      </div>

      {activeComplement && (
        <ComplementQuickView
          isOpen={isQuickViewOpen}
          onOpenChange={setIsQuickViewOpen}
          complement={activeComplement}
          parentCartItemId={parentCartItemId}
        />
      )}
      <ComplementCategoryModal
        isOpen={isCategoryModalOpen}
        onOpenChange={setIsCategoryModalOpen}
        parentCartItemId={parentCartItemId}
      />
    </>
  );
}
