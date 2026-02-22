// src/components/ProductCarousel.tsx
'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { Product, ProductRow } from '@/lib/definitions';
import { ProductCard } from './ProductCard';
import { ProductCardSkeleton } from './ProductCardSkeleton';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';


// Dynamically import QuickView to avoid including it in the main bundle,
// as it's only loaded when a user interacts with a product.
const QuickView = dynamic(() => import('@/components/QuickView'));

interface ProductCarouselProps {
    title: string;
    subtitle: string;
    products: ProductRow[];
    isLoading?: boolean;
    cardVariant?: 'default' | 'compact';
}

const ProductCarousel = ({ 
    title, 
    subtitle, 
    products,
    isLoading = false,
    cardVariant = 'default' 
}: ProductCarouselProps) => {
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null);

  const handleQuickViewOpen = (product: ProductRow) => {
    setSelectedProduct(product);
    setIsQuickViewOpen(true);
  };
  
  if (!isLoading && (!products || products.length === 0)) {
    return null; // Don't render the section if there are no products
  }

  return (
    <>
    <div className="py-16 sm:py-24 bg-secondary">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight font-headline animate-fade-in-up">
              {title}
            </h2>
             <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in-up" style={{animationDelay: '150ms'}}>
              {subtitle}
            </p>
        </div>
        <Carousel
          opts={{
            align: 'start',
            loop: products.length > 4, // Loop if there are more items than visible on desktop
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <CarouselItem key={index} className="pl-4 basis-1/2 sm:basis-1/3 lg:basis-1/4">
                  <ProductCardSkeleton />
                </CarouselItem>
              ))
            ) : (
              products.map((product, index) => (
                <CarouselItem key={product.variantId ? `v-${product.id}-${product.variantId}` : `p-${product.id}`} className="pl-4 basis-1/2 sm:basis-1/3 lg:basis-1/4">
                  <ProductCard
                    product={product}
                    index={index}
                    onQuickViewOpen={handleQuickViewOpen}
                    variant={cardVariant}
                  />
                </CarouselItem>
              ))
            )}
          </CarouselContent>
          <CarouselPrevious className="absolute -left-4 top-1/2 -translate-y-1/2 hidden sm:flex" />
          <CarouselNext className="absolute -right-4 top-1/2 -translate-y-1/2 hidden sm:flex" />
        </Carousel>
      </div>
    </div>
     {selectedProduct && (
        <QuickView
            isOpen={isQuickViewOpen}
            onOpenChange={setIsQuickViewOpen}
            product={selectedProduct}
        />
      )}
    </>
  );
};

export default ProductCarousel;
