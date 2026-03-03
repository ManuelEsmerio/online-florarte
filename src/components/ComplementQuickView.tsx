
// src/components/ComplementQuickView.tsx
'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Product } from '@/lib/definitions';
import Image from 'next/image';
import { Button } from './ui/button';
import { PlusCircle, Loader2, Check, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/utils';

interface ComplementQuickViewProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  complement: Product;
  parentCartItemId?: string;
}

export function ComplementQuickView({
  isOpen,
  onOpenChange,
  complement,
  parentCartItemId
}: ComplementQuickViewProps) {
  const { cart, toggleComplement, isTogglingComplement, updatingItemId } = useCart();

  const isSelected = cart.some(item => 
    item.id === complement.id && 
    item.isComplement &&
    (parentCartItemId ? item.parentCartItemId?.toString() === parentCartItemId : true)
  );

  const handleAction = async () => {
    await toggleComplement(complement, parentCartItemId);
    onOpenChange(false);
  };
  
  const productImage = complement.image || '/placehold.webp';
  const isUpdatingThis = isTogglingComplement && updatingItemId === `comp-${complement.id}`;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-lg p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-white dark:bg-[#121212]"
        onPointerDownOutside={(e) => e.preventDefault()}
        hideCloseButton={true}
      >
        <div className="flex items-center justify-between p-8 pb-2">
          <DialogTitle className="text-3xl font-headline font-medium text-slate-900 dark:text-white">
            {complement.name}
          </DialogTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onOpenChange(false)}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-400 dark:text-slate-500 h-10 w-10"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        <div className="p-8 pt-2 flex flex-col items-center">
          {/* Product Glow & Image */}
          <div className="relative w-full aspect-square flex items-center justify-center mb-8">
            <div className="absolute inset-0 bg-radial-gradient from-primary/15 to-transparent blur-3xl rounded-full scale-75 -z-10" />
            <div className="relative w-[85%] h-[85%] transition-transform duration-500 hover:scale-105">
                <Image
                    src={productImage}
                    alt={complement.name}
                    fill
                    className="object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:drop-shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
                    sizes="(max-width: 768px) 80vw, 40vw"
                />
            </div>
          </div>

          <div className="mb-6 text-center">
            <span className="text-4xl font-bold text-primary tracking-tight font-sans">
              {formatCurrency(complement.sale_price || complement.price)}
            </span>
          </div>

          <div className="text-center max-w-sm mb-10">
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-light text-base md:text-lg">
              {complement.description || 'Un detalle perfecto para complementar tu regalo y hacerlo aún más especial.'}
            </p>
          </div>

          <Button
            onClick={handleAction}
            className={cn(
                "group w-full h-16 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 active:scale-[0.98] shadow-lg text-lg font-bold tracking-wide",
                isSelected 
                    ? "bg-green-600 hover:bg-green-700 text-white shadow-green-500/20" 
                    : "bg-primary hover:bg-[#e6296c] text-white shadow-primary/20"
            )}
            disabled={isTogglingComplement}
          >
            {isUpdatingThis ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : isSelected ? (
              <>
                <Check className="h-6 w-6" />
                Agregado al pedido
              </>
            ) : (
              <>
                <PlusCircle className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" />
                Agregar al pedido
              </>
            )}
          </Button>
        </div>

        {/* Bottom decorative gradient */}
        <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-50" />
      </DialogContent>
    </Dialog>
  );
}
