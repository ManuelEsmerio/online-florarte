// src/repositories/wishlistRepository.ts
import { prisma } from '@/lib/prisma';

export const wishlistRepository = {

  async findProductIdsByUserId(userId: number): Promise<number[]> {
    const items = await prisma.wishlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { productId: true },
    });
    return items.map(item => item.productId);
  },

  async toggle(userId: number, productId: number): Promise<'added' | 'removed'> {
    const existing = await prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (existing) {
      await prisma.wishlistItem.delete({
        where: { userId_productId: { userId, productId } },
      });
      return 'removed';
    } else {
      await prisma.wishlistItem.create({
        data: { userId, productId },
      });
      return 'added';
    }
  },
};
