
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, ArrowRight, Flower2, Leaf, X } from 'lucide-react';
import type { Product } from '@/lib/definitions';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from './ui/badge';
import { useDebounce } from '@/hooks/use-debounce';
import { handleApiResponse } from '@/utils/handleApiResponse';
import QuickView from './QuickView';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

// Tipo mínimo que devuelve /api/products/search
type SearchProduct = {
  id: number;
  name: string;
  slug: string;
  code: string;
  mainImage: string | null;
  price: number;
  salePrice: number | null;
  hasVariants: boolean;
  badgeText?: string | null;
  category: { name: string; slug: string };
  tags: { tag: { name: string } }[];
  variants: {
    id: number;
    name: string;
    price: number;
    salePrice: number | null;
    code: string | null;
    images: { src: string }[];
  }[];
  // Campos expandidos para variantes individuales mostradas en resultados
  isVariant?: boolean;
  variantId?: number;
  variantName?: string;
  displayPrice?: number;
  displaySalePrice?: number | null;
  displayCode?: string;
  displayImage?: string;
};

const SearchResultItemSkeleton = () => (
  <div className="flex items-center gap-4 p-4 border-b border-border/30 animate-pulse">
    <Skeleton className="h-16 w-16 rounded-2xl flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-5 w-3/4 rounded-md" />
      <div className='flex gap-2'><Skeleton className="h-3 w-16 rounded-md" /><Skeleton className="h-3 w-12 rounded-md" /></div>
    </div>
    <Skeleton className="h-10 w-10 rounded-full" />
  </div>
);

const popularSearches = [
  "Rosas Rojas",
  "Tulipanes",
  "Orquídeas",
  "Regalos de Aniversario",
  "Cumpleaños"
];

export function SearchDialog() {
  const { cart } = useCart();
  const { toast } = useToast();
  const { apiFetch } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [searchTerm, setSearchTerm] = useState('');

  const inputRef = React.useRef<HTMLInputElement>(null);

  // Debounce de 300ms — single debounce, sin setTimeout adicional
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Focus al abrir el dialog
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus({ preventScroll: true });
      }, 100);
    }
  }, [isOpen]);

  // Limpiar estado al cerrar
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  const { data: results = [], isFetching: isSearching } = useQuery<SearchProduct[]>({
    queryKey: ['search', debouncedSearchTerm],
    queryFn: async () => {
      const res = await apiFetch(
        `/api/products/search?q=${encodeURIComponent(debouncedSearchTerm)}`
      );
      const data = await handleApiResponse<{ products?: SearchProduct[] }>(res);
      const rawProducts: SearchProduct[] = data.products ?? [];

      // Expandir variantes como filas individuales en resultados
      return (rawProducts.flatMap((p): any[] => {
        if (p.hasVariants && p.variants.length > 0) {
          return p.variants.map(v => ({
            ...p,
            isVariant: true,
            variantId: v.id,
            variantName: v.name,
            name: `${p.name} (${v.name})`,
            displayCode: v.code ?? p.code,
            displayPrice: Number(v.price),
            displaySalePrice: v.salePrice != null ? Number(v.salePrice) : null,
            displayImage: v.images?.[0]?.src ?? p.mainImage ?? '/placehold.webp',
          }));
        }
        return [{
          ...p,
          isVariant: false,
          displayCode: p.code,
          displayPrice: Number(p.price),
          displaySalePrice: p.salePrice != null ? Number(p.salePrice) : null,
          displayImage: p.mainImage ?? '/placehold.webp',
        }];
      }) as SearchProduct[]);
    },
    enabled: isOpen && debouncedSearchTerm.length >= 2,
    staleTime: 1000 * 30,
  });

  const handleQuickView = useCallback((product: SearchProduct) => {
    setSelectedProduct(product as any);
    setIsQuickViewOpen(true);
  }, []);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Search" className="h-10 w-10 md:h-11 md:w-11 hover:bg-primary/5 hover:text-primary dark:hover:bg-primary dark:hover:text-white rounded-xl">
            <Search className="h-5 w-5 md:h-6 md:w-6" />
          </Button>
        </DialogTrigger>
        <DialogContent
          className="w-[95vw] sm:max-w-2xl p-0 overflow-hidden border-none shadow-2xl rounded-3xl md:rounded-[2.5rem] bg-background dark:bg-[#0A0A0A] transition-all duration-300 max-h-[85dvh]"
          hideCloseButton={false}
        >
          <DialogHeader className="p-6 md:p-12 pb-0 md:pb-0 relative">
            <DialogTitle className="sr-only">Buscar Productos</DialogTitle>
            <div className="relative mt-2 md:mt-4 group">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                <Search className="h-5 w-5 md:h-6 md:w-6 text-primary group-focus-within:scale-110 transition-transform" />
              </div>
              <Input
                ref={inputRef}
                placeholder="¿Qué flores estás buscando?"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-14 md:h-20 pl-12 md:pl-14 pr-10 md:pr-12 bg-stone-100 dark:bg-[#161616] border-none rounded-xl md:rounded-2xl text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 text-base md:text-lg focus-visible:ring-1 focus-visible:ring-primary/30 transition-all outline-none shadow-inner"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 h-8 w-8 md:h-10 md:w-10 rounded-full hover:bg-white/10"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="p-6 md:p-12 pt-4 md:pt-6 max-h-[65vh] overflow-y-auto custom-scrollbar">
            {isSearching ? (
              <div className="space-y-1">
                <SearchResultItemSkeleton />
                <SearchResultItemSkeleton />
                <SearchResultItemSkeleton />
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 dark:text-stone-500 font-sans">
                    Resultados encontrados
                  </h2>
                </div>
                {results.map((item) => (
                  <div
                    key={item.isVariant ? `${item.slug}-${item.variantId}` : item.slug}
                    className="flex items-center gap-4 p-4 rounded-3xl hover:bg-primary/5 dark:hover:bg-primary/10 transition-all group"
                  >
                    <Link href={`/products/${item.slug}`} onClick={() => setIsOpen(false)} className="shrink-0">
                      <div className="relative h-16 w-16 md:h-20 md:w-20 rounded-2xl overflow-hidden shadow-sm border border-border/50">
                        <Image
                          src={item.displayImage ?? '/placehold.webp'}
                          alt={item.name}
                          fill
                          sizes="80px"
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/products/${item.slug}`} onClick={() => setIsOpen(false)}>
                        <p className="font-bold text-base md:text-lg truncate group-hover:text-primary transition-colors leading-tight">{item.name}</p>
                        <div className='flex items-center gap-2 mt-1'>
                          <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">{item.displayCode}</p>
                          <Badge variant="secondary" className="text-[9px] h-4 py-0 px-1.5 bg-muted/50 uppercase tracking-tighter rounded-md">{item.category.name}</Badge>
                        </div>
                      </Link>
                      <div className="mt-2 flex items-baseline gap-2">
                        <p className="font-bold text-primary text-lg">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(item.displaySalePrice ?? item.displayPrice ?? 0)}</p>
                        {item.displaySalePrice != null && item.displaySalePrice < (item.displayPrice ?? 0) && (
                          <p className="text-xs text-muted-foreground line-through opacity-60">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(item.displayPrice ?? 0)}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-12 w-12 rounded-full hover:bg-primary hover:text-white transition-all shadow-sm active:scale-90"
                      onClick={() => handleQuickView(item)}
                      aria-label={`Vista rápida de ${item.name}`}
                    >
                      <ArrowRight className="h-6 w-6" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              searchTerm.length >= 2 ? (
                <div className="text-center py-20 animate-fade-in flex flex-col items-center">
                  <div className="p-8 bg-stone-100 dark:bg-[#161616] rounded-full mb-6">
                    <Search className="h-12 w-12 text-muted-foreground/30" />
                  </div>
                  <p className="font-bold text-xl mb-2 text-foreground">No encontramos nada para "{searchTerm}"</p>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">Prueba con palabras más simples como "rosas" o elige una categoría abajo.</p>
                  <Button variant="link" className="mt-6 text-primary font-bold" onClick={() => setSearchTerm('')}>Limpiar búsqueda</Button>
                </div>
              ) : (
                <div className="space-y-12">
                  {/* Categories Section */}
                  <div>
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 dark:text-stone-500 font-sans">
                        Explora por categorías
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Link
                        href="/categories/arreglos-florales"
                        className="group flex flex-col items-center justify-center p-8 bg-stone-100 dark:bg-[#161616] border border-transparent dark:border-white/5 rounded-3xl transition-all duration-300 hover:border-primary/50 hover:-translate-y-1"
                        onClick={() => setIsOpen(false)}
                      >
                        <div className="w-16 h-16 mb-4 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          <Flower2 className="w-12 h-12" />
                        </div>
                        <span className="text-stone-800 dark:text-white font-bold tracking-[0.2em] text-sm font-sans uppercase">Arreglos</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Ver colección</span>
                      </Link>
                      <Link
                        href="/categories/ramos-florales"
                        className="group flex flex-col items-center justify-center p-8 bg-stone-100 dark:bg-[#161616] border border-transparent dark:border-white/5 rounded-3xl transition-all duration-300 hover:border-primary/50 hover:-translate-y-1"
                        onClick={() => setIsOpen(false)}
                      >
                        <div className="w-16 h-16 mb-4 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          <Leaf className="w-12 h-12" />
                        </div>
                        <span className="text-stone-800 dark:text-white font-bold tracking-[0.2em] text-sm font-sans uppercase">Ramos</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Explorar ramos</span>
                      </Link>
                    </div>
                  </div>

                  {/* Popular Searches Section */}
                  <div className="pt-8 border-t border-stone-100 dark:border-white/5">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 dark:text-stone-500 mb-6">Búsquedas populares</p>
                    <div className="flex flex-wrap gap-2.5">
                      {popularSearches.map(query => (
                        <button
                          key={query}
                          onClick={() => setSearchTerm(query)}
                          className="px-5 py-2.5 rounded-full text-xs font-bold bg-stone-100 dark:bg-[#161616] text-stone-600 dark:text-stone-300 hover:bg-primary hover:text-white transition-all active:scale-95 border border-transparent dark:border-white/5"
                        >
                          {query}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
      {selectedProduct && (
        <QuickView
          isOpen={isQuickViewOpen}
          onOpenChange={setIsQuickViewOpen}
          product={selectedProduct}
        />
      )}
    </>
  );
}
