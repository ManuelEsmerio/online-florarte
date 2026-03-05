

'use client';

import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useState } from 'react';
import { Badge } from './ui/badge';
import { X } from 'lucide-react';

interface CartSummaryProps {
  shippingCost?: number;
}

const CartSummary = ({ shippingCost = 0 }: CartSummaryProps) => {
  const { 
    getCartTotal, 
    appliedCoupon, 
    applyCoupon, 
    removeCoupon,
    getDiscountAmount,
    getTotalWithDiscount 
  } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [couponCode, setCouponCode] = useState('');

  const subtotal = parseFloat(getCartTotal().replace(/[^0-9.-]+/g,""));
  const discountAmount = getDiscountAmount ? getDiscountAmount(subtotal) : 0;
  const total = getTotalWithDiscount ? getTotalWithDiscount(subtotal, shippingCost) : subtotal + shippingCost;


  const handleCheckout = () => {
    if (!user) {
      toast({
        title: 'Inicia Sesión para Continuar',
        description: 'Debes iniciar sesión para poder realizar tu pedido.',
        variant: 'destructive',
      });
      router.push('/login?redirect=/checkout');
    } else {
      router.push('/checkout');
    }
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
        toast({ title: 'Ingresa un código de cupón.', variant: 'destructive' });
        return;
    }
    if (applyCoupon) {
        applyCoupon(couponCode);
        setCouponCode('');
    }
  }

  const handleRemoveCoupon = () => {
    if (removeCoupon) {
      removeCoupon();
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6 sticky top-24">
      <div>
        <h3 className="font-semibold text-lg mb-4">Código de promoción</h3>
        <div className="flex space-x-2">
          <Input 
            placeholder="Ingresa tu código" 
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            disabled={!!appliedCoupon}
          />
          <Button 
            variant="outline" 
            onClick={handleApplyCoupon}
            disabled={!!appliedCoupon}
          >
            Aplicar
          </Button>
        </div>
        {appliedCoupon && (
            <div className="mt-4">
                <Badge>
                    {appliedCoupon.code}
                    <Button variant="ghost" size="icon" className="h-4 w-4 ml-2" onClick={handleRemoveCoupon}>
                        <X className="h-3 w-3" />
                    </Button>
                </Badge>
                <p className="text-sm text-green-600 mt-1">{appliedCoupon.description}</p>
            </div>
        )}
      </div>
      <Separator />
      <div>
        <h3 className="font-semibold text-lg mb-4">Resumen de pedido</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(subtotal)}</span>
          </div>
          {appliedCoupon && (
             <div className="flex justify-between text-green-600">
                <span>Descuento ({(appliedCoupon as any).discount_value ?? appliedCoupon.discountValue}%):</span>
                <span>-{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Envío:</span>
            <span>{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(shippingCost)}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between font-bold text-xl">
            <span>Total:</span>
            <span>{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(total)}</span>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <Button size="lg" className="w-full text-lg" onClick={handleCheckout}>
          Realizar Pedido
        </Button>
        <Button variant="outline" size="lg" className="w-full text-lg" asChild>
          <Link href="/products/all">Seguir comprando</Link>
        </Button>
      </div>
    </div>
  );
};

export default CartSummary;
