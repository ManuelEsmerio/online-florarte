// src/services/productService.ts
import { prisma } from '@/lib/prisma';
import { Prisma, ProductStatus } from '@prisma/client';
import type { ProductStatus as ProductStatusType } from '@/lib/definitions';
import { getPublicUrlForPath } from '@/utils/file-utils';

// ────────────────────────────────────────────────────────────
// Include reutilizable con todas las relaciones de un producto
// ────────────────────────────────────────────────────────────
const PRODUCT_INCLUDE = {
  category: true,
  images: { orderBy: { sortOrder: 'asc' as const } },
  specifications: { orderBy: { sortOrder: 'asc' as const } },
  tags: { include: { tag: true } },
  occasions: { include: { occasion: true } },
  variants: {
    where: { isDeleted: false },
    include: {
      images: { orderBy: { sortOrder: 'asc' as const } },
      specifications: { orderBy: { sortOrder: 'asc' as const } },
    },
    orderBy: { id: 'asc' as const },
  },
} satisfies Prisma.ProductInclude;

type PrismaProduct = Prisma.ProductGetPayload<{ include: typeof PRODUCT_INCLUDE }>;

// ────────────────────────────────────────────────────────────
// Mapea el objeto Prisma al formato esperado por las rutas
// ────────────────────────────────────────────────────────────
function mapProduct(p: PrismaProduct) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    code: p.code,
    description: p.description,
    shortDescription: p.shortDescription,
    price: Number(p.price),
    salePrice: p.salePrice != null ? Number(p.salePrice) : null,
    stock: p.stock,
    hasVariants: p.hasVariants,
    status: p.status,
    care: p.care,
    mainImage: p.mainImage,
    image: p.mainImage,       // alias para compatibilidad con enrichProducts
    badgeText: p.badgeText,
    allowPhoto: p.allowPhoto,
    photoPrice: p.photoPrice != null ? Number(p.photoPrice) : null,
    categoryId: p.categoryId,
    category: p.category,
    isDeleted: p.isDeleted,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    images: p.images.map(img => ({
      id: img.id,
      src: img.src,
      alt: img.alt,
      isPrimary: img.isPrimary,
      sortOrder: img.sortOrder,
    })),
    specifications: p.specifications.map(s => ({
      key: s.key,
      value: s.value,
      sortOrder: s.sortOrder,
    })),
    tags: p.tags.map(pt => pt.tag),
    occasions: p.occasions.map(po => po.occasion),
    variants: p.variants.map(v => ({
      id: v.id,
      name: v.name,
      code: v.code,
      price: Number(v.price),
      salePrice: v.salePrice != null ? Number(v.salePrice) : null,
      stock: v.stock,
      shortDescription: v.shortDescription,
      description: v.description,
      images: v.images.map(img => ({
        id: img.id,
        src: img.src,
        alt: img.alt,
        isPrimary: img.isPrimary,
        sortOrder: img.sortOrder,
      })),
      specifications: v.specifications.map(s => ({
        key: s.key,
        value: s.value,
        sortOrder: s.sortOrder,
      })),
    })),
  };
}

// ────────────────────────────────────────────────────────────
// Procesa las URLs de imágenes (local paths → public URLs)
// ────────────────────────────────────────────────────────────
function enrichProducts(products: ReturnType<typeof mapProduct>[]) {
  return products.map(p => ({
    ...p,
    mainImage: getPublicUrlForPath(p.mainImage),
    image: getPublicUrlForPath(p.mainImage),
    images: p.images.map(img => ({ ...img, src: getPublicUrlForPath(img.src) })),
    variants: p.variants.map(v => ({
      ...v,
      images: v.images.map(img => ({ ...img, src: getPublicUrlForPath(img.src) })),
    })),
  }));
}

// ────────────────────────────────────────────────────────────
// Servicio
// ────────────────────────────────────────────────────────────
export const productService = {

  async getAdminProductList() {
    const [dbProducts, categories, occasions, tags] = await Promise.all([
      prisma.product.findMany({
        where: { isDeleted: false },
        include: PRODUCT_INCLUDE,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.productCategory.findMany({ where: { isDeleted: false }, orderBy: { id: 'asc' } }),
      prisma.occasion.findMany({ orderBy: { id: 'asc' } }),
      prisma.tag.findMany({ orderBy: { id: 'asc' } }),
    ]);

    const products = enrichProducts(dbProducts.map(mapProduct));
    return { products, categories, occasions, tags };
  },

  async getPublishedProducts(page = 1, limit = 25) {
    const offset = (page - 1) * limit;
    const where: Prisma.ProductWhereInput = { status: ProductStatus.PUBLISHED, isDeleted: false };

    const [dbProducts, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: PRODUCT_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return { products: enrichProducts(dbProducts.map(mapProduct)), total };
  },

  async getPublishedProductsByCategory(categorySlug: string, page = 1, limit = 25) {
    const offset = (page - 1) * limit;

    const category = await prisma.productCategory.findUnique({ where: { slug: categorySlug } });
    if (!category) return { products: [], total: 0 };

    const subcategoryIds = await prisma.productCategory
      .findMany({ where: { parentId: category.id, isDeleted: false }, select: { id: true } })
      .then(subs => subs.map(s => s.id));

    const where: Prisma.ProductWhereInput = {
      categoryId: { in: [category.id, ...subcategoryIds] },
      status: ProductStatus.PUBLISHED,
      isDeleted: false,
    };

    const [dbProducts, total] = await Promise.all([
      prisma.product.findMany({ where, include: PRODUCT_INCLUDE, orderBy: { createdAt: 'desc' }, skip: offset, take: limit }),
      prisma.product.count({ where }),
    ]);

    return { products: enrichProducts(dbProducts.map(mapProduct)), total };
  },

  async getProductsByIds(productIds: number[]) {
    if (productIds.length === 0) return [];
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds }, isDeleted: false },
      include: PRODUCT_INCLUDE,
    });
    return enrichProducts(dbProducts.map(mapProduct));
  },

  async getCompleteProductDetailsBySlug(slug: string) {
    const dbProduct = await prisma.product.findFirst({
      where: { slug, isDeleted: false },
      include: PRODUCT_INCLUDE,
    });
    if (!dbProduct) return null;
    const [enriched] = enrichProducts([mapProduct(dbProduct)]);
    return enriched;
  },

  async getCompleteProductDetailsById(id: number) {
    const dbProduct = await prisma.product.findFirst({
      where: { id, isDeleted: false },
      include: PRODUCT_INCLUDE,
    });
    if (!dbProduct) return null;
    const [enriched] = enrichProducts([mapProduct(dbProduct)]);
    return enriched;
  },

  async getRecommendedProducts(limit = 8, excludeSlug?: string) {
    const whereBase: Prisma.ProductWhereInput = {
      status: ProductStatus.PUBLISHED,
      isDeleted: false,
      ...(excludeSlug ? { slug: { not: excludeSlug } } : {}),
    };

    // Primero: productos con tag "Más Vendido" (id=1)
    const featured = await prisma.product.findMany({
      where: { ...whereBase, tags: { some: { tagId: 1 } } },
      include: PRODUCT_INCLUDE,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    if (featured.length >= limit) {
      return enrichProducts(featured.map(mapProduct));
    }

    // Rellena con productos restantes si no hay suficientes
    const rest = await prisma.product.findMany({
      where: { ...whereBase, NOT: { tags: { some: { tagId: 1 } } } },
      include: PRODUCT_INCLUDE,
      take: limit - featured.length,
      orderBy: { createdAt: 'desc' },
    });

    return enrichProducts([...featured, ...rest].map(mapProduct));
  },

  async findRelatedProducts(categoryId: number, excludeProductId: number, limit = 6) {
    const dbProducts = await prisma.product.findMany({
      where: {
        categoryId,
        id: { not: excludeProductId },
        status: ProductStatus.PUBLISHED,
        isDeleted: false,
      },
      include: PRODUCT_INCLUDE,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
    return enrichProducts(dbProducts.map(mapProduct));
  },

  async findComplementProducts(mainProduct: any) {
    const COMPLEMENT_PARENT_ID = 5;

    const subcategories = await prisma.productCategory.findMany({
      where: { parentId: COMPLEMENT_PARENT_ID, isDeleted: false },
      select: { id: true },
    });

    const results: ReturnType<typeof mapProduct>[] = [];
    for (const sub of subcategories) {
      const dbProduct = await prisma.product.findFirst({
        where: { categoryId: sub.id, status: ProductStatus.PUBLISHED, isDeleted: false },
        include: PRODUCT_INCLUDE,
      });
      if (dbProduct) results.push(mapProduct(dbProduct));
    }

    if (results.length === 0) {
      const fallback = await prisma.product.findMany({
        where: { category: { parentId: COMPLEMENT_PARENT_ID }, status: ProductStatus.PUBLISHED, isDeleted: false },
        include: PRODUCT_INCLUDE,
        take: 10,
      });
      return enrichProducts(fallback.map(mapProduct));
    }

    return enrichProducts(results);
  },

  async getComplementProducts() {
    const dbProducts = await prisma.product.findMany({
      where: {
        category: { parentId: 5 },
        status: ProductStatus.PUBLISHED,
        isDeleted: false,
      },
      include: PRODUCT_INCLUDE,
      take: 10,
    });
    return enrichProducts(dbProducts.map(mapProduct));
  },

  async updateProductStatus(slug: string, status: ProductStatusType, _editorId: number) {
    const result = await prisma.product.update({
      where: { slug },
      data: { status: status as ProductStatus },
    });
    return !!result;
  },

  async softDeleteProduct(slug: string, _deleterId: number) {
    const product = await prisma.product.findUnique({ where: { slug } });
    if (!product) throw new Error('Producto no encontrado.');
    await prisma.product.update({ where: { slug }, data: { isDeleted: true, deletedAt: new Date() } });
    return true;
  },

  // Stubs para operaciones de admin (pendientes de implementar con subida de archivos)
  async createProduct(_productData: any, _imageFiles: any, _creatorId: number): Promise<any> {
    throw new Error('createProduct: not implemented');
  },

  async updateProduct(_slug: string, _productData: any, _imageFiles: any, _editorId: number): Promise<any> {
    throw new Error('updateProduct: not implemented');
  },
};
