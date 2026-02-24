// src/services/wishlistService.ts
import { wishlistRepository } from '../repositories/wishlistRepository';
import { productRepository } from '../repositories/productRepository';
import type { Product } from '@/lib/definitions';

type WishlistResponse = {
  wishlistItems: Product[];
  productIds: number[];
};

export const wishlistService = {

  async getWishlistByUserId(userId: number): Promise<WishlistResponse> {
    const productIds = await wishlistRepository.findProductIdsByUserId(userId);

    if (productIds.length === 0) {
      return { wishlistItems: [], productIds: [] };
    }

    // Obtener datos de productos desde el repositorio actual
    const allProducts = await productRepository.findAllForAdmin();
    const wishlistItems = allProducts.filter(p => productIds.includes(p.id));

    return { wishlistItems, productIds };
  },

  async toggleWishlist(userId: number, productId: number): Promise<'added' | 'removed'> {
    if (!productId) {
      throw new Error('El ID de producto es requerido.');
    }
    return wishlistRepository.toggle(userId, productId);
  },
};
