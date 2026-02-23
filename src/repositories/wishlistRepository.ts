// src/repositories/wishlistRepository.ts
import { wishlistItems } from '@/lib/data/wishlist-data';
import { initialProducts } from '@/lib/data/product-data';
import type { DbProduct } from '@/lib/definitions'; // Usamos DbProduct para el resultado del JOIN
import type { PoolConnection } from '@/lib/db';

export const wishlistRepository = {

  async findByUserId(userId: number): Promise<DbProduct[]> {
    const userItems = wishlistItems.filter(item => item.userId === userId);
    
    const products = userItems
      .map(item => initialProducts.find(p => p.id === item.productId))
      .filter(p => p !== undefined && p.status === 'publicado');
      
    // Return products sorted by creation (mock wishlist items don't have created_at properly linked to product, but items are sorted)
    // We reverse to mimic ORDER BY created_at DESC if we assume items are appended
    return Promise.resolve(products.reverse() as unknown as DbProduct[]);
  },

  /**
   * Añade o elimina un producto de la wishlist de un usuario usando el SP.
   */
  async toggle(connection: PoolConnection, userId: number, productId: number): Promise<void> {
    const existingIndex = wishlistItems.findIndex(item => item.userId === userId && item.productId === productId);
    
    if (existingIndex !== -1) {
      wishlistItems.splice(existingIndex, 1);
    } else {
      wishlistItems.push({ userId, productId, createdAt: new Date() });
    }
    
    return Promise.resolve();
  },
};
