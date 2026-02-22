// src/components/SuggestedComplements.tsx
'use client';

import ProductCarousel from './ProductCarousel';
import { useCart } from '@/context/CartContext';
import { useMemo, useEffect, useState } from 'react';
import type { Product } from '@/lib/definitions';
import { handleApiResponse } from '@/utils/handleApiResponse';

export default function FrequentlyBoughtTogether() {
  const { cart, cartItemCount } = useCart();
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const referenceProduct = useMemo(() => cart.length > 0 ? cart[0] : null, [cart]);

  useEffect(() => {
    if (referenceProduct) {
      const fetchRecommendations = async () => {
        setIsLoading(true);
        try {
          const res = await fetch(`/api/recommendations?context=cart&productId=${referenceProduct.id}&limit=8`);
          const data = await handleApiResponse(res, []);
          setRecommendedProducts(data);
        } catch (error) {
          console.error("Failed to fetch bought together recommendations:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchRecommendations();
    }
  }, [referenceProduct]);


  if (!referenceProduct && !isLoading) {
    return null;
  }
  
  return (
    <ProductCarousel
      title="Frecuentemente Comprados Juntos"
      subtitle="Otros clientes también llevaron estos productos para complementar su regalo."
      products={recommendedProducts}
      isLoading={isLoading}
      cardVariant="compact"
    />
  );
}
