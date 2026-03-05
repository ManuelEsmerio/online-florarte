// src/services/recommendationService.ts
import { prisma } from '@/lib/prisma';
import { productService } from './productService';
import type { Product, PeakDate } from '@/lib/definitions';
import { peakDateService } from './peakDateService';
import { unstable_cache } from 'next/cache';
import { startOfDay, subDays } from 'date-fns';

// Las peak dates cambian con muy poca frecuencia (fechas especiales del negocio).
// Se cachean 1 hora para evitar una query a BD en cada llamada a getRecommendations.
const getCachedPeakDates = unstable_cache(
  () => peakDateService.getAllPeakDates(),
  ['peak-dates'],
  { revalidate: 3600, tags: ['peak-dates'] }
);

interface RecommendationParams {
  context: 'home' | 'pdp-similar' | 'pdp-bought-together' | 'cart';
  userId?: number | null;
  sessionId?: string | null;
  productId?: number;
  categoryId?: number;
  limit: number;
}

const DIVERSIFICATION_LIMIT_PER_CATEGORY = 4;

async function applyBusinessRules(products: Product[], peakDays: PeakDate[], excludeProductId?: number): Promise<Product[]> {
  let filtered = excludeProductId ? products.filter(p => p.id !== excludeProductId) : products;

  const today = startOfDay(new Date());
  const isPeak = peakDays.some(pd =>
    startOfDay(pd.peakDate).getTime() === today.getTime() && pd.isCouponRestricted
  );

  if (isPeak) {
    filtered = filtered.sort((a, b) => (b.stock ?? 0) - (a.stock ?? 0));
    filtered.forEach(p => (p as any).badge = 'Precio de temporada');
  }

  return filtered;
}

function diversifyResults(products: Product[]): Product[] {
  const categoryCount: { [key: number]: number } = {};
  const diversified: Product[] = [];
  for (const product of products) {
    const categoryId = product.categoryId;
    if ((categoryCount[categoryId] || 0) < DIVERSIFICATION_LIMIT_PER_CATEGORY) {
      diversified.push(product);
      categoryCount[categoryId] = (categoryCount[categoryId] || 0) + 1;
    }
  }
  return diversified;
}

export const recommendationService = {
  async getRecommendations(params: RecommendationParams): Promise<Product[]> {
    const { context, userId, productId, categoryId, limit } = params;
    let candidateIds: number[] = [];

    switch (context) {
      case 'home':
        candidateIds = await this.getGlobalTrending(userId, limit * 2);
        break;
      case 'pdp-similar':
        if (productId && categoryId) {
          candidateIds = await this.getSimilarByContent(productId, categoryId, limit * 2);
        }
        break;
      case 'pdp-bought-together':
      case 'cart':
        if (productId) {
          candidateIds = await this.getFrequentlyBoughtTogether([productId], limit * 2);
        }
        break;
    }

    if (candidateIds.length < limit) {
      const fallbackIds = await this.getFallbackRecommendations(limit, [...candidateIds, ...(productId ? [productId] : [])]);
      candidateIds = [...new Set([...candidateIds, ...fallbackIds])];
    }

    if (candidateIds.length === 0) return [];

    const candidateProducts = await productService.getProductsByIds(candidateIds) as unknown as import('@/lib/definitions').Product[];
    const peakDays = await getCachedPeakDates();
    const filtered = await applyBusinessRules(candidateProducts, peakDays, productId);
    const diversified = diversifyResults(filtered);
    return diversified.slice(0, limit);
  },

  async getGlobalTrending(userId: number | null | undefined, limit: number): Promise<number[]> {
    const thirtyDaysAgo = subDays(new Date(), 30);
    const topItems = await prisma.orderItem.groupBy({
      by: ['productId'],
      _count: { productId: true },
      where: { order: { createdAt: { gte: thirtyDaysAgo }, status: { not: 'CANCELLED' } } },
      orderBy: { _count: { productId: 'desc' } },
      take: limit,
    });

    if (topItems.length >= limit) return topItems.map(i => i.productId);

    // Fallback: newest published products
    const fallback = await prisma.product.findMany({
      where: { isDeleted: false, status: 'PUBLISHED', id: { notIn: topItems.map(i => i.productId) } },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
      take: limit - topItems.length,
    });

    return [...topItems.map(i => i.productId), ...fallback.map(p => p.id)];
  },

  async getSimilarByContent(productId: number, categoryId: number, limit: number): Promise<number[]> {
    const similar = await prisma.product.findMany({
      where: { categoryId, id: { not: productId }, isDeleted: false, status: 'PUBLISHED' },
      select: { id: true },
      take: limit,
    });

    if (similar.length >= limit) return similar.map(p => p.id);

    const others = await prisma.product.findMany({
      where: { id: { notIn: [productId, ...similar.map(p => p.id)] }, isDeleted: false, status: 'PUBLISHED' },
      select: { id: true },
      take: limit - similar.length,
    });

    return [...similar.map(p => p.id), ...others.map(p => p.id)];
  },

  async getFrequentlyBoughtTogether(productIds: number[], limit: number): Promise<number[]> {
    const frequent = await prisma.orderItem.groupBy({
      by: ['productId'],
      _count: { productId: true },
      where: {
        order: { items: { some: { productId: { in: productIds } } } },
        productId: { notIn: productIds },
      },
      orderBy: { _count: { productId: 'desc' } },
      take: limit,
    });
    return frequent.map(i => i.productId);
  },

  async getFallbackRecommendations(limit: number, excludeIds: number[]): Promise<number[]> {
    const featured = await prisma.product.findMany({
      where: { isDeleted: false, status: 'PUBLISHED', id: { notIn: excludeIds }, tags: { some: { tag: { name: 'destacado' } } } },
      select: { id: true },
      take: limit,
    });

    if (featured.length >= limit) return featured.map(p => p.id);

    const newest = await prisma.product.findMany({
      where: { isDeleted: false, status: 'PUBLISHED', id: { notIn: [...excludeIds, ...featured.map(p => p.id)] } },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
      take: limit - featured.length,
    });

    return [...featured.map(p => p.id), ...newest.map(p => p.id)];
  },
};
