// src/services/recommendationService.ts
import { recommendationRepository } from '../repositories/recommendationRepository';
import { productService } from './productService';
import type { Product, DbProduct, PeakDate } from '@/lib/definitions';
import { peakDateService } from './peakDateService';
import { startOfDay } from 'date-fns';

interface RecommendationParams {
  context: 'home' | 'pdp-similar' | 'pdp-bought-together' | 'cart';
  userId?: number | null;
  sessionId?: string | null;
  productId?: number;
  categoryId?: number;
  limit: number;
}

const DIVERSIFICATION_LIMIT_PER_CATEGORY = 4;

async function applyBusinessRules(
  products: Product[],
  peakDays: PeakDate[],
  excludeProductId?: number
): Promise<Product[]> {
  // 1. Filtrar productos a excluir
  let filtered = excludeProductId
    ? products.filter(p => p.id !== excludeProductId)
    : products;

  // 2. Aplicar lógica de Peak Days
  const today = startOfDay(new Date());
  const isPeak = peakDays.some(pd => 
      startOfDay(pd.peak_date).getTime() === today.getTime() && pd.is_coupon_restricted
  );

  if (isPeak) {
    filtered = filtered.sort((a, b) => (b.stock ?? 0) - (a.stock ?? 0));
    filtered.forEach(p => (p as any).badge = "Precio de temporada");
  }

  return filtered;
}

function diversifyResults(products: Product[]): Product[] {
  const categoryCount: { [key: number]: number } = {};
  const diversified: Product[] = [];

  for (const product of products) {
    const categoryId = product.category.id;
    if ((categoryCount[categoryId] || 0) < DIVERSIFICATION_LIMIT_PER_CATEGORY) {
      diversified.push(product);
      categoryCount[categoryId] = (categoryCount[categoryId] || 0) + 1;
    }
  }
  return diversified;
}

export const recommendationService = {
  /**
   * Orquesta la obtención de recomendaciones según el contexto.
   */
  async getRecommendations(params: RecommendationParams): Promise<Product[]> {
    const { context, userId, productId, categoryId, limit } = params;
    
    let candidateIds: number[] = [];
    
    // 1. Generar candidatos según la estrategia
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
        if (productId) { // En el contexto del carrito, podríamos pasar un array de productIds
          candidateIds = await this.getFrequentlyBoughtTogether([productId], limit * 2);
        }
        break;
    }
    
    // 2. Fallback si no hay candidatos
    if (candidateIds.length < limit) {
      const fallbackIds = await this.getFallbackRecommendations(limit, [...candidateIds, ...(productId ? [productId] : [])]);
      candidateIds.push(...fallbackIds);
      candidateIds = [...new Set(candidateIds)]; // Eliminar duplicados
    }
    
    if (candidateIds.length === 0) {
      return [];
    }
    
    // 3. Obtener detalles de productos y aplicar reglas
    const candidateProducts = await productService.getProductsByIds(candidateIds);
    const peakDays = await peakDateService.getAllPeakDates();
    const filteredAndBadgedProducts = await applyBusinessRules(candidateProducts, peakDays, productId);
    
    // 4. Diversificar y cortar al límite
    const diversified = diversifyResults(filteredAndBadgedProducts);
    
    return diversified.slice(0, limit);
  },

  /**
   * Obtiene los productos más populares globalmente.
   */
  async getGlobalTrending(userId: number | null | undefined, limit: number): Promise<number[]> {
    return recommendationRepository.findTrendingProductIds(limit);
  },

  /**
   * Obtiene productos similares basados en metadatos (tags, ocasiones).
   */
  async getSimilarByContent(productId: number, categoryId: number, limit: number): Promise<number[]> {
    return recommendationRepository.findSimilarProductIdsByContent(productId, categoryId, limit);
  },

  /**
   * Obtiene productos frecuentemente comprados juntos.
   */
  async getFrequentlyBoughtTogether(productIds: number[], limit: number): Promise<number[]> {
    return recommendationRepository.findFrequentlyBoughtTogetherIds(productIds, limit);
  },

  /**
   * Obtiene recomendaciones de fallback (destacados o más nuevos).
   */
  async getFallbackRecommendations(limit: number, excludeIds: number[]): Promise<number[]> {
    return recommendationRepository.findFallbackProductIds(limit, excludeIds);
  },
};
