
'use client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/context/CartContext';
import type { Product } from '@/lib/definitions';
import { cn } from '@/lib/utils';
import { Loader2, Check, Plus } from 'lucide-react';
import Image from 'next/image';

interface ComplementCardProps {
  complement: Product;
  parentCartItemId?: string;
  onQuickView: () => void;
}

export function ComplementCard({ complement, parentCartItemId, onQuickView }: ComplementCardProps) {
  const { cart, toggleComplement, isTogglingComplement, updatingItemId } = useCart();
    const variantLabel = (complement as any).variantName || (complement as any).variant_name || null;
    const hasVariantContext = Boolean(complement.hasVariants && variantLabel);
    const displayTitle = hasVariantContext
        ? ((complement as any).variantProductName || (complement as any).product_name || complement.name)
        : complement.name;
  
  const isSelected = cart.some(item => 
    item.id === complement.id && 
    item.isComplement && 
    (parentCartItemId ? item.parentCartItemId?.toString() === parentCartItemId : true)
  );

  const isUpdatingThis = isTogglingComplement && updatingItemId === `comp-${complement.id}`;

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleComplement(complement, parentCartItemId);
  };

  return (
    <div 
        className="bg-background dark:bg-zinc-900/50 rounded-[2rem] p-4 border border-border/50 transition-all text-left cursor-pointer h-full flex flex-col group hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20"
        onClick={onQuickView}
    >
        <div className="rounded-2xl mb-4 overflow-hidden aspect-[4/5] relative shadow-sm bg-muted/20">
            <Image
                src={complement.mainImage || complement.images?.[0]?.src || '/placehold.webp'}
                alt={complement.name}
                fill
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
            <Button
                size="icon"
                className={cn(
                    "absolute top-3 right-3 h-10 w-10 rounded-full transition-all duration-300 shadow-lg",
                    isSelected 
                        ? "bg-green-500 hover:bg-green-600 text-white" 
                        : "bg-primary text-white hover:bg-primary/90 hover:scale-110 active:scale-95"
                )}
                onClick={handleToggle}
                disabled={isTogglingComplement}
            >
                {isUpdatingThis ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : isSelected ? (
                    <Check className="h-5 w-5" />
                ) : (
                    <Plus className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
                )}
            </Button>
        </div>
        
        <div className="space-y-1.5 px-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                {complement.category?.name || 'Complemento'}
            </p>
            <h4 className="text-sm font-bold text-foreground leading-tight line-clamp-2 min-h-[2.5rem]">
                {displayTitle}
            </h4>
            {hasVariantContext && (
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight line-clamp-1">
                    {variantLabel}
                </p>
            )}
            <p className="text-lg font-bold text-primary font-sans mt-auto">
                {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(complement.price)}
            </p>
        </div>
    </div>
  );
}

export const ComplementCardSkeleton = () => (
    <div className="bg-background dark:bg-zinc-900/50 rounded-[2rem] p-4 h-full flex flex-col border border-border/50">
        <Skeleton className="w-full aspect-[4/5] rounded-2xl mb-4" />
        <div className="space-y-3 px-1">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-6 w-1/2" />
        </div>
    </div>
);
