// src/context/ProductContext.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';
import type { Product, ProductCategory, Occasion, Tag, Order, Testimonial } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthContext';

// Importación directa de datos mock para el prototipo
import { allProducts } from '@/lib/data/product-data';
import { productCategories } from '@/lib/data/categories-data';
import { allOccasions } from '@/lib/data/occasion-data';
import { allTags } from '@/lib/data/tag-data';
import { allOrders } from '@/lib/data/order-data';
import { testimonials as allTestimonials } from '@/lib/data/testimonials-data';

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
        // En modo prototipo, cargamos directamente de los archivos de datos
        setProducts([...allProducts]);
        setCategories([...productCategories]);
        setOccasions([...allOccasions]);
        setTags([...allTags]);
        setOrders([...allOrders]);
        setTestimonials([...allTestimonials]);

    } catch (error: any) {
      toast({
        title: "Error al cargar datos locales",
        description: "No se pudieron obtener los datos de prueba.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, pathname]);
  
  useEffect(() => {
    if (pathname.startsWith('/admin') && !fetchInitiated.current) {
        fetchInitiated.current = true;
        fetchAppData();
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
