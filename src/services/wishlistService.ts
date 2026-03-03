// src/services/wishlistService.ts
import { prisma } from '@/lib/prisma';
import { productService } from './productService';
import type { Product, ProductVariant } from '@/lib/definitions';

export type WishlistEntry = {
  id: number;
  productId: number;
  variantId: number | null;
  selectionKey: string;
  createdAt: Date;
  product: Product;
  variant?: ProductVariant | null;
};

type WishlistResponse = {
  wishlistItems: WishlistEntry[];
  productIds: number[];
};

const buildSelectionKey = (productId: number, variantId?: number | null) =>
  variantId ? `variant:${variantId}` : `product:${productId}`;

export const wishlistService = {
  async getWishlistByUserId(userId: number): Promise<WishlistResponse> {
    const items = await prisma.wishlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        productId: true,
        variantId: true,
        selectionKey: true,
        createdAt: true,
      },
    });

    if (items.length === 0) {
      return { wishlistItems: [], productIds: [] };
    }

    const uniqueProductIds = Array.from(new Set(items.map(item => item.productId)));
    const products = await productService.getProductsByIds(uniqueProductIds) as unknown as Product[];
    const productMap = new Map(products.map(product => [product.id, product]));

    const wishlistItems = items
      .map(item => {
        const product = productMap.get(item.productId);
        if (!product) return null;
        const variant = item.variantId
          ? product.variants?.find(v => Number(v.id) === Number(item.variantId)) ?? null
          : null;

        return {
          id: item.id,
          productId: item.productId,
          variantId: item.variantId ?? null,
          selectionKey: item.selectionKey,
          createdAt: item.createdAt,
          product,
          variant,
        } satisfies WishlistEntry;
      })
      .filter((entry): entry is WishlistEntry => Boolean(entry));

    return {
      wishlistItems,
      productIds: items.map(item => item.productId),
    };
  },

  async toggleWishlist(userId: number, productId: number, variantId?: number | null) {
    if (!productId) {
      throw new Error('El ID de producto es requerido.');
    }

    const selectionKey = buildSelectionKey(productId, variantId);

    const existing = await prisma.wishlistItem.findFirst({
      where: { userId, selectionKey },
    });

    if (existing) {
      await prisma.wishlistItem.delete({ where: { id: existing.id } });
      return { type: 'removed' as const, item: { ...existing, variantId: existing.variantId ?? null } };
    }

    const created = await prisma.wishlistItem.create({
      data: {
        userId,
        productId,
        variantId: variantId ?? null,
        selectionKey,
      },
    });

    return { type: 'added' as const, item: { ...created, variantId: created.variantId ?? null } };
  },
};
