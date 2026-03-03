// src/context/CartContext.tsx
"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback, useRef } from 'react';
import type { CartItem, Coupon, Product } from '@/lib/definitions';
import { toast } from 'sonner';
import { handleApiResponse } from '@/utils/handleApiResponse';
import { useAuth } from './AuthContext';
import type { SelectedCity } from '@/components/ShippingCityModal';

export type CartItemCompat = CartItem & {
  cartItemId?: string;
  name?: string;
  image?: string;
  code?: string;
  slug?: string;
  price?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  category?: any;
  has_variants?: boolean;
  status?: string;
  sale_price?: number | null;
  stock?: number;
  images?: Array<{ src: string; alt?: string }>;
  variants?: Array<{ id: number; name?: string; price?: number; stock?: number; images?: Array<{ src: string }> }>;
  photoOption?: string;
  deliveryTime?: string;
};

type CouponCompat = Coupon & {
  discount_type?: string;
  discount_value?: number;
};

type CartBootstrapSnapshot = {
  items: CartItemCompat[];
  subtotal: number;
  coupon: CouponCompat | null;
};

declare global {
  interface Window {
    __FLORARTE_CART_BOOTSTRAP__?: CartBootstrapSnapshot;
  }
}

function readCartBootstrapSnapshot(): CartBootstrapSnapshot | null {
  if (typeof window === 'undefined') return null;
  return window.__FLORARTE_CART_BOOTSTRAP__ ?? null;
}

interface AddToCartParams {
  product: Product;
  quantity: number;
  deliveryDate?: string;
  deliveryTime?: string;
  photoOption?: 'Sin Foto' | 'Con Foto';
  customPhotoFile?: File | null;
}

interface CartContextType {
  cart: CartItemCompat[];
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addToCart: (params: AddToCartParams) => Promise<string | null>;
  toggleComplement: (complement: Product, parentCartItemId?: string) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  cartItemCount: number;
  subtotal: number;
  getCartTotal: () => string;
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => Promise<void>;
  getDiscountAmount: (subtotal: number) => number;
  getTotalWithDiscount: (subtotal: number, shippingCost: number) => number;
  isCartOpen: boolean;
  setCartOpen: (isOpen: boolean) => void;
  updatingItemId: string | null;
  isAddingToCart: boolean;
  isTogglingComplement: boolean;
  selectedCity: SelectedCity | null;
  setSelectedCity: React.Dispatch<React.SetStateAction<SelectedCity | null>>;
  shippingCost: number | null;
  setShippingCost: React.Dispatch<React.SetStateAction<number | null>>;
  deliveryDate: string | null;
  setDeliveryDate: React.Dispatch<React.SetStateAction<string | null>>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user, apiFetch } = useAuth();
  const initialBootstrap = readCartBootstrapSnapshot();
  const [cart, setCart] = useState<CartItemCompat[]>(initialBootstrap?.items ?? []);
  const [isLoading, setIsLoading] = useState(!initialBootstrap);
  const [subtotal, setSubtotal] = useState(initialBootstrap?.subtotal ?? 0);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>((initialBootstrap?.coupon as Coupon) ?? null);
  
  const [isCartOpen, setCartOpen] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isTogglingComplement, setIsTogglingComplement] = useState(false);
  
  const [selectedCity, setSelectedCity] = useState<SelectedCity | null>(null);
  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [deliveryDate, setDeliveryDate] = useState<string | null>(null);

  // Persistencia de Fecha y Ciudad (Offline-First approach)
  useEffect(() => {
    const savedDate = localStorage.getItem('florarte_delivery_date');
    if (savedDate) setDeliveryDate(savedDate);

    const savedCity = localStorage.getItem('florarte_selected_city');
    if (savedCity) {
        try {
            const city = JSON.parse(savedCity);
            setSelectedCity(city);
            setShippingCost(city.shippingCost);
        } catch (e) {
            localStorage.removeItem('florarte_selected_city');
        }
    }
  }, []);

  useEffect(() => {
    if (deliveryDate) localStorage.setItem('florarte_delivery_date', deliveryDate);
    else localStorage.removeItem('florarte_delivery_date');
  }, [deliveryDate]);

  useEffect(() => {
    if (selectedCity) localStorage.setItem('florarte_selected_city', JSON.stringify(selectedCity));
    else localStorage.removeItem('florarte_selected_city');
  }, [selectedCity]);

  // In-flight guard: evita llamadas duplicadas si fetchCart se invoca
  // varias veces antes de que la anterior complete (ej. Strict Mode, renders rápidos).
  const fetchCartInFlight = useRef<Promise<void> | null>(null);
  const skipFirstFetchRef = useRef(Boolean(initialBootstrap));

  useEffect(() => {
    if (typeof window !== 'undefined' && window.__FLORARTE_CART_BOOTSTRAP__) {
      delete window.__FLORARTE_CART_BOOTSTRAP__;
    }
  }, []);

  const fetchCart = useCallback(async () => {
    if (fetchCartInFlight.current) return fetchCartInFlight.current;

    setIsLoading(true);
    fetchCartInFlight.current = (async () => {
      try {
        const data = await handleApiResponse<{ items: CartItemCompat[]; subtotal: number; coupon: CouponCompat | null }>(
          await apiFetch('/api/cart'),
          { items: [], subtotal: 0, coupon: null }
        );
        setCart(data.items || []);
        setSubtotal(data.subtotal || 0);
        setAppliedCoupon((data.coupon as Coupon) || null);
      } catch (error) {
        console.error("[CartContext] Error fetching cart:", error);
      } finally {
        setIsLoading(false);
        fetchCartInFlight.current = null;
      }
    })();

    return fetchCartInFlight.current;
  }, [apiFetch]);

  // Se usa user?.id (no el objeto completo) para que fetchCart solo se
  // re-dispare cuando cambia la IDENTIDAD del usuario (login/logout),
  // no cuando se actualiza su perfil (updateUser crea un nuevo objeto).
  useEffect(() => {
    if (skipFirstFetchRef.current) {
      skipFirstFetchRef.current = false;
      return;
    }
    fetchCart();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchCart, user?.id]);

  const addToCart = useCallback(async (params: AddToCartParams): Promise<string | null> => {
    setIsAddingToCart(true);
    let newCartItemId = null;
    try {
      const { product, quantity, customPhotoFile, deliveryDate: date, deliveryTime } = params;
      
      const formData = new FormData();
      formData.append('productId', String(product.id));
      const productHasVariants = (product as any).has_variants ?? product.hasVariants;
      if (productHasVariants && product.variants?.length) {
        formData.append('variantId', String(product.variants[0].id));
      }
      formData.append('quantity', String(quantity));
      
      if (customPhotoFile) formData.append('customPhotoFile', customPhotoFile);
      if (date) formData.append('deliveryDate', date);
      if (deliveryTime) formData.append('deliveryTimeSlot', deliveryTime);

      const result = await handleApiResponse<{ item_id?: string | number }>(await apiFetch('/api/cart/add', {
        method: 'POST',
        body: formData,
      }));

      newCartItemId = result.item_id?.toString() || null;
      toast.success('¡Agregado!', { description: `${product.name} está en tu carrito.` });
      
      await fetchCart();
      setCartOpen(true);
    } catch (error: any) {
      toast.error('No se pudo agregar', { description: error.message });
    } finally {
      setIsAddingToCart(false);
    }
    return newCartItemId;
  }, [fetchCart, apiFetch]);

  const removeFromCart = useCallback(async (cartItemId: string) => {
    setUpdatingItemId(cartItemId);
    try {
      const result = await handleApiResponse<{ items: CartItemCompat[]; subtotal: number; coupon: CouponCompat | null }>(await apiFetch(`/api/cart/remove/${cartItemId}`, {
        method: 'DELETE',
      }));
      setCart(result.items || []);
      setSubtotal(result.subtotal || 0);
      setAppliedCoupon((result.coupon as Coupon) || null);
    } catch (error: any) {
      toast.error('Error al eliminar', { description: error.message });
      await fetchCart();
    } finally {
        setUpdatingItemId(null);
    }
  }, [apiFetch, fetchCart]);

  const updateQuantity = useCallback(async (cartItemId: string, newQuantity: number) => {
    setUpdatingItemId(cartItemId);
    try {
      const quantityAsNumber = Math.max(0, parseInt(String(newQuantity), 10));
      if (quantityAsNumber < 1) {
          await removeFromCart(cartItemId);
          return;
      }
      await handleApiResponse(await apiFetch(`/api/cart/update/${cartItemId}`, {
        method: 'POST',
        body: JSON.stringify({ quantity: quantityAsNumber })
      }));
      await fetchCart();
    } catch (error: any) {
      toast.error('Error al actualizar', { description: error.message });
    } finally {
      setUpdatingItemId(null);
    }
  }, [removeFromCart, fetchCart, apiFetch]);

  const toggleComplement = useCallback(async (complement: Product, parentCartItemId?: string) => {
    setIsTogglingComplement(true);
    setUpdatingItemId(`comp-${complement.id}`);
    try {
        const existing = cart.find(item => 
            item.id === complement.id && item.isComplement && 
            (parentCartItemId ? item.parentCartItemId?.toString() === parentCartItemId : true)
        );
        
        if (existing) {
          const existingCartItemId = existing.cartItemId ?? String(existing.id);
          await removeFromCart(existingCartItemId);
        } else {
            const formData = new FormData();
            formData.append('productId', String(complement.id));
            formData.append('quantity', '1');
            formData.append('isComplement', 'true');
            if(parentCartItemId) formData.append('parentCartItemId', parentCartItemId);
            
            await handleApiResponse(await apiFetch('/api/cart/add', { method: 'POST', body: formData }));
            await fetchCart();
            toast.success('Complemento añadido');
        }
    } catch(e: any) {
        toast.error('Error', { description: e.message });
    } finally {
        setUpdatingItemId(null);
        setIsTogglingComplement(false);
    }
  }, [cart, removeFromCart, fetchCart, apiFetch]);

  const applyCoupon = useCallback(async (code: string): Promise<boolean> => {
    try {
        const result = await handleApiResponse<{ coupon: CouponCompat }>(await apiFetch('/api/coupons/validate', {
            method: 'POST',
            body: JSON.stringify({ couponCode: code, deliveryDate })
        }));
        setAppliedCoupon(result.coupon as Coupon);
        toast.success('¡Cupón aplicado!', { description: `Descuento activado: ${result.coupon.code}` });
        await fetchCart();
        return true;
    } catch (error: any) {
        toast.error('Cupón no válido', { description: error.message });
        return false;
    }
  }, [apiFetch, fetchCart, deliveryDate]);

  const removeCoupon = useCallback(async () => {
    try {
        await apiFetch('/api/coupons/remove', { method: 'POST' });
        setAppliedCoupon(null);
        await fetchCart();
        toast.info('Cupón removido');
    } catch (error: any) {
        toast.error('Error', { description: 'No se pudo quitar el cupón.' });
    }
  }, [apiFetch, fetchCart]);

  const clearCart = useCallback(async () => {
    try {
      await apiFetch('/api/cart', { method: 'DELETE' });
      setCart([]);
      setSubtotal(0);
      setAppliedCoupon(null);
      toast.info('Carrito vacío');
    } catch (e) {
      toast.error('Error al vaciar');
    }
  }, [apiFetch]);

  const getDiscountAmount = useCallback((currentSubtotal: number): number => {
    if (!appliedCoupon) return 0;
    const coupon = appliedCoupon as CouponCompat;
    const discountType = coupon.discount_type ?? coupon.discountType;
    const discountValue = Number(coupon.discount_value ?? coupon.discountValue ?? 0);
    if (discountType === 'percentage' || discountType === 'PERCENTAGE') return currentSubtotal * (discountValue / 100);
    if (discountType === 'fixed' || discountType === 'FIXED') return Math.min(currentSubtotal, discountValue);
    return 0;
  }, [appliedCoupon]);

  const getTotalWithDiscount = useCallback((currentSubtotal: number, cost: number = 0): number => {
    const discount = getDiscountAmount(currentSubtotal);
    return Math.max(0, currentSubtotal - discount + cost);
  }, [getDiscountAmount]);

  const cartItemCount = useMemo(() => cart.reduce((count, item) => count + item.quantity, 0), [cart]);

  const getCartTotal = useCallback(
    () => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(subtotal),
    [subtotal]
  );

  const value = useMemo(() => ({
    cart,
    isLoading,
    fetchCart,
    addToCart,
    toggleComplement,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartItemCount,
    subtotal,
    getCartTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    getDiscountAmount,
    getTotalWithDiscount,
    isCartOpen,
    setCartOpen,
    updatingItemId,
    isAddingToCart,
    isTogglingComplement,
    selectedCity,
    setSelectedCity,
    shippingCost,
    setShippingCost,
    deliveryDate,
    setDeliveryDate,
  }), [
    cart, isLoading, fetchCart, addToCart, toggleComplement, removeFromCart,
    updateQuantity, clearCart, cartItemCount, subtotal, getCartTotal, appliedCoupon,
    applyCoupon, removeCoupon, getDiscountAmount, getTotalWithDiscount, isCartOpen,
    updatingItemId, isAddingToCart, isTogglingComplement, selectedCity, shippingCost,
    deliveryDate,
  ]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
