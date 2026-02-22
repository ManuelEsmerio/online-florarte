// src/hooks/use-recently-viewed.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Product } from '@/lib/definitions';
import { handleApiResponse } from '@/utils/handleApiResponse';

const MAX_RECENTLY_VIEWED = 5; // Total items to store (current + 4 previous)
const LOCAL_STORAGE_KEY = 'recentlyViewed';

export const useRecentlyViewed = (currentSlug: string) => {
  const [recentlyViewedProducts, setRecentlyViewedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        const fetchRecentlyViewed = async (slugs: string[]) => {
            setIsLoading(true);
            try {
                if (slugs.length > 0) {
                    const res = await fetch(`/api/products?slugs=${slugs.join(',')}`);
                    const data = await handleApiResponse(res);
                    // El endpoint devuelve { products: [...] }, nos aseguramos de manejarlo
                    const fetchedProducts = data.products || [];
                    // Ordenamos los productos según el orden de los slugs en localStorage
                    const sortedProducts = slugs.map(slug => fetchedProducts.find((p: Product) => p.slug === slug)).filter((p): p is Product => !!p);
                    setRecentlyViewedProducts(sortedProducts);
                } else {
                    setRecentlyViewedProducts([]);
                }
            } catch (error) {
                console.error('Failed to fetch recently viewed products:', error);
                setRecentlyViewedProducts([]);
            } finally {
                setIsLoading(false);
            }
        };

        try {
            const storedSlugsRaw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
            let storedSlugs: string[] = storedSlugsRaw ? JSON.parse(storedSlugsRaw) : [];

            // Add current slug and remove duplicates, then trim
            const newSlugs = [currentSlug, ...storedSlugs.filter(s => s !== currentSlug)];
            const trimmedSlugs = newSlugs.slice(0, MAX_RECENTLY_VIEWED);
            
            window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(trimmedSlugs));
            
            const slugsToFetch = trimmedSlugs.filter(slug => slug !== currentSlug);
            fetchRecentlyViewed(slugsToFetch);
        } catch (error) {
            console.error('Failed to access localStorage for recently viewed:', error);
            setIsLoading(false);
        }
    } else {
        setIsLoading(false);
    }
  }, [currentSlug]);

  return { recentlyViewedProducts, isLoading };
};
