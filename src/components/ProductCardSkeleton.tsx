// src/components/ProductCardSkeleton.tsx
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton de alta fidelidad que imita exactamente la estructura del ProductCard.
 * Evita el layout shift al cargar el catálogo.
 */
export const ProductCardSkeleton = () => {
  return (
    <Card className="flex flex-col overflow-hidden rounded-[2rem] border border-transparent dark:border-white/5 shadow-xl animate-fade-in-up bg-white dark:bg-zinc-900/50 h-full">
      {/* Contenedor de Imagen */}
      <Skeleton className="w-full h-64 md:h-72 rounded-t-[2rem]" />
      
      <div className="p-4 md:p-6 pt-8 md:pt-10 flex-grow flex flex-col space-y-4 relative">
        {/* Botón Carrito Flotante (Mock) */}
        <Skeleton className="absolute -top-5 right-4 md:right-6 md:-top-6 w-10 h-10 md:w-12 md:h-12 rounded-full shadow-lg" />
        
        {/* Título y SKU */}
        <div className="space-y-3">
            <Skeleton className="h-6 w-11/12 rounded-lg" />
            <Skeleton className="h-6 w-2/3 rounded-lg" />
        </div>

        {/* Precio */}
        <div className="mt-auto space-y-2 pt-2">
          <Skeleton className="h-3 w-16 rounded-md opacity-40" />
          <div className="flex items-end gap-2">
            <Skeleton className="h-8 w-28 rounded-lg" />
            <Skeleton className="h-4 w-8 rounded-md opacity-40" />
          </div>
        </div>
      </div>
    </Card>
  );
};
