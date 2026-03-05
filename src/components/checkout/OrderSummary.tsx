// src/components/checkout/OrderSummary.tsx
'use client';

import { useCart } from "@/context/CartContext";
import { useFormContext } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from 'next/link';
import { useMemo } from "react";
import CheckoutItem from "../CheckoutItem";
import { Sparkles, ShoppingBag, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderSummaryProps {
  shippingCost: number | null;
  validationIssues?: { cartItemId: string }[];
  isValidating?: boolean;
}

export function OrderSummary({ shippingCost, validationIssues = [], isValidating = false }: OrderSummaryProps) {
  const { cart, subtotal, getDiscountAmount, appliedCoupon, removeFromCart } = useCart();

  const couponDiscountAmount = useMemo(() => getDiscountAmount(subtotal), [getDiscountAmount, subtotal]);
  
  const total = useMemo(() => {
    const safeSubtotal = Number(subtotal) || 0;
    const safeTotalDiscount = Number(couponDiscountAmount) || 0;
    const safeShipping = (shippingCost !== null && !isNaN(Number(shippingCost))) ? Number(shippingCost) : 0;
    return Math.max(0, safeSubtotal - safeTotalDiscount + safeShipping);
  }, [subtotal, shippingCost, couponDiscountAmount]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  }

  const isShippingValid = shippingCost !== null && !isNaN(Number(shippingCost));

  return (
    <Card className="rounded-[2.5rem] border-none shadow-xl bg-background dark:bg-zinc-900/50 overflow-hidden font-sans">
      <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
                <ShoppingBag className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="font-headline text-2xl font-bold tracking-tight">Tu Compra</CardTitle>
        </div>
        <Link href="/cart" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">Editar</Link>
      </CardHeader>
      
      <CardContent className="p-8 pt-4 space-y-8">
        <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
            {cart.map(item => (
              <CheckoutItem 
                key={item.cartItemId}
                item={item}
                isOutOfStock={validationIssues.some(issue => issue.cartItemId === item.cartItemId)}
                onRemove={() => removeFromCart(item.cartItemId ?? String(item.id))}
                isValidating={isValidating}
              />
            ))}
        </div>

        <Separator className="bg-border/50" />

        <div className="space-y-4">
          <div className="flex justify-between text-sm font-medium">
            <span className="text-muted-foreground">Productos</span>
            <span className="text-foreground font-sans">{formatCurrency(subtotal)}</span>
          </div>
          
          {couponDiscountAmount > 0 && (
            <div className="flex justify-between text-sm text-green-600 font-bold">
              <span className="flex items-center gap-2"><Sparkles className="w-4 h-4"/> Cupón ({appliedCoupon?.code})</span>
              <span className="font-sans">-{formatCurrency(couponDiscountAmount)}</span>
            </div>
          )}
          
          <div className="flex justify-between text-sm font-medium">
            <span className="text-muted-foreground">Costo de Envío</span>
            <span className={cn("font-sans", !isShippingValid ? "text-primary italic animate-pulse" : "text-foreground")}>
                {isShippingValid ? formatCurrency(Number(shippingCost)) : 'Pendiente de ruta'}
            </span>
          </div>
        </div>
        
        <div className="pt-6 border-t-2 border-dashed border-border/50">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold font-headline">Gran Total</span>
            <div className="text-right">
                <span className="text-3xl font-bold text-primary font-sans leading-none block">
                    {formatCurrency(total)}
                </span>
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-1">IVA Incluido • MXN</span>
            </div>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-center gap-2 text-[11px] font-medium text-muted-foreground/60 uppercase tracking-[0.2em]">
            <Lock className="w-3 h-3 text-success" />
            Entorno Seguro de Pago
        </div>
      </CardContent>
      
    </Card>
  );
}
