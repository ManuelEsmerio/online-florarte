"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';

type ProductImageCarouselProps = {
  images: { id?: number, src: string; alt: string, hint?: string }[];
};

const ProductImageCarousel = ({ images }: ProductImageCarouselProps) => {
  const [mainApi, setMainApi] = useState<CarouselApi>();
  const [thumbApi, setThumbApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onThumbClick = useCallback(
    (index: number) => {
      if (!mainApi) return;
      mainApi.scrollTo(index);
    },
    [mainApi]
  );

  const onSelect = useCallback(() => {
    if (!mainApi || !thumbApi) return;
    const index = mainApi.selectedScrollSnap();
    setSelectedIndex(index);
    thumbApi.scrollTo(index);
  }, [mainApi, thumbApi]);
  
  useEffect(() => {
    if (!mainApi) {
      return;
    }
    onSelect();
    mainApi.on("select", onSelect);
    mainApi.on("reInit", onSelect);
  }, [mainApi, onSelect]);


  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Main Carousel - Now larger and centered */}
      <div className="relative w-full order-1">
        <Carousel className="w-full" setApi={setMainApi} opts={{ loop: true }}>
          <CarouselContent>
            {images.map((image, index) => (
              <CarouselItem key={image.id || index}>
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2.5rem] md:rounded-[3rem] premium-glow bg-muted/20 border border-border/50 shadow-sm">
                    <Image
                      src={image.src || '/placehold.webp'}
                      alt={image.alt}
                      fill
                      className="h-full w-full object-cover transition-transform duration-700"
                      priority={index === 0}
                      data-ai-hint={image.hint}
                    />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-md border-white/20 text-white hover:bg-primary hover:border-primary transition-all hidden md:flex" />
          <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-md border-white/20 text-white hover:bg-primary hover:border-primary transition-all hidden md:flex" />
        </Carousel>
      </div>

      {/* Thumbnail Carousel (Horizontal below the main image) */}
      {images.length > 1 && (
        <div className="w-full order-2 px-2">
            <Carousel
                setApi={setThumbApi}
                opts={{
                    containScroll: 'keepSnaps',
                    dragFree: true,
                    align: 'start',
                }}
                className="w-full"
            >
                <CarouselContent className="-ml-3">
                    {images.map((image, index) => (
                    <CarouselItem key={image.id || index} className="pl-3 basis-1/4 sm:basis-1/5 md:basis-[15%] lg:basis-[12%]">
                        <div
                            onClick={() => onThumbClick(index)}
                            className={cn(
                                "aspect-square relative cursor-pointer rounded-2xl overflow-hidden transition-all duration-300",
                                selectedIndex === index 
                                    ? "border-2 border-primary shadow-[0_0_15px_rgba(255,45,120,0.3)] ring-2 ring-primary/10 scale-95" 
                                    : "border border-border/50 opacity-60 hover:opacity-100 hover:scale-[0.98]"
                            )}
                        >
                        <Image
                            src={image.src || '/placehold.webp'}
                            alt={image.alt}
                            fill
                            className="object-cover"
                        />
                        </div>
                    </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
        </div>
      )}
    </div>
  );
};

export default ProductImageCarousel;