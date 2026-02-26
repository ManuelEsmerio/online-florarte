// src/services/productService.ts
import { prisma } from '@/lib/prisma';
import { Prisma, ProductStatus } from '@prisma/client';
import type { ProductStatus as ProductStatusType } from '@/lib/definitions';
import { getPublicUrlForPath } from '@/utils/file-utils';
import slugify from 'slugify';
import { deleteManagedFile, saveProductImage, saveProductVariantImage } from './file.service';

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
    short_description: p.shortDescription,
    price: Number(p.price),
    salePrice: p.salePrice != null ? Number(p.salePrice) : null,
    sale_price: p.salePrice != null ? Number(p.salePrice) : null,
    stock: p.stock,
    hasVariants: p.hasVariants,
    has_variants: p.hasVariants,
    status: p.status,
    care: p.care,
    mainImage: p.mainImage,
    image: p.mainImage,       // alias para compatibilidad con enrichProducts
    badgeText: p.badgeText,
    allowPhoto: p.allowPhoto,
    allow_photo: p.allowPhoto,
    photoPrice: p.photoPrice != null ? Number(p.photoPrice) : null,
    photo_price: p.photoPrice != null ? Number(p.photoPrice) : null,
    categoryId: p.categoryId,
    category_id: p.categoryId,
    category: p.category,
    isDeleted: p.isDeleted,
    is_deleted: p.isDeleted,
    createdAt: p.createdAt,
    created_at: p.createdAt,
    updatedAt: p.updatedAt,
    updated_at: p.updatedAt,
    images: p.images.map(img => ({
      id: img.id,
      src: img.src,
      alt: img.alt,
      isPrimary: img.isPrimary,
      is_primary: img.isPrimary,
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
      sale_price: v.salePrice != null ? Number(v.salePrice) : null,
      stock: v.stock,
      shortDescription: v.shortDescription,
      short_description: v.shortDescription,
      description: v.description,
      isDeleted: v.isDeleted,
      is_deleted: v.isDeleted,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
      images: v.images.map(img => ({
        id: img.id,
        src: img.src,
        alt: img.alt,
        isPrimary: img.isPrimary,
        is_primary: img.isPrimary,
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

function normalizeStatus(status: unknown): ProductStatus {
  if (typeof status !== 'string' || !status.trim()) return ProductStatus.DRAFT;
  const normalized = status.trim().toUpperCase();
  if (normalized === ProductStatus.PUBLISHED || normalized === ProductStatus.HIDDEN || normalized === ProductStatus.DRAFT) {
    return normalized as ProductStatus;
  }

  const map: Record<string, ProductStatus> = {
    PUBLICADO: ProductStatus.PUBLISHED,
    PUBLISHED: ProductStatus.PUBLISHED,
    OCULTO: ProductStatus.HIDDEN,
    HIDDEN: ProductStatus.HIDDEN,
    BORRADOR: ProductStatus.DRAFT,
    DRAFT: ProductStatus.DRAFT,
  };

  return map[normalized] ?? ProductStatus.DRAFT;
}

function toNumber(value: unknown, fallback = 0): number {
  if (value == null || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toNullableNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toInteger(value: unknown, fallback = 0): number {
  const parsed = Math.trunc(toNumber(value, fallback));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeBaseProductData(productData: any) {
  const name = String(productData?.name ?? '').trim();
  if (!name) throw new Error('El nombre del producto es obligatorio.');

  const generatedSlug = slugify(name, { lower: true, strict: true });

  return {
    name,
    slug: String(productData?.slug ?? generatedSlug).trim() || generatedSlug,
    code: String(productData?.code ?? '').trim(),
    description: productData?.description ?? null,
    shortDescription: productData?.shortDescription ?? productData?.short_description ?? null,
    price: toNumber(productData?.price, 0),
    salePrice: toNullableNumber(productData?.salePrice ?? productData?.sale_price),
    stock: toInteger(productData?.stock, 0),
    hasVariants: Boolean(productData?.hasVariants ?? productData?.has_variants),
    status: normalizeStatus(productData?.status),
    care: productData?.care ?? null,
    badgeText: productData?.badgeText ?? productData?.badge_text ?? null,
    allowPhoto: Boolean(productData?.allowPhoto ?? productData?.allow_photo),
    photoPrice: toNullableNumber(productData?.photoPrice ?? productData?.photo_price),
    categoryId: toInteger(productData?.categoryId ?? productData?.category_id),
    mainImage: productData?.mainImage ?? productData?.main_image ?? productData?.image ?? null,
    tagIds: Array.isArray(productData?.tagIds ?? productData?.tag_ids)
      ? (productData?.tagIds ?? productData?.tag_ids).map((id: any) => toInteger(id)).filter((id: number) => id > 0)
      : [],
    occasionIds: Array.isArray(productData?.occasionIds ?? productData?.occasion_ids)
      ? (productData?.occasionIds ?? productData?.occasion_ids).map((id: any) => toInteger(id)).filter((id: number) => id > 0)
      : [],
    specifications: Array.isArray(productData?.specifications) ? productData.specifications : [],
    variants: Array.isArray(productData?.variants) ? productData.variants : [],
  };
}

async function syncProductMainImages(
  tx: Prisma.TransactionClient,
  productId: number,
  productName: string,
  imageFiles: File[],
): Promise<string | null> {
  const existingImages = await tx.productImage.findMany({
    where: { productId, variantId: null },
  });

  if (existingImages.length > 0) {
    for (const img of existingImages) {
      await deleteManagedFile(img.src);
    }
    await tx.productImage.deleteMany({ where: { productId, variantId: null } });
  }

  if (imageFiles.length === 0) {
    return null;
  }

  const uploadedSources: string[] = [];
  for (let i = 0; i < imageFiles.length; i += 1) {
    const file = imageFiles[i];
    const src = await saveProductImage(file, productId);
    uploadedSources.push(src);

    await tx.productImage.create({
      data: {
        productId,
        src,
        alt: productName,
        isPrimary: i === 0,
        sortOrder: i,
      },
    });
  }

  return uploadedSources[0] ?? null;
}

async function syncVariantImages(
  tx: Prisma.TransactionClient,
  productId: number,
  variantId: number,
  variantName: string,
  files: File[],
): Promise<void> {
  const existing = await tx.productImage.findMany({ where: { variantId } });
  if (existing.length > 0) {
    for (const img of existing) {
      await deleteManagedFile(img.src);
    }
    await tx.productImage.deleteMany({ where: { variantId } });
  }

  for (let i = 0; i < files.length; i += 1) {
    const src = await saveProductVariantImage(files[i], productId, variantId);
    await tx.productImage.create({
      data: {
        variantId,
        src,
        alt: variantName,
        isPrimary: i === 0,
        sortOrder: i,
      },
    });
  }
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

    // Una sola query: trae la categoría con sus hijos (evita la segunda query secuencial)
    const category = await prisma.productCategory.findUnique({
      where: { slug: categorySlug },
      select: { id: true, children: { where: { isDeleted: false }, select: { id: true } } },
    });
    if (!category) return { products: [], total: 0 };

    const categoryIds = [category.id, ...category.children.map(c => c.id)];
    const where: Prisma.ProductWhereInput = {
      categoryId: { in: categoryIds },
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

    const subcategoryIds = subcategories.map((sub) => sub.id);
    if (subcategoryIds.length === 0) {
      return [];
    }

    // Una query por subcategoría con take:1 y skip aleatorio — evita cargar todo el catálogo en memoria
    const selected = await Promise.all(
      subcategoryIds.map(async (subId) => {
        const where = { categoryId: subId, status: ProductStatus.PUBLISHED, isDeleted: false };
        const count = await prisma.product.count({ where });
        if (count === 0) return null;
        const skip = Math.floor(Math.random() * count);
        const [product] = await prisma.product.findMany({ where, include: PRODUCT_INCLUDE, take: 1, skip });
        return product ?? null;
      })
    );

    const nonNull = selected.filter((p): p is NonNullable<typeof p> => p !== null);

    if (nonNull.length === 0) {
      const fallback = await prisma.product.findMany({
        where: { category: { parentId: COMPLEMENT_PARENT_ID }, status: ProductStatus.PUBLISHED, isDeleted: false },
        include: PRODUCT_INCLUDE,
        take: 10,
      });
      return enrichProducts(fallback.map(mapProduct));
    }

    return enrichProducts(nonNull.map(mapProduct));
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

  async bulkUpdateStatus(slugs: string[], status: ProductStatusType, _editorId: number) {
    const normalizedStatus = normalizeStatus(status);
    await prisma.product.updateMany({
      where: { slug: { in: slugs }, isDeleted: false },
      data: { status: normalizedStatus },
    });
    return true;
  },

  async bulkSoftDelete(slugs: string[], _deleterId: number) {
    const result = await prisma.product.updateMany({
      where: { slug: { in: slugs }, isDeleted: false },
      data: { isDeleted: true, deletedAt: new Date() },
    });
    return result.count;
  },

  async createProduct(productData: any, imageFiles: { main: File[]; variants: { index: number; files: File[] }[] }, _creatorId: number): Promise<any> {
    const normalized = normalizeBaseProductData(productData);
    if (!normalized.slug) {
      throw new Error('No se pudo generar un slug válido para el producto.');
    }
    if (!normalized.code) {
      normalized.code = `PROD-${Date.now()}`;
    }
    if (!normalized.categoryId) {
      throw new Error('La categoría del producto es obligatoria.');
    }

    const createdProduct = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: normalized.name,
          slug: normalized.slug,
          code: normalized.code,
          description: normalized.description,
          shortDescription: normalized.shortDescription,
          price: normalized.price,
          salePrice: normalized.salePrice,
          stock: normalized.stock,
          hasVariants: normalized.hasVariants,
          status: normalized.status,
          care: normalized.care,
          mainImage: normalized.mainImage,
          badgeText: normalized.badgeText,
          allowPhoto: normalized.allowPhoto,
          photoPrice: normalized.photoPrice,
          categoryId: normalized.categoryId,
        },
      });

      if (imageFiles?.main?.length) {
        const mainImage = await syncProductMainImages(tx, product.id, product.name, imageFiles.main);
        await tx.product.update({
          where: { id: product.id },
          data: { mainImage },
        });
      }

      if (normalized.specifications.length > 0) {
        await tx.productSpecification.createMany({
          data: normalized.specifications
            .map((spec: any, index: number) => ({
              productId: product.id,
              key: String(spec?.key ?? '').trim(),
              value: String(spec?.value ?? '').trim(),
              sortOrder: toInteger(spec?.sortOrder ?? spec?.sort_order, index),
            }))
            .filter((spec) => spec.key && spec.value),
        });
      }

      if (normalized.tagIds.length > 0) {
        await tx.productTag.createMany({
          data: Array.from(new Set(normalized.tagIds)).map((tagId) => ({ productId: product.id, tagId })),
          skipDuplicates: true,
        });
      }

      if (normalized.occasionIds.length > 0) {
        await tx.productOccasion.createMany({
          data: Array.from(new Set(normalized.occasionIds)).map((occasionId) => ({ productId: product.id, occasionId })),
          skipDuplicates: true,
        });
      }

      if (normalized.hasVariants && normalized.variants.length > 0) {
        for (let idx = 0; idx < normalized.variants.length; idx += 1) {
          const variantInput = normalized.variants[idx];
          if (variantInput?.is_deleted || variantInput?.isDeleted) continue;

          const variant = await tx.productVariant.create({
            data: {
              productId: product.id,
              name: String(variantInput?.name ?? '').trim() || `Variante ${idx + 1}`,
              code: variantInput?.code ? String(variantInput.code).trim() : null,
              price: toNumber(variantInput?.price, normalized.price),
              salePrice: toNullableNumber(variantInput?.salePrice ?? variantInput?.sale_price),
              stock: toInteger(variantInput?.stock, 0),
              shortDescription: variantInput?.shortDescription ?? variantInput?.short_description ?? null,
              description: variantInput?.description ?? null,
            },
          });

          const variantFiles = imageFiles?.variants?.find((entry) => entry.index === idx)?.files ?? [];
          if (variantFiles.length > 0) {
            await syncVariantImages(tx, product.id, variant.id, variant.name, variantFiles);
          }

          const variantSpecs = Array.isArray(variantInput?.specifications) ? variantInput.specifications : [];
          if (variantSpecs.length > 0) {
            await tx.productSpecification.createMany({
              data: variantSpecs
                .map((spec: any, specIdx: number) => ({
                  variantId: variant.id,
                  key: String(spec?.key ?? '').trim(),
                  value: String(spec?.value ?? '').trim(),
                  sortOrder: toInteger(spec?.sortOrder ?? spec?.sort_order, specIdx),
                }))
                .filter((spec) => spec.key && spec.value),
            });
          }
        }
      }

      return tx.product.findUniqueOrThrow({ where: { id: product.id } });
    });

    return {
      id: createdProduct.id,
      slug: createdProduct.slug,
      code: createdProduct.code,
      result: 'success',
      message: 'Producto creado correctamente.',
    };
  },

  async updateProduct(slug: string, productData: any, imageFiles: { main: File[]; variants: { index: number; files: File[] }[] }, _editorId: number): Promise<any> {
    const existing = await prisma.product.findUnique({
      where: { slug },
      include: {
        variants: {
          where: { isDeleted: false },
          include: { images: true },
        },
        images: { where: { variantId: null } },
      },
    });
    if (!existing || existing.isDeleted) {
      throw new Error('Producto no encontrado.');
    }

    const normalized = normalizeBaseProductData(productData);
    const targetSlug = normalized.slug || existing.slug;

    const updatedProduct = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id: existing.id },
        data: {
          name: normalized.name,
          slug: targetSlug,
          code: normalized.code || existing.code,
          description: normalized.description,
          shortDescription: normalized.shortDescription,
          price: normalized.price,
          salePrice: normalized.salePrice,
          stock: normalized.stock,
          hasVariants: normalized.hasVariants,
          status: normalized.status,
          care: normalized.care,
          badgeText: normalized.badgeText,
          allowPhoto: normalized.allowPhoto,
          photoPrice: normalized.photoPrice,
          categoryId: normalized.categoryId || existing.categoryId,
        },
      });

      if (imageFiles?.main?.length) {
        const mainImage = await syncProductMainImages(tx, updated.id, normalized.name, imageFiles.main);
        await tx.product.update({ where: { id: updated.id }, data: { mainImage } });
      }

      await tx.productSpecification.deleteMany({ where: { productId: updated.id } });
      if (normalized.specifications.length > 0) {
        await tx.productSpecification.createMany({
          data: normalized.specifications
            .map((spec: any, index: number) => ({
              productId: updated.id,
              key: String(spec?.key ?? '').trim(),
              value: String(spec?.value ?? '').trim(),
              sortOrder: toInteger(spec?.sortOrder ?? spec?.sort_order, index),
            }))
            .filter((spec) => spec.key && spec.value),
        });
      }

      await tx.productTag.deleteMany({ where: { productId: updated.id } });
      if (normalized.tagIds.length > 0) {
        await tx.productTag.createMany({
          data: Array.from(new Set(normalized.tagIds)).map((tagId) => ({ productId: updated.id, tagId })),
          skipDuplicates: true,
        });
      }

      await tx.productOccasion.deleteMany({ where: { productId: updated.id } });
      if (normalized.occasionIds.length > 0) {
        await tx.productOccasion.createMany({
          data: Array.from(new Set(normalized.occasionIds)).map((occasionId) => ({ productId: updated.id, occasionId })),
          skipDuplicates: true,
        });
      }

      const variantPayload = normalized.hasVariants
        ? normalized.variants.filter((variant: any) => !(variant?.is_deleted || variant?.isDeleted))
        : [];

      const processedVariantIds = new Set<number>();

      for (let idx = 0; idx < variantPayload.length; idx += 1) {
        const variantInput = variantPayload[idx];
        const incomingId = toInteger(variantInput?.id, 0);
        const sameProductVariant = incomingId
          ? await tx.productVariant.findFirst({ where: { id: incomingId, productId: updated.id } })
          : null;

        const variant = sameProductVariant
          ? await tx.productVariant.update({
              where: { id: sameProductVariant.id },
              data: {
                name: String(variantInput?.name ?? '').trim() || sameProductVariant.name,
                code: variantInput?.code ? String(variantInput.code).trim() : null,
                price: toNumber(variantInput?.price, normalized.price),
                salePrice: toNullableNumber(variantInput?.salePrice ?? variantInput?.sale_price),
                stock: toInteger(variantInput?.stock, 0),
                shortDescription: variantInput?.shortDescription ?? variantInput?.short_description ?? null,
                description: variantInput?.description ?? null,
                isDeleted: false,
              },
            })
          : await tx.productVariant.create({
              data: {
                productId: updated.id,
                name: String(variantInput?.name ?? '').trim() || `Variante ${idx + 1}`,
                code: variantInput?.code ? String(variantInput.code).trim() : null,
                price: toNumber(variantInput?.price, normalized.price),
                salePrice: toNullableNumber(variantInput?.salePrice ?? variantInput?.sale_price),
                stock: toInteger(variantInput?.stock, 0),
                shortDescription: variantInput?.shortDescription ?? variantInput?.short_description ?? null,
                description: variantInput?.description ?? null,
              },
            });

        processedVariantIds.add(variant.id);

        const variantFiles = imageFiles?.variants?.find((entry) => entry.index === idx)?.files ?? [];
        if (variantFiles.length > 0) {
          await syncVariantImages(tx, updated.id, variant.id, variant.name, variantFiles);
        }

        await tx.productSpecification.deleteMany({ where: { variantId: variant.id } });
        const variantSpecs = Array.isArray(variantInput?.specifications) ? variantInput.specifications : [];
        if (variantSpecs.length > 0) {
          await tx.productSpecification.createMany({
            data: variantSpecs
              .map((spec: any, specIdx: number) => ({
                variantId: variant.id,
                key: String(spec?.key ?? '').trim(),
                value: String(spec?.value ?? '').trim(),
                sortOrder: toInteger(spec?.sortOrder ?? spec?.sort_order, specIdx),
              }))
              .filter((spec) => spec.key && spec.value),
          });
        }
      }

      if (!normalized.hasVariants) {
        const existingVariantImages = await tx.productImage.findMany({ where: { productId: updated.id, variantId: { not: null } } });
        for (const image of existingVariantImages) {
          await deleteManagedFile(image.src);
        }
        await tx.productImage.deleteMany({ where: { productId: updated.id, variantId: { not: null } } });
        await tx.productVariant.updateMany({ where: { productId: updated.id }, data: { isDeleted: true } });
      } else {
        await tx.productVariant.updateMany({
          where: {
            productId: updated.id,
            id: { notIn: Array.from(processedVariantIds.values()) },
          },
          data: { isDeleted: true },
        });
      }

      return tx.product.findUniqueOrThrow({ where: { id: updated.id } });
    });

    return {
      id: updatedProduct.id,
      slug: updatedProduct.slug,
      code: updatedProduct.code,
      result: 'success',
      message: 'Producto actualizado correctamente.',
    };
  },
};
