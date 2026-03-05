
'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingBag } from 'lucide-react';
import { ProductCardSkeleton } from '@/components/ProductCardSkeleton';
import Link from 'next/link';
import { ProductCard } from '@/components/ProductCard';
import QuickView from '@/components/QuickView';
import type { Product } from '@/lib/definitions';

export default function WishlistPage() {
  const { user, wishlist, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/wishlist');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    setIsLoading(authLoading);
  }, [authLoading]);

  const handleQuickViewOpen = (product: Product) => {
    setSelectedProduct(product);
    setIsQuickViewOpen(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-grow bg-secondary/30">
        <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-primary/10 rounded-2xl">
              <Heart className="w-6 h-6 text-primary fill-primary" />
            </div>
            <h1 className="text-2xl md:text-4xl font-bold font-headline">Mi Lista de Deseos</h1>
          </div>
          
          <Card className="p-4 md:p-8 rounded-[2rem] border-none shadow-sm bg-background">
             {isLoading ? (
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <ProductCardSkeleton key={index} />
                  ))}
              </div>
            ) : wishlist.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                 {wishlist.map((entry, index) => {
                   const displayProduct = entry.variant
                     ? {
                         ...entry.product,
                         variantId: entry.variant.id,
                         variantName: entry.variant.name,
                         variantProductName: entry.variant.productName ?? (entry.product as any)?.variantProductName ?? entry.product.name,
                         price: entry.variant.price,
                         salePrice: entry.variant.salePrice ?? null,
                         sale_price: (entry.variant as any)?.sale_price ?? entry.variant.salePrice ?? null,
                         image: (entry.variant as any)?.images?.[0]?.src ?? entry.product.image,
                         mainImage: (entry.variant as any)?.images?.[0]?.src ?? entry.product.mainImage,
                         variants: [entry.variant],
                       }
                     : entry.product;

                   const cardKey = entry.selectionKey ?? `${entry.productId}-${entry.variantId ?? 'base'}`;

                   return (
                     <ProductCard 
                       product={displayProduct as any}
                       index={index}
                       key={cardKey}
                       onQuickViewOpen={handleQuickViewOpen}
                       variant="compact"
                     />
                   );
                 })}
              </div>
            ) : (
              <div className="text-center py-16 md:py-24 animate-fade-in">
                <div className="inline-flex p-6 bg-secondary/50 rounded-full mb-6">
                  <Heart className="h-12 w-12 text-muted-foreground/30" />
                </div>
                <h2 className="text-2xl font-bold font-headline mb-3">Tu lista está vacía</h2>
                <p className="text-muted-foreground max-w-sm mx-auto mb-10 leading-relaxed">
                  Guarda los arreglos que más te gusten para tenerlos a la mano en tus momentos especiales.
                </p>
                <Button asChild size="lg" className="h-14 px-10 rounded-2xl font-bold text-lg">
                  <Link href="/products/all">
                      <ShoppingBag className="mr-2 h-5 w-5" />
                      Explorar Tienda
                  </Link>
                </Button>
              </div>
            )}
          </Card>
        </div>
      </main>
      <Footer />
       {selectedProduct && (
        <QuickView
            isOpen={isQuickViewOpen}
            onOpenChange={setIsQuickViewOpen}
            product={selectedProduct}
        />
      )}
    </div>
  );
}
