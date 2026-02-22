// src/services/wishlistService.ts
import { wishlistRepository } from '../repositories/wishlistRepository';
import { userRepository } from '../repositories/userRepository';
import { productService } from './productService';
import type { Product } from '@/lib/definitions';
// import { dbWithAudit } from '@/lib/db';

type WishlistResponse = {
  wishlistItems: Product[];
  productIds: number[];
};

const dbWithAudit = async <T>(userId: number, fn: () => Promise<T>): Promise<T> => fn();

export const wishlistService = {

  async getWishlistByUserId(userId: number): Promise<WishlistResponse> {
    const dbProducts = await wishlistRepository.findByUserId(userId);
    if (dbProducts.length === 0) {
      return { wishlistItems: [], productIds: [] };
    }
    
    const { products } = await productService.getAdminProductList();
    const wishlistItems = products.filter(p => dbProducts.some(dp => dp.id === p.id));
    
    const productIds = wishlistItems.map(item => item.id);
    return { wishlistItems, productIds };
  },
  
  async toggleWishlist(userId: number, productId: number): Promise<void> {
    if (!productId) {
      throw new Error('El ID de producto es requerido.');
    }
    await dbWithAudit(userId, () =>
      wishlistRepository.toggle(userId, productId)
    );
  },
};
