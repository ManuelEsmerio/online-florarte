// src/services/wishlistService.ts
import { prisma } from '@/lib/prisma';
import { productService } from './productService';
import type { Product } from '@/lib/definitions';

type WishlistResponse = {
  wishlistItems: Product[];
  productIds: number[];
};

export const wishlistService = {
  async getWishlistByUserId(userId: number): Promise<WishlistResponse> {
    const items = await prisma.wishlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { productId: true },
    });

    const productIds = items.map(item => item.productId);

    if (productIds.length === 0) {
      return { wishlistItems: [], productIds: [] };
    }

    const wishlistItems = await productService.getProductsByIds(productIds);
    return { wishlistItems, productIds };
  },

  async toggleWishlist(userId: number, productId: number): Promise<'added' | 'removed'> {
    if (!productId) {
      throw new Error('El ID de producto es requerido.');
    }

    const existing = await prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (existing) {
      await prisma.wishlistItem.delete({
        where: { userId_productId: { userId, productId } },
      });
      return 'removed';
    } else {
      await prisma.wishlistItem.create({ data: { userId, productId } });
      return 'added';
    }
  },
};
