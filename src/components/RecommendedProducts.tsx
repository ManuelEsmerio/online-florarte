// src/components/RecommendedProducts.tsx
'use client';

import ProductCarousel from './ProductCarousel';
import { Product } from '@/lib/definitions';

interface RecommendedProductsProps {
  products: Product[];
  isLoading?: boolean;
}

export function RecommendedProducts({ products, isLoading }: RecommendedProductsProps) {
  return (
    <ProductCarousel
      title="Recomendaciones para Ti"
      subtitle="Descubre los arreglos y ramos más populares entre nuestros clientes."
      products={products}
      isLoading={isLoading}
    />
  );
}
