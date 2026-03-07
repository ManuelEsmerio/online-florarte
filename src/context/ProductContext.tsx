// src/context/ProductContext.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';
import type { Product, ProductCategory, Occasion, Tag, Order, Testimonial } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './AuthContext';

// Guard de módulo: reutiliza la promesa si ya hay un fetch en curso.
// Previene llamadas duplicadas cuando múltiples componentes admin montan
// simultáneamente y llaman a fetchAppData() al mismo tiempo.
let productContextInFlight: Promise<void> | null = null;

type AdminProductPayload = {
  products?: Product[];
  categories?: ProductCategory[];
  occasions?: Occasion[];
  tags?: Tag[];
};

type AdminOrderPayload = {
  orders?: Order[];
};

async function parseApiResponse<T>(responsePromise: Promise<Response>, fallbackMessage: string): Promise<T> {
  const res = await responsePromise;
  let payload: any = null;

  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    throw new Error(payload?.message ?? fallbackMessage);
  }

  return (payload?.data ?? payload ?? null) as T;
}

interface ProductContextType {
  products: Product[];
  categories: ProductCategory[];
  occasions: Occasion[];
  tags: Tag[];
  orders: Order[];
  testimonials: Testimonial[];
  isLoading: boolean;
  fetchAppData: () => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const { apiFetch } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Refs para mantener identidades estables en fetchAppData sin causar
  // recreaciones del useCallback cuando toast/apiFetch cambian de referencia.
  const apiFetchRef = useRef(apiFetch);
  const toastRef = useRef(toast);
  useEffect(() => { apiFetchRef.current = apiFetch; }, [apiFetch]);
  useEffect(() => { toastRef.current = toast; }, [toast]);

  // fetchInitiated previene re-fetches dentro de la misma sesión admin.
  // Se resetea al desmontar el provider (al salir del área admin).
  const fetchInitiated = useRef(false);

  const fetchAppData = useCallback(async () => {
    // Si los datos ya se cargaron en esta sesión admin, no re-fetchar.
    if (fetchInitiated.current) return;

    // Guard de módulo: si ya hay un fetch en vuelo (p.ej. dos componentes
    // llaman a fetchAppData() simultáneamente), reutilizar la misma promesa.
    if (productContextInFlight) return productContextInFlight;

    productContextInFlight = (async () => {
      setIsLoading(true);
      try {
        const [productPayload, ordersPayload, testimonialsPayload] = await Promise.all([
          parseApiResponse<AdminProductPayload>(
            apiFetchRef.current('/api/admin/products?includeMeta=1', { cache: 'no-store' }),
            'No se pudieron cargar los productos.'
          ),
          parseApiResponse<AdminOrderPayload>(
            apiFetchRef.current('/api/admin/orders?limit=50', { cache: 'no-store' }),
            'No se pudieron cargar los pedidos.'
          ),
          parseApiResponse<Testimonial[]>(
            apiFetchRef.current('/api/admin/testimonials', { cache: 'no-store' }),
            'No se pudieron cargar los testimonios.'
          ),
        ]);

        setProducts(Array.isArray(productPayload?.products) ? productPayload.products : []);
        setCategories(Array.isArray(productPayload?.categories) ? productPayload.categories : []);
        setOccasions(Array.isArray(productPayload?.occasions) ? productPayload.occasions : []);
        setTags(Array.isArray(productPayload?.tags) ? productPayload.tags : []);
        setOrders(Array.isArray(ordersPayload?.orders) ? ordersPayload.orders : []);
        setTestimonials(Array.isArray(testimonialsPayload) ? testimonialsPayload : []);
        fetchInitiated.current = true;
      } catch (error: any) {
        console.error('[PRODUCT_CONTEXT_FETCH_ERROR]', error);
        setProducts([]);
        setCategories([]);
        setOccasions([]);
        setTags([]);
        setOrders([]);
        setTestimonials([]);
        toastRef.current({
          title: 'Error al sincronizar datos',
          description: error?.message ?? 'No se pudieron obtener los datos del administrador.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
        productContextInFlight = null;
      }
    })();

    return productContextInFlight;
    // fetchAppData es estable: no tiene dependencias volátiles.
    // apiFetch y toast se leen desde refs que siempre están actualizados.
  }, []);


  const value: ProductContextType = {
    products,
    categories,
    occasions,
    tags,
    orders,
    testimonials,
    isLoading,
    fetchAppData
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProductContext = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProductContext must be used within a ProductProvider, which is intended for Admin routes.');
  }
  return context;
};
