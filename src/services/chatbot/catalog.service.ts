// src/services/chatbot/catalog.service.ts
// Fetches published products, occasions, and categories from DB for chatbot flows.

import { prisma } from '@/lib/prisma';

export const PAGE_SIZE = 3;
const MAX_CATALOG_OFFSET = 90; // 30 pages * 3 products per page

export function sanitizeCatalogOffset(value = 0): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(Math.floor(value), MAX_CATALOG_OFFSET));
}

export interface CatalogProduct {
  id: number;
  name: string;
  price: number;
  salePrice: number | null;
  slug: string;
  imageUrl: string | null;
}

export interface CatalogPage {
  products: CatalogProduct[];
  hasMore: boolean;
  nextOffset: number;
  currentOffset: number;
}

export interface CatalogOccasion {
  id:   number;
  name: string;
  slug: string;
}

export interface CatalogCategory {
  id:   number;
  name: string;
  slug: string;
}

const PRODUCT_SELECT = {
  id:        true,
  name:      true,
  price:     true,
  salePrice: true,
  slug:      true,
  images:    { select: { src: true }, take: 1, orderBy: { sortOrder: 'asc' as const } },
};

function mapProduct(p: { id: number; name: string; price: unknown; salePrice: unknown; slug: string; images: Array<{ src: string }> }): CatalogProduct {
  return {
    id:        p.id,
    name:      p.name,
    price:     Number(p.price),
    salePrice: p.salePrice ? Number(p.salePrice) : null,
    slug:      p.slug,
    imageUrl:  p.images[0]?.src ?? null,
  };
}

export const chatbotCatalogService = {
  /** Returns a paginated product page, optionally filtered by category and/or occasion. */
  async getPage(offset = 0, categoryId?: number, occasionId?: number): Promise<CatalogPage> {
    const safeOffset = sanitizeCatalogOffset(offset);
    const rows = await prisma.product.findMany({
      where: {
        status:    'PUBLISHED',
        isDeleted: false,
        ...(categoryId ? { categoryId } : {}),
        ...(occasionId ? { occasions: { some: { occasionId } } } : {}),
      },
      select:   PRODUCT_SELECT,
      orderBy:  [{ createdAt: 'desc' }],
      take:     PAGE_SIZE + 1,
      skip:     safeOffset,
    });

    const reachedLimit = safeOffset >= MAX_CATALOG_OFFSET;
    const hasMore = !reachedLimit && rows.length > PAGE_SIZE;
    const page    = rows.slice(0, PAGE_SIZE);

    return {
      products:      page.map(mapProduct),
      hasMore,
      nextOffset:    sanitizeCatalogOffset(safeOffset + PAGE_SIZE),
      currentOffset: safeOffset,
    };
  },

  async getBySlug(slug: string): Promise<CatalogProduct | null> {
    const p = await prisma.product.findFirst({
      where:  { slug, isDeleted: false },
      select: PRODUCT_SELECT,
    });
    if (!p) return null;
    return mapProduct(p);
  },

  /** Returns all active occasions that have at least one published product. */
  async getOccasions(): Promise<CatalogOccasion[]> {
    return prisma.occasion.findMany({
      where: {
        products: { some: { product: { status: 'PUBLISHED', isDeleted: false } } },
      },
      orderBy: [{ showOnHome: 'desc' }, { name: 'asc' }],
      select:  { id: true, name: true, slug: true },
    });
  },

  /**
   * Returns categories that have at least one published product.
   * When occasionId is provided, only returns categories with products for that occasion.
   */
  async getCategories(occasionId?: number): Promise<CatalogCategory[]> {
    return prisma.productCategory.findMany({
      where: {
        isDeleted: false,
        products: {
          some: {
            status:    'PUBLISHED',
            isDeleted: false,
            ...(occasionId ? { occasions: { some: { occasionId } } } : {}),
          },
        },
      },
      orderBy: { name: 'asc' },
      select:  { id: true, name: true, slug: true },
    });
  },
};
