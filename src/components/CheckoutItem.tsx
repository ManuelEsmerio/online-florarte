'use client';

import Image from 'next/image';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { type CartItemCompat as CartItem } from '@/context/CartContext';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';

interface CheckoutItemProps {
  item: CartItem;
  isOutOfStock: boolean;
  onRemove: () => void;
  isValidating: boolean;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
};

const CheckoutItemSkeleton = () => (
    <div className="flex items-center gap-4 p-4 border-b last:border-b-0 animate-pulse">
        <Skeleton className="w-16 h-16 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
            <Skeleton className="h-4 rounded w-3/4" />
            <Skeleton className="h-3 rounded w-1/2" />
        </div>
        <div className="text-right flex flex-col items-end gap-2">
             <Skeleton className="h-5 w-16 rounded" />
        </div>
    </div>
);

const CheckoutItem = ({ item, isOutOfStock, onRemove, isValidating }: CheckoutItemProps) => {
    const itemTotal = (item.price ?? item.unitPrice) * item.quantity;
    const hasPhoto = !!item.customPhotoUrl;

    if (isValidating) {
        return <CheckoutItemSkeleton />;
    }

  return (
    <div className={cn(
        "flex items-center justify-between gap-4 p-4 rounded-2xl transition-all duration-300 bg-muted/30 border border-transparent",
        isOutOfStock && "opacity-60 bg-destructive/5 border-destructive/10"
    )}>
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden border border-border/50 bg-background shadow-sm">
            <Image
                src={item.image || '/placehold.webp'}
                alt={item.name ?? ''}
                fill
                className="object-cover"
                sizes="64px"
            />
        </div>
        
        <div className="flex-1 min-w-0 space-y-1">
          <h4 className="font-bold text-sm text-foreground leading-tight line-clamp-2">
            {item.name} 
            {hasPhoto && <span className="text-primary font-medium ml-1">(con Mini Foto)</span>}
          </h4>
          
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Cant: {item.quantity}</p>
              <p className="text-[10px] font-mono font-bold text-muted-foreground/60">SKU: {item.code}</p>
          </div>

           {isOutOfStock && (
                <div className="mt-2 flex items-center gap-2">
                    <Badge variant="destructive" className="h-5 text-[9px] px-2 font-bold uppercase tracking-tighter gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Sin Stock
                    </Badge>
                     <Button variant="link" size="sm" className="text-destructive h-auto p-0 font-bold text-[10px] uppercase tracking-widest" onClick={onRemove}>
                        <Trash2 className="w-3 h-3 mr-1" />
                        Quitar
                    </Button>
                </div>
           )}
        </div>
      </div>

      <div className='text-right shrink-0'>
        <p className="font-bold text-sm text-primary font-sans">
            {formatCurrency(itemTotal)}
        </p>
      </div>
    </div>
  );
};

export default CheckoutItem;
