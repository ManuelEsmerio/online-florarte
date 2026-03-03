// src/components/AddedToCartSheet.tsx
'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from './ui/button';
import { CheckCircle, X } from 'lucide-react';
import Image from 'next/image';
import { type CartItemCompat } from '@/context/CartContext';
import type { Product } from '@/lib/definitions';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { Separator } from './ui/separator';
import { ComplementSlider } from './ComplementSlider';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface AddedToCartSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  product: CartItemCompat;
}

export function AddedToCartSheet({
  isOpen,
  onOpenChange,
  product,
}: AddedToCartSheetProps) {
  const router = useRouter();

  const handleGoToCart = () => {
    onOpenChange(false);
    router.push('/cart');
  };

  const handleContinueShopping = () => {
    onOpenChange(false);
  };
  
  const imageToShow = useMemo(() => {
    if (product.customPhotoUrl) return product.customPhotoUrl;
    if (product.variants && product.variants.length > 0 && product.variants[0].images && product.variants[0].images.length > 0) {
      return product.variants[0].images[0].src;
    }
    if (product.images && product.images.length > 0) {
      return product.images[0].src;
    }
    return product.image || product.product?.mainImage || '/placehold.webp';
  }, [product]);

  const productName = useMemo(() => {
    const displayName = product.name ?? product.product?.name ?? '';
    const hasCustomPhoto = !!product.customPhotoUrl;
    if (hasCustomPhoto) {
      return `${displayName} (con mini foto)`;
    }
    return displayName;
  }, [product.name, product.product?.name, product.customPhotoUrl]);


  return (
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent className={cn("flex flex-col p-0 w-full sm:max-w-lg")} side="bottom">
          <div className="flex flex-col h-full">
            <div className="p-6">
                <SheetHeader className="p-0 border-b-0 text-left">
                    <SheetTitle className="sr-only">Producto agregado al carrito</SheetTitle>
                    <div className="flex items-center gap-4">
                        <div className="relative h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0">
                            <Image
                                src={imageToShow}
                                alt={product.name ?? product.product?.name ?? ''}
                                fill
                                className="rounded-md object-cover"
                                sizes="80px"
                            />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h3 className="text-base sm:text-lg font-semibold">Agregaste al carrito</h3>
                                <CheckCircle className="h-5 w-5 text-green-500" />
                            </div>
                            <p className="text-muted-foreground text-sm sm:text-base">{productName}</p>
                        </div>
                    </div>
                </SheetHeader>
            </div>
            
            <Separator />
            
            <div className="flex-grow overflow-y-auto px-6 py-6 min-h-0">
                {product.product && <ComplementSlider product={product.product as Product} parentCartItemId={product.cartItemId} />}
            </div>

            <SheetFooter className="p-6 border-t bg-background flex-col sm:flex-row gap-2 mt-auto">
                <Button variant="ghost" onClick={handleContinueShopping} className="w-full sm:w-auto text-primary">Seguir explorando</Button>
                <Button onClick={handleGoToCart} className="w-full sm:w-auto" size="lg">Ir al carrito</Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
