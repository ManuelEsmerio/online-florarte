// src/services/couponService.ts
import { prisma } from '@/lib/prisma';
import { UserFacingError } from '@/utils/errors';
import type { Coupon } from '@/lib/definitions';
import type { CouponScope, DiscountType, CouponStatus } from '@prisma/client';

const VALID_SCOPES: CouponScope[] = ['GLOBAL', 'USERS', 'CATEGORIES', 'PRODUCTS', 'SPECIFIC'];
const USER_SCOPES = new Set<CouponScope>(['USERS', 'SPECIFIC']);
const PRODUCT_SCOPES = new Set<CouponScope>(['PRODUCTS']);
const CATEGORY_SCOPES = new Set<CouponScope>(['CATEGORIES']);
const VALID_DISCOUNT_TYPES: DiscountType[] = ['PERCENTAGE', 'FIXED'];
const VALID_STATUSES: CouponStatus[] = ['ACTIVE', 'EXPIRED', 'USED', 'PAUSED'];

type ScopeAssignments = {
  userIds: number[];
  productIds: number[];
  categoryIds: number[];
};

type ExistingCouponRecord = {
  id: number;
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: any;
  validFrom: Date;
  validUntil: Date | null;
  status: CouponStatus;
  scope: CouponScope;
  maxUses: number | null;
  usesCount: number;
  couponUsers?: { userId: number }[];
  couponProducts?: { productId: number }[];
  couponCategories?: { categoryId: number }[];
};

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

function firstDefined<T>(...values: Array<T | undefined>): T | undefined {
  for (const value of values) {
    if (value !== undefined) return value;
  }
  return undefined;
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value as any);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeScopeValue(value: unknown, fallback: CouponScope = 'GLOBAL'): CouponScope {
  if (typeof value === 'string') {
    const upper = value.trim().toUpperCase();
    if ((VALID_SCOPES as string[]).includes(upper)) {
      return upper as CouponScope;
    }
  }
  return fallback;
}

function normalizeDiscountTypeValue(value: unknown, fallback: DiscountType = 'FIXED'): DiscountType {
  if (typeof value === 'string') {
    const upper = value.trim().toUpperCase();
    if ((VALID_DISCOUNT_TYPES as string[]).includes(upper)) {
      return upper as DiscountType;
    }
  }
  return fallback;
}

function normalizeStatusValue(value: unknown, fallback: CouponStatus = 'ACTIVE'): CouponStatus {
  if (typeof value === 'string') {
    const upper = value.trim().toUpperCase();
    if ((VALID_STATUSES as string[]).includes(upper)) {
      return upper as CouponStatus;
    }
  }
  return fallback;
}

function parseIdList(value: unknown): number[] {
  if (Array.isArray(value)) {
    return Array.from(new Set(value.map((v) => Number(v)).filter((v) => Number.isInteger(v) && v > 0)));
  }
  if (typeof value === 'string') {
    return parseIdList(value.split(',').map((part) => part.trim()).filter(Boolean));
  }
  return [];
}

function normalizeScopeAssignments(scope: CouponScope, payload: any, current?: ExistingCouponRecord): ScopeAssignments {
  const rawUserIds = firstDefined(
    payload.user_ids,
    payload.userIds,
    payload.users,
    USER_SCOPES.has(scope) ? current?.couponUsers?.map((link) => link.userId) : undefined,
  );
  const rawProductIds = firstDefined(
    payload.product_ids,
    payload.productIds,
    payload.products,
    PRODUCT_SCOPES.has(scope) ? current?.couponProducts?.map((link) => link.productId) : undefined,
  );
  const rawCategoryIds = firstDefined(
    payload.category_ids,
    payload.categoryIds,
    payload.categories,
    CATEGORY_SCOPES.has(scope) ? current?.couponCategories?.map((link) => link.categoryId) : undefined,
  );

  const userIds = USER_SCOPES.has(scope) ? parseIdList(rawUserIds) : [];
  const productIds = PRODUCT_SCOPES.has(scope) ? parseIdList(rawProductIds) : [];
  const categoryIds = CATEGORY_SCOPES.has(scope) ? parseIdList(rawCategoryIds) : [];

  if (USER_SCOPES.has(scope) && userIds.length === 0) {
    throw new UserFacingError('Debes asignar al menos un usuario a este cupón.');
  }
  if (scope === 'SPECIFIC' && userIds.length !== 1) {
    throw new UserFacingError('Los cupones específicos requieren exactamente un usuario asignado.');
  }
  if (scope === 'PRODUCTS' && productIds.length === 0) {
    throw new UserFacingError('Debes asignar al menos un producto a este cupón.');
  }
  if (scope === 'CATEGORIES' && categoryIds.length === 0) {
    throw new UserFacingError('Debes asignar al menos una categoría a este cupón.');
  }

  return { userIds, productIds, categoryIds };
}

function normalizeCouponMutationPayload(payload: any, current?: ExistingCouponRecord) {
  const scope = normalizeScopeValue(firstDefined(payload.scope, payload.p_scope, current?.scope));
  const status = normalizeStatusValue(firstDefined(payload.status, payload.p_status, current?.status ?? 'ACTIVE'));

  const code = normalizeCouponCode(firstDefined(payload.code, payload.p_code, current?.code) ?? '');
  if (!code) {
    throw new UserFacingError('El código del cupón es obligatorio.');
  }

  const description = String(firstDefined(payload.description, payload.p_description, current?.description) ?? '').trim();
  if (!description) {
    throw new UserFacingError('La descripción del cupón es obligatoria.');
  }

  const discountType = normalizeDiscountTypeValue(firstDefined(payload.discount_type, payload.p_discount_type, current?.discountType));
  const discountValueRaw = Number(firstDefined(payload.discount_value, payload.p_discount_value, current?.discountValue));
  if (!Number.isFinite(discountValueRaw) || discountValueRaw <= 0) {
    throw new UserFacingError('El valor del descuento debe ser un número positivo.');
  }
  if (discountType === 'PERCENTAGE' && discountValueRaw > 99) {
    throw new UserFacingError('El porcentaje de descuento no puede superar el 99%.');
  }

  const validFrom = toDate(firstDefined(payload.valid_from, payload.p_valid_from, current?.validFrom, new Date()));
  if (!validFrom) {
    throw new UserFacingError('La fecha de inicio del cupón es inválida.');
  }

  const validUntilRaw = firstDefined(payload.valid_until, payload.p_valid_until, current?.validUntil ?? null);
  const validUntil = validUntilRaw ? toDate(validUntilRaw) : null;
  if (validUntil && validUntil < validFrom) {
    throw new UserFacingError('La fecha de vencimiento debe ser posterior a la fecha de inicio.');
  }

  const maxUsesInput = firstDefined(payload.max_uses, payload.p_max_uses, payload.maxUses, current?.maxUses ?? null);
  let maxUses: number | null = null;
  if (maxUsesInput !== null && maxUsesInput !== '' && maxUsesInput !== undefined) {
    const parsedMax = Number(maxUsesInput);
    if (!Number.isInteger(parsedMax) || parsedMax < 0) {
      throw new UserFacingError('El límite de usos debe ser un número entero positivo.');
    }
    maxUses = parsedMax;
  }
  if (current && maxUses !== null && current.usesCount > maxUses) {
    throw new UserFacingError('El límite de usos no puede ser menor a los usos registrados.');
  }

  const scopeAssignments = normalizeScopeAssignments(scope, payload, current);

  return {
    scope,
    couponData: {
      code,
      description,
      discountType,
      discountValue: discountValueRaw,
      validFrom,
      validUntil,
      status,
      scope,
      maxUses,
    },
    scopeAssignments,
  };
}

async function syncScopeAssignments(tx: any, couponId: number, scope: CouponScope, assignments: ScopeAssignments) {
  await Promise.all([
    tx.couponUser.deleteMany({ where: { couponId } }),
    tx.couponProduct.deleteMany({ where: { couponId } }),
    tx.couponCategory.deleteMany({ where: { couponId } }),
  ]);

  if (USER_SCOPES.has(scope) && assignments.userIds.length) {
    await tx.couponUser.createMany({ data: assignments.userIds.map((userId) => ({ couponId, userId })), skipDuplicates: true });
  }
  if (PRODUCT_SCOPES.has(scope) && assignments.productIds.length) {
    await tx.couponProduct.createMany({ data: assignments.productIds.map((productId) => ({ couponId, productId })), skipDuplicates: true });
  }
  if (CATEGORY_SCOPES.has(scope) && assignments.categoryIds.length) {
    await tx.couponCategory.createMany({ data: assignments.categoryIds.map((categoryId) => ({ couponId, categoryId })), skipDuplicates: true });
  }
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
    if (status && status.length) {
      const normalizedStatuses = status
        .map((value) => String(value ?? '').trim().toUpperCase())
        .filter((value): value is CouponStatus => (VALID_STATUSES as string[]).includes(value));
      if (normalizedStatuses.length) {
        where.status = { in: normalizedStatuses };
      }
    }

    const [dbCoupons, total] = await Promise.all([
      prisma.coupon.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.coupon.count({ where }),
    ]);

    const coupons = await Promise.all(dbCoupons.map(async (dbCoupon) => {
      const coupon = mapPrismaCoupon(dbCoupon);
      if (withDetails) {
        const details: Coupon['details'] = {};
        if (coupon.scope === 'USERS' || coupon.scope === 'SPECIFIC') {
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
      (coupon.scope === 'USERS' || coupon.scope === 'SPECIFIC') ? prisma.couponUser.findMany({ where: { couponId: id }, include: { user: { select: { id: true, name: true } } } }) : [],
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
      throw new UserFacingError('El código de cupón es requerido.');
    }

    if (!userId) {
      throw new UserFacingError('Debes iniciar sesión para usar cupones.');
    }

    const verifiedUserId = userId as number;

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

    if (!coupon) throw new UserFacingError('El código de cupón no existe.');

    const now = new Date();
    if (coupon.status !== 'ACTIVE') throw new UserFacingError('Este cupón no está activo.');
    if (coupon.isDeleted) throw new UserFacingError('Este cupón no está disponible.');
    if (coupon.validFrom && now < coupon.validFrom) throw new UserFacingError('Este cupón aún no está vigente.');
    if (coupon.validUntil && now > coupon.validUntil) throw new UserFacingError('Este cupón ha expirado.');
    if (coupon.maxUses !== null && coupon.usesCount >= coupon.maxUses) throw new UserFacingError('Este cupón ha alcanzado su límite de usos.');

    const activeCart = await prisma.cart.findFirst({
      where: {
        status: 'ACTIVE',
        ...(verifiedUserId ? { userId: verifiedUserId } : { sessionId: sessionId ?? undefined }),
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
      throw new UserFacingError('Tu carrito está vacío. Agrega productos antes de aplicar un cupón.');
    }

    if (USER_SCOPES.has(coupon.scope)) {
      const isLinkedToUser = coupon.couponUsers.some((link) => link.userId === verifiedUserId);
      if (!isLinkedToUser) {
        throw new UserFacingError('Este cupón no es válido para tu cuenta.');
      }
    }

    const hasRedeemedCoupon = await prisma.couponRedemption.findUnique({
      where: {
        couponId_userId: {
          couponId: coupon.id,
          userId: verifiedUserId,
        },
      },
      select: { id: true },
    });

    if (hasRedeemedCoupon) {
      throw new UserFacingError('Este cupón ya fue utilizado por tu cuenta.');
    }

    if (coupon.scope === 'PRODUCTS') {
      const allowedProductIds = new Set(coupon.couponProducts.map((row) => row.productId));
      const hasEligibleProduct = cartItems.some((item) => allowedProductIds.has(item.productId));
      if (!hasEligibleProduct) {
        throw new UserFacingError('Este cupón solo aplica para productos específicos de tu carrito.');
      }
    }

    if (coupon.scope === 'CATEGORIES') {
      const allowedCategoryIds = new Set(coupon.couponCategories.map((row) => row.categoryId));
      const hasEligibleCategory = cartItems.some((item) => item.product?.categoryId && allowedCategoryIds.has(item.product.categoryId));
      if (!hasEligibleCategory) {
        throw new UserFacingError('Este cupón solo aplica para categorías específicas de tu carrito.');
      }
    }

    return mapPrismaCoupon(coupon);
  },

  async createCoupon(data: any, creatorId: number): Promise<Coupon> {
    const created = await dbWithAudit(creatorId, () =>
      prisma.$transaction(async (tx: any) => {
        const normalized = normalizeCouponMutationPayload(data);
        const newCoupon = await tx.coupon.create({ data: normalized.couponData });
        await syncScopeAssignments(tx, newCoupon.id, normalized.scope, normalized.scopeAssignments);
        return newCoupon;
      })
    );
    return mapPrismaCoupon(created);
  },

  async updateCoupon(id: number, data: any, editorId: number): Promise<Coupon> {
    const updated = await dbWithAudit(editorId, () =>
      prisma.$transaction(async (tx: any) => {
        const existing = await tx.coupon.findUnique({
          where: { id },
          include: {
            couponUsers: { select: { userId: true } },
            couponProducts: { select: { productId: true } },
            couponCategories: { select: { categoryId: true } },
          },
        });
        if (!existing || existing.isDeleted) {
          throw new UserFacingError('El cupón no existe o ya fue eliminado.');
        }

        const normalized = normalizeCouponMutationPayload(data, existing);
        const persisted = await tx.coupon.update({ where: { id }, data: normalized.couponData });
        await syncScopeAssignments(tx, id, normalized.scope, normalized.scopeAssignments);
        return persisted;
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
