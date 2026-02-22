
'use client';

import React, { useCallback, useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import type { ProductCategory, Product } from '@/lib/definitions';
import { 
  Gift, 
  Heart, 
  Loader2, 
  Wind, 
  Wine,
  Package,
  X,
  Minus,
  Plus,
  ChevronRight,
  PlusCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { handleApiResponse } from '@/utils/handleApiResponse';
import { useCart } from '@/context/CartContext';

interface ComplementCategoryModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  parentCartItemId?: string;
}

// Estructura fija de las subcategorías de complementos basada en src/lib/data/categories-data.ts
const COMPLEMENT_CATEGORIES = [
    { id: 11, name: 'Peluches', slug: 'peluches', icon: Heart },
    { id: 12, name: 'Globos', slug: 'globos', icon: Wind },
    { id: 13, name: 'Chocolates y Trufas', slug: 'chocolates-dulces', icon: Gift },
    { id: 14, name: 'Vinos y Licores', slug: 'vinos-licores', icon: Wine },
    { id: 15, name: 'Cajas Decorativas', slug: 'cajas-decorativas', icon: Package },
];

export function ComplementCategoryModal({
  isOpen,
  onOpenChange,
  parentCartItemId
}: ComplementCategoryModalProps) {
  const { cart, toggleComplement, isTogglingComplement, updatingItemId, updateQuantity } = useCart();
  
  const [activeCategoryId, setActiveCategoryId] = useState<number>(11); // Peluches por defecto
  const [productsByCategory, setProductsByCategory] = useState<Record<number, Product[]>>({});
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Totales de complementos seleccionados en el carrito
  const selectedComplements = useMemo(() => {
    return cart.filter(item => item.isComplement);
  }, [cart]);

  const complementsTotal = useMemo(() => {
    return selectedComplements.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [selectedComplements]);

  // Cargar productos de la categoría seleccionada desde la FAKE API
  useEffect(() => {
    const fetchProducts = async () => {
      if (activeCategoryId && !productsByCategory[activeCategoryId]) {
        setIsLoadingProducts(true);
        try {
          const categorySlug = COMPLEMENT_CATEGORIES.find(c => c.id === activeCategoryId)?.slug;
          // Llamada a la API interna que usa los repositorios mock
          const res = await fetch(`/api/products?category=${categorySlug}`);
          const data = await handleApiResponse(res);
          setProductsByCategory(prev => ({
            ...prev,
            [activeCategoryId]: data.products || []
          }));
        } catch (error) {
          console.error("Failed to fetch mock products", error);
        } finally {
          setIsLoadingProducts(false);
        }
      }
    };
    if (isOpen && activeCategoryId) fetchProducts();
  }, [activeCategoryId, isOpen, productsByCategory]);

  const activeProducts = useMemo(() => {
    return activeCategoryId ? productsByCategory[activeCategoryId] || [] : [];
  }, [activeCategoryId, productsByCategory]);

  const getCartItem = (productId: number) => {
    return cart.find(item => 
        item.id === productId && 
        item.isComplement && 
        (parentCartItemId ? item.parentCartItemId?.toString() === parentCartItemId : true)
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-5xl p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-background flex flex-col h-[90vh] md:h-[80vh]"
        onPointerDownOutside={(e) => e.preventDefault()}
        hideCloseButton={true}
      >
        {/* Header Premium */}
        <DialogHeader className="px-8 py-6 border-b border-border/50 flex flex-row items-center justify-between shrink-0">
          <DialogTitle className="font-headline text-2xl md:text-4xl text-foreground text-center w-full">
            Complementa tu Regalo
          </DialogTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onOpenChange(false)}
            className="absolute right-6 top-6 rounded-full text-muted-foreground hover:text-primary hover:bg-muted transition-all h-10 w-10"
          >
            <X className="h-6 w-6" />
          </Button>
        </DialogHeader>
        
        {/* Main Body Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Navigation */}
          <div className="w-1/3 md:w-1/4 border-r border-border/50 p-4 overflow-y-auto custom-scrollbar bg-muted/20">
            <nav className="space-y-3">
              {COMPLEMENT_CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  const isActive = activeCategoryId === category.id;
                  return (
                      <button 
                          key={category.id}
                          onClick={() => setActiveCategoryId(category.id)}
                          className={cn(
                              "w-full flex items-center gap-3 p-4 rounded-2xl transition-all duration-300 group",
                              isActive 
                                  ? "bg-primary/5 border border-primary/20 shadow-sm" 
                                  : "bg-transparent border border-transparent hover:bg-muted"
                          )}
                      >
                          <Icon className={cn(
                              "h-5 w-5 transition-all duration-300",
                              isActive ? "text-primary scale-110" : "text-muted-foreground"
                          )} />
                          <div className="text-left hidden sm:block flex-1 min-w-0">
                              <span className={cn(
                                  "block font-bold text-sm truncate",
                                  isActive ? "text-foreground" : "text-muted-foreground"
                              )}>
                                  {category.name}
                              </span>
                          </div>
                          <ChevronRight className={cn(
                              "ml-auto h-4 w-4 transition-all hidden sm:block",
                              isActive ? "text-primary translate-x-1" : "text-muted-foreground/30"
                          )} />
                      </button>
                  )
              })}
            </nav>
          </div>

          {/* Product Grid Area */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-background">
            {isLoadingProducts ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-64 bg-muted animate-pulse rounded-3xl" />
                    ))}
                </div>
            ) : activeProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {activeProducts.map((complement) => {
                        const cartItem = getCartItem(complement.id);
                        const isUpdating = updatingItemId === `comp-${complement.id}`;
                        
                        return (
                            <div 
                                key={complement.id}
                                className="bg-card rounded-3xl p-4 border border-border/50 hover:border-primary/30 transition-all flex flex-col group shadow-sm hover:shadow-xl hover:shadow-primary/5"
                            >
                                <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 bg-muted/30">
                                    <Image
                                        src={complement.image || '/placehold.webp'}
                                        alt={complement.name}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                </div>
                                <div className="flex flex-col flex-1 px-1">
                                    <h3 className="text-foreground font-bold text-sm mb-1 line-clamp-1">{complement.name}</h3>
                                    <p className="text-primary font-bold text-lg mb-4 font-sans">{formatCurrency(complement.price)}</p>
                                    
                                    {cartItem ? (
                                        <div className="mt-auto flex items-center justify-between bg-primary/10 rounded-2xl px-2 py-1.5 border border-primary/20">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-primary hover:bg-primary hover:text-white rounded-xl transition-all active:scale-90"
                                                onClick={() => updateQuantity(cartItem.cartItemId, cartItem.quantity - 1)}
                                                disabled={isTogglingComplement}
                                            >
                                                <Minus className="h-4 w-4" />
                                            </Button>
                                            <span className="font-bold text-foreground font-sans">{cartItem.quantity}</span>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-primary hover:bg-primary hover:text-white rounded-xl transition-all active:scale-90"
                                                onClick={() => updateQuantity(cartItem.cartItemId, cartItem.quantity + 1)}
                                                disabled={isTogglingComplement}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            className="mt-auto w-full h-11 rounded-2xl border-2 border-primary text-primary bg-transparent font-bold hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2 group/btn active:scale-95"
                                            onClick={() => toggleComplement(complement, parentCartItemId)}
                                            disabled={isTogglingComplement}
                                        >
                                            {isUpdating ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <PlusCircle className="h-5 w-5 group-hover/btn:rotate-90 transition-transform" />
                                                    Agregar
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <Package className="h-12 w-12 text-muted/30 mb-4" />
                    <p className="text-muted-foreground font-medium">No hay productos disponibles en esta categoría.</p>
                </div>
            )}
          </div>
        </div>
       
        {/* Footer with Summaries */}
        <div className="px-8 py-6 bg-muted/30 border-t border-border/50 flex items-center justify-between shrink-0">
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Seleccionados: <span className="text-foreground">{selectedComplements.length}</span>
            </p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Total adicionales: <span className="text-primary font-sans">{formatCurrency(complementsTotal)}</span>
            </p>
          </div>
          <Button 
            onClick={() => onOpenChange(false)} 
            className="w-full md:w-auto px-12 h-14 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 text-lg"
          >
            Listo
          </Button>
        </div>
      </DialogContent>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: hsl(var(--primary) / 0.3);
            border-radius: 10px;
        }
      `}</style>
    </Dialog>
  );
}
