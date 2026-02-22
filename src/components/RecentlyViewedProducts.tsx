

'use client';

import { useRecentlyViewed } from '@/hooks/use-recently-viewed';
import { Product } from '@/lib/definitions';
import { ProductCardSkeleton } from './ProductCardSkeleton';
import { ProductCard } from '@/components/ProductCard';
import QuickView from '@/components/QuickView';
import { useState } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

const RecentlyViewedProducts = ({ currentSlug }: { currentSlug: string }) => {
  const { recentlyViewedProducts, isLoading } = useRecentlyViewed(currentSlug);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleQuickViewOpen = (product: Product) => {
    setSelectedProduct(product);
    setIsQuickViewOpen(true);
  };

  if (!isLoading && recentlyViewedProducts.length === 0) {
    return null;
  }

  return (
    <>
      <div className="py-16 sm:py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-center font-headline">
            Visto Recientemente
          </h2>
          <div className="mt-12">
            <Carousel
              opts={{
                align: "start",
                loop: false,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/4">
                        <ProductCardSkeleton />
                    </CarouselItem>
                  ))
                ) : (
                  recentlyViewedProducts.map((product, index) => product && (
                    <CarouselItem key={product.slug} className="pl-4 md:basis-1/2 lg:basis-1/4">
                        <ProductCard
                            product={product}
                            index={index}
                            onQuickViewOpen={handleQuickViewOpen}
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

export default RecentlyViewedProducts;
