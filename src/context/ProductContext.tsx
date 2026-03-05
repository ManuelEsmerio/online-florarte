// src/context/ProductContext.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';
import type { Product, ProductCategory, Occasion, Tag, Order, Testimonial } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthContext';

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
  const pathname = usePathname();
  const { apiFetch } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchInitiated = useRef(false);

  const fetchAppData = useCallback(async () => {
    // Solo se ejecuta si estamos en una ruta de admin
    if (!pathname.startsWith('/admin')) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [productPayload, ordersPayload, testimonialsPayload] = await Promise.all([
        parseApiResponse<AdminProductPayload>(
          apiFetch('/api/admin/products?includeMeta=1', { cache: 'no-store' }),
          'No se pudieron cargar los productos.'
        ),
        parseApiResponse<AdminOrderPayload>(
          apiFetch('/api/admin/orders?limit=50', { cache: 'no-store' }),
          'No se pudieron cargar los pedidos.'
        ),
        parseApiResponse<Testimonial[]>(
          apiFetch('/api/admin/testimonials', { cache: 'no-store' }),
          'No se pudieron cargar los testimonios.'
        ),
      ]);

      setProducts(Array.isArray(productPayload?.products) ? productPayload.products : []);
      setCategories(Array.isArray(productPayload?.categories) ? productPayload.categories : []);
      setOccasions(Array.isArray(productPayload?.occasions) ? productPayload.occasions : []);
      setTags(Array.isArray(productPayload?.tags) ? productPayload.tags : []);
      setOrders(Array.isArray(ordersPayload?.orders) ? ordersPayload.orders : []);
      setTestimonials(Array.isArray(testimonialsPayload) ? testimonialsPayload : []);
    } catch (error: any) {
      console.error('[PRODUCT_CONTEXT_FETCH_ERROR]', error);
      setProducts([]);
      setCategories([]);
      setOccasions([]);
      setTags([]);
      setOrders([]);
      setTestimonials([]);
      toast({
        title: 'Error al sincronizar datos',
        description: error?.message ?? 'No se pudieron obtener los datos del administrador.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, pathname, apiFetch]);
  
  useEffect(() => {
    if (pathname.startsWith('/admin') && !fetchInitiated.current) {
        fetchInitiated.current = true;
        void fetchAppData();
    }
  }, [pathname, fetchAppData]);


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
