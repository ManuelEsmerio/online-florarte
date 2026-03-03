// src/components/SuggestedComplements.tsx
'use client';

import ProductCarousel from './ProductCarousel';
import { useCart } from '@/context/CartContext';
import { useQuery } from '@tanstack/react-query';
import type { Product } from '@/lib/definitions';
import { handleApiResponse } from '@/utils/handleApiResponse';

export default function FrequentlyBoughtTogether() {
  const { cart } = useCart();
  const referenceProduct = cart.length > 0 ? cart[0] : null;

  const { data: recommendedProducts = [], isLoading } = useQuery<Product[]>({
    queryKey: ['recommendations', referenceProduct?.id],
    queryFn: () =>
      fetch(`/api/recommendations?context=cart&productId=${referenceProduct!.id}&limit=8`)
        .then(res => handleApiResponse(res, [])),
    enabled: !!referenceProduct,
  });

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
