// src/components/ProductCard.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProductRow } from '@/lib/definitions';
import { cn } from '@/lib/utils';
import { Heart, Eye, ShoppingCart, Percent, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/context/CartContext';
import { ToastAction } from '@/components/ui/toast';
import { useRef, useState } from 'react';

interface ProductCardProps {
  product: ProductRow;
  index?: number;
  onQuickViewOpen?: (product: ProductRow) => void;
  variant?: 'default' | 'compact';
}

export function ProductCard({ product, index = 0, onQuickViewOpen, variant = 'default' }: ProductCardProps) {
  const { toast } = useToast();
  const { toggleWishlist, wishlist } = useAuth();
  const { addToCart, deliveryDate } = useCart();
  const isProductInWishlist = wishlist.some(item => item.id === product.id);
  const pressTimer = useRef<NodeJS.Timeout>();
  const [isAdding, setIsAdding] = useState(false);

  const isCompact = variant === 'compact';
    const variantLabel = (product as any)?.variantName ?? null;

  let displayPrice: number;
  let displaySalePrice: number | null = null;

  if (product.has_variants && product.variants && product.variants.length > 0) {
    const firstVariant = product.variants[0];
    displayPrice = firstVariant.price;
    displaySalePrice = firstVariant.sale_price ?? null;
  } else {
    displayPrice = product.price;
    displaySalePrice = product.sale_price ?? null;
  }

  const priceAsNumber = parseFloat(displayPrice as any);
  const salePriceAsNumber = displaySalePrice ? parseFloat(displaySalePrice as any) : null;
  const hasSale = salePriceAsNumber !== null && salePriceAsNumber < priceAsNumber;

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const result = await toggleWishlist(product.id, product as any);
    
    if (result.success) {
      toast({
          title: result.type === 'added' ? 'Añadido a la wishlist' : 'Eliminado de la wishlist',
          description: `${product.name} ha sido ${result.type === 'added' ? 'añadido a' : 'eliminado de'} tu lista de deseos.`,
          action: <ToastAction altText="Ver Wishlist" asChild><Link href="/wishlist">Ver Wishlist</Link></ToastAction>,
      })
        } else if (result.message) {
            toast({
                title: 'Inicia sesión para continuar',
                description: result.message,
            });
    }
  }

  const handleQuickViewClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickViewOpen?.(product);
  }

  const handleAddToCartClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!deliveryDate || deliveryDate.includes('No especificada')) {
        onQuickViewOpen?.(product);
        return;
    }

    if (product.has_variants) {
        onQuickViewOpen?.(product);
        return;
    }

    setIsAdding(true);
    try {
        await addToCart({
            product: product as any,
            quantity: 1,
            deliveryDate: deliveryDate
        });
    } catch (error) {
        console.error("Error adding to cart:", error);
    } finally {
        setIsAdding(false);
    }
  }

  const handlePressStart = (e: React.TouchEvent | React.MouseEvent) => {
    if ('touches' in e) { 
        pressTimer.current = setTimeout(() => {
            onQuickViewOpen?.(product);
        }, 500);
    }
  };

  const handlePressEnd = () => {
    clearTimeout(pressTimer.current);
  };

  const renderTag = () => {
        const rawTag = (product as any)?.tag_visible ?? (product as any)?.badgeText ?? (product as any)?.badge_text ?? null;
        const tag = rawTag ? String(rawTag).trim().toUpperCase() : null;
    if (!tag) return null;

    if (tag === 'OFERTA') {
        return (
            <div className="absolute top-4 left-4 z-20">
                <span className="bg-white/95 dark:bg-white text-slate-900 text-[10px] font-bold tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-xl border border-primary/20">
                    <Percent className="w-3 h-3 text-primary" />
                    OFERTA
                </span>
            </div>
        );
    }

    if (tag === 'NUEVO') {
        return (
            <div className="absolute top-4 left-4 z-20">
                <span className="bg-primary text-white text-[10px] font-bold tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-xl">
                    <Sparkles className="w-3 h-3" />
                    NUEVO
                </span>
            </div>
        );
    }

    if (tag === 'MÁS VENDIDO') {
        return (
            <div className="absolute top-4 left-4 z-20">
                <span className="bg-[#FACC15] text-black text-[10px] font-bold tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-xl">
                    <Sparkles className="w-3 h-3" />
                    MÁS VENDIDO
                </span>
            </div>
        );
    }

        return (
            <div className="absolute top-4 left-4 z-20">
                <span className="bg-white/95 dark:bg-zinc-800 text-slate-800 dark:text-slate-100 text-[10px] font-bold tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-xl border border-primary/20">
                    <Sparkles className="w-3 h-3 text-primary" />
                    {tag}
                </span>
            </div>
        );
  };

  return (
    <Card 
        className={cn(
            "group relative overflow-hidden rounded-[2rem] bg-white dark:bg-zinc-900/50 transition-all duration-300 hover:translate-y-[-4px] border border-transparent dark:border-white/5 shadow-xl flex flex-col h-full animate-fade-in-up"
        )}
        style={{ animationDelay: `${index * 100}ms` }}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onContextMenu={(e) => e.preventDefault()}
    >
        <div className="relative h-64 md:h-72 overflow-hidden">
            {renderTag()}

            <button 
                onClick={handleWishlistToggle}
                className={cn(
                    "absolute top-4 right-4 z-20 w-9 h-9 md:w-10 md:h-10 bg-white/90 dark:bg-zinc-800 shadow-lg rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group/heart",
                    isProductInWishlist ? "text-primary" : "text-slate-800 dark:text-slate-200"
                )}
                aria-label="Añadir a favoritos"
            >
                <Heart className={cn("h-4 w-4 md:h-5 md:w-5 transition-colors", isProductInWishlist && "fill-current")} />
            </button>

            {/* Botón Ojo - Ahora al centro para no estorbar al botón de carrito que está abajo */}
            <button 
                onClick={handleQuickViewClick}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-12 h-12 md:w-14 md:h-14 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 shadow-2xl hover:bg-primary/80"
                aria-label="Vista rápida"
            >
                <Eye className="h-6 w-6 md:h-7 md:h-7" />
            </button>

            <Link href={`/products/${product.slug}`} className="block h-full relative">
                <Image
                    src={product.image || '/placehold.webp'}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60"></div>
            </Link>
        </div>

        <CardContent className="p-4 md:p-6 pt-8 md:pt-10 relative flex flex-col flex-grow">
            {/* Botón Carrito - Ahora flotando en el borde inferior de la imagen */}
            <button 
                onClick={handleAddToCartClick}
                disabled={isAdding}
                className="absolute -top-5 right-4 md:right-6 md:-top-6 w-10 h-10 md:w-12 md:h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/30 transition-all duration-300 hover:scale-110 active:scale-95 hover:shadow-primary/50 disabled:opacity-70 disabled:cursor-not-allowed z-30"
                aria-label="Agregar al carrito"
            >
                {isAdding ? <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" /> : <ShoppingCart className="h-4 w-4 md:h-5 md:w-5" />}
            </button>

            <Link href={`/products/${product.slug}`} className="block mb-4">
                <h3 className="font-headline text-lg md:text-2xl font-bold text-slate-900 dark:text-white transition-colors duration-300 leading-tight line-clamp-2">
                    {product.name}
                </h3>
                                {variantLabel && (
                                    <p className="mt-1 text-sm md:text-base text-slate-500 dark:text-slate-400 leading-tight line-clamp-1">
                                        {variantLabel}
                                    </p>
                                )}
            </Link>

            <div className="mt-auto">
                {hasSale && (
                    <div className="text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-500 line-through mb-0.5 ml-0.5">
                        ${priceAsNumber.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </div>
                )}
                <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl md:text-3xl font-bold text-primary tracking-tight font-sans">
                        ${(salePriceAsNumber || priceAsNumber).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans">MXN</span>
                </div>
            </div>
        </CardContent>
    </Card>
  );
}