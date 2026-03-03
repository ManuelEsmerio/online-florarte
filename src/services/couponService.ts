// src/services/couponService.ts
import { prisma } from '@/lib/prisma';
import type { Coupon } from '@/lib/definitions';
import type { CouponScope, DiscountType, CouponStatus } from '@prisma/client';

type GetAllParams = {
  search: string;
  status: string[];
  page: number;
  limit: number;
  withDetails?: boolean;
};

type ValidateCouponParams = {
  couponCode: string;
  userId: number | null;
  sessionId: string | null;
  deliveryDate: string | null;
};

function normalizeCouponCode(value: unknown): string {
  return String(value ?? '').trim().toUpperCase();
}

const dbWithAudit = async <T>(userId: number, fn: () => Promise<T>): Promise<T> => fn();

function mapPrismaCoupon(row: {
  id: number; code: string; description: string;
  discountType: DiscountType; discountValue: any;
  validFrom: Date; validUntil: Date | null;
  status: CouponStatus; scope: CouponScope;
  maxUses: number | null; usesCount: number;
  isDeleted: boolean; createdAt: Date; updatedAt: Date;
}): Coupon {
  return {
    id: row.id,
    code: row.code,
    description: row.description,
    discountType: row.discountType,
    discountValue: Number(row.discountValue),
    validFrom: row.validFrom,
    validUntil: row.validUntil,
    status: row.status,
    scope: row.scope,
    maxUses: row.maxUses,
    usesCount: row.usesCount,
    isDeleted: row.isDeleted,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const couponService = {
  async getAllCoupons({ search, status, page, limit, withDetails = false }: GetAllParams) {
    const where: any = { isDeleted: false };
    if (search) {
      where.OR = [{ code: { contains: search } }, { description: { contains: search } }];
    }

    const [dbCoupons, total] = await Promise.all([
      prisma.coupon.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.coupon.count({ where }),
    ]);

    const coupons = await Promise.all(dbCoupons.map(async (dbCoupon) => {
      const coupon = mapPrismaCoupon(dbCoupon);
      if (withDetails) {
        const details: Coupon['details'] = {};
        if (coupon.scope === 'USERS') {
          const rows = await prisma.couponUser.findMany({ where: { couponId: coupon.id }, include: { user: { select: { id: true, name: true } } } });
          details.users = rows.map(r => ({ id: r.user.id, name: r.user.name }));
        }
        if (coupon.scope === 'PRODUCTS') {
          const rows = await prisma.couponProduct.findMany({ where: { couponId: coupon.id }, include: { product: { select: { id: true, name: true } } } });
          details.products = rows.map(r => ({ id: r.product.id, name: r.product.name }));
        }
        if (coupon.scope === 'CATEGORIES') {
          const rows = await prisma.couponCategory.findMany({ where: { couponId: coupon.id }, include: { category: { select: { id: true, name: true } } } });
          details.categories = rows.map(r => ({ id: r.category.id, name: r.category.name }));
        }
        return { ...coupon, details };
      }
      return coupon;
    }));

    return { coupons, total };
  },

  async getCouponById(id: number): Promise<Coupon | null> {
    const dbCoupon = await prisma.coupon.findUnique({ where: { id, isDeleted: false } });
    if (!dbCoupon) return null;

    const coupon = mapPrismaCoupon(dbCoupon);
    const [users, products, categories] = await Promise.all([
      coupon.scope === 'USERS' ? prisma.couponUser.findMany({ where: { couponId: id }, include: { user: { select: { id: true, name: true } } } }) : [],
      coupon.scope === 'PRODUCTS' ? prisma.couponProduct.findMany({ where: { couponId: id }, include: { product: { select: { id: true, name: true } } } }) : [],
      coupon.scope === 'CATEGORIES' ? prisma.couponCategory.findMany({ where: { couponId: id }, include: { category: { select: { id: true, name: true } } } }) : [],
    ]);

    return {
      ...coupon,
      details: {
        users: (users as any[]).map((r: any) => ({ id: r.user.id, name: r.user.name })),
        products: (products as any[]).map((r: any) => ({ id: r.product.id, name: r.product.name })),
        categories: (categories as any[]).map((r: any) => ({ id: r.category.id, name: r.category.name })),
      },
    };
  },

  async getCouponsByIds(ids: number[]): Promise<Coupon[]> {
    if (ids.length === 0) return [];
    const rows = await prisma.coupon.findMany({ where: { id: { in: ids }, isDeleted: false } });
    return rows.map(mapPrismaCoupon);
  },

  async getUserCoupons(userId: number): Promise<Coupon[]> {
    const rows = await prisma.coupon.findMany({
      where: {
        isDeleted: false, status: 'ACTIVE',
        OR: [
          { scope: 'GLOBAL' },
          { scope: 'USERS', couponUsers: { some: { userId } } },
          { scope: 'SPECIFIC', couponUsers: { some: { userId } } },
        ],
      },
    });
    return rows.map(mapPrismaCoupon);
  },

  async validateCoupon({ couponCode, userId, sessionId }: ValidateCouponParams): Promise<Coupon> {
    const normalizedCode = normalizeCouponCode(couponCode);
    if (!normalizedCode) {
      throw new Error('El código de cupón es requerido.');
    }

    const coupon = await prisma.coupon.findFirst({
      where: {
        code: normalizedCode,
        isDeleted: false,
      },
      include: {
        couponUsers: { select: { userId: true } },
        couponProducts: { select: { productId: true } },
        couponCategories: { select: { categoryId: true } },
      },
    });

    if (!coupon) throw new Error('El código de cupón no existe.');

    const now = new Date();
    if (coupon.status !== 'ACTIVE') throw new Error('Este cupón no está activo.');
    if (coupon.isDeleted) throw new Error('Este cupón no está disponible.');
    if (coupon.validFrom && now < coupon.validFrom) throw new Error('Este cupón aún no está vigente.');
    if (coupon.validUntil && now > coupon.validUntil) throw new Error('Este cupón ha expirado.');
    if (coupon.maxUses !== null && coupon.usesCount >= coupon.maxUses) throw new Error('Este cupón ha alcanzado su límite de usos.');

    const activeCart = await prisma.cart.findFirst({
      where: {
        status: 'ACTIVE',
        ...(userId ? { userId } : { sessionId: sessionId ?? undefined }),
      },
      include: {
        items: {
          select: {
            productId: true,
            product: {
              select: {
                categoryId: true,
              },
            },
          },
        },
      },
    });

    const cartItems = activeCart?.items ?? [];
    if (cartItems.length === 0) {
      throw new Error('Tu carrito está vacío. Agrega productos antes de aplicar un cupón.');
    }

    if (coupon.scope === 'USERS' || coupon.scope === 'SPECIFIC') {
      if (!userId) throw new Error('Debes iniciar sesión para usar este cupón.');

      const isLinkedToUser = coupon.couponUsers.some((link) => link.userId === userId);
      if (!isLinkedToUser) {
        throw new Error('Este cupón no es válido para tu cuenta.');
      }

      const alreadyUsedByUser = await prisma.order.findFirst({
        where: {
          userId,
          couponId: coupon.id,
          status: { not: 'CANCELLED' },
        },
        select: { id: true },
      });

      if (alreadyUsedByUser) {
        throw new Error('Este cupón ya fue utilizado por tu cuenta.');
      }
    }

    if (coupon.scope === 'PRODUCTS') {
      const allowedProductIds = new Set(coupon.couponProducts.map((row) => row.productId));
      const hasEligibleProduct = cartItems.some((item) => allowedProductIds.has(item.productId));
      if (!hasEligibleProduct) {
        throw new Error('Este cupón solo aplica para productos específicos de tu carrito.');
      }
    }

    if (coupon.scope === 'CATEGORIES') {
      const allowedCategoryIds = new Set(coupon.couponCategories.map((row) => row.categoryId));
      const hasEligibleCategory = cartItems.some((item) => item.product?.categoryId && allowedCategoryIds.has(item.product.categoryId));
      if (!hasEligibleCategory) {
        throw new Error('Este cupón solo aplica para categorías específicas de tu carrito.');
      }
    }

    return mapPrismaCoupon(coupon);
  },

  async createCoupon(data: any, creatorId: number): Promise<Coupon> {
    const created = await dbWithAudit(creatorId, () =>
      prisma.coupon.create({
        data: {
          code: data.p_code ?? data.code,
          description: data.p_description ?? data.description,
          discountType: ((data.p_discount_type ?? data.discount_type ?? 'FIXED') as string).toUpperCase() as DiscountType,
          discountValue: data.p_discount_value ?? data.discount_value,
          scope: ((data.p_scope ?? data.scope ?? 'GLOBAL') as string).toUpperCase() as CouponScope,
          maxUses: data.p_max_uses ?? data.max_uses ?? null,
          validFrom: new Date(data.p_valid_from ?? data.valid_from),
          validUntil: (data.p_valid_until ?? data.valid_until) ? new Date(data.p_valid_until ?? data.valid_until) : null,
        },
      })
    );
    return mapPrismaCoupon(created);
  },

  async updateCoupon(id: number, data: any, editorId: number): Promise<Coupon> {
    const updated = await dbWithAudit(editorId, () =>
      prisma.coupon.update({
        where: { id },
        data: {
          ...(data.code !== undefined && { code: data.code }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.discount_type !== undefined && { discountType: (data.discount_type as string).toUpperCase() as DiscountType }),
          ...(data.discount_value !== undefined && { discountValue: data.discount_value }),
          ...(data.scope !== undefined && { scope: (data.scope as string).toUpperCase() as CouponScope }),
          ...(data.max_uses !== undefined && { maxUses: data.max_uses }),
          ...(data.valid_from !== undefined && { validFrom: new Date(data.valid_from) }),
          ...(data.valid_until !== undefined && { validUntil: data.valid_until ? new Date(data.valid_until) : null }),
        },
      })
    );
    return mapPrismaCoupon(updated);
  },

  async deleteCoupon(id: number, deleterId: number): Promise<boolean> {
    await dbWithAudit(deleterId, () =>
      prisma.coupon.update({ where: { id }, data: { isDeleted: true } })
    );
    return true;
  },

  async bulkDeleteCoupons(ids: number[], deleterId: number): Promise<number> {
    const result = await dbWithAudit(deleterId, () =>
      prisma.coupon.updateMany({ where: { id: { in: ids } }, data: { isDeleted: true } })
    );
    return result.count;
  },
};
