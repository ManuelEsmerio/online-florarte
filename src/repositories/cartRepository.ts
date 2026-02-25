
// src/repositories/cartRepository.ts
import { prisma } from '@/lib/prisma';
import { DiscountType } from '@prisma/client';

type Identity = { userId: number | null; sessionId: string | null };

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  return Number(value ?? 0);
}

function normalizeDiscountType(type: DiscountType): 'percentage' | 'fixed' {
  return type === 'PERCENTAGE' ? 'percentage' : 'fixed';
}

async function getActiveCart(identity: Identity) {
  const { userId, sessionId } = identity;
  if (!userId && !sessionId) return null;

  return prisma.cart.findFirst({
    where: {
      status: 'ACTIVE',
      ...(userId ? { userId } : { sessionId: sessionId! }),
    },
  });
}

async function getOrCreateActiveCart(identity: Identity) {
  const existing = await getActiveCart(identity);
  if (existing) return existing;

  return prisma.cart.create({
    data: {
      userId: identity.userId,
      sessionId: identity.userId ? null : identity.sessionId,
      status: 'ACTIVE',
    },
  });
}

export const cartRepository = {
  async getContents(identity: Identity) {
    const cart = await getActiveCart(identity);

    if (!cart) {
      return { items: [], totals: { totalItems: 0, subtotal: 0 }, coupon: null };
    }

    const dbItems = await prisma.cartItem.findMany({
      where: { cartId: cart.id },
      orderBy: { id: 'asc' },
      include: {
        product: {
          include: {
            category: true,
            images: {
              where: { isPrimary: true, variantId: null },
              orderBy: { sortOrder: 'asc' },
              take: 1,
            },
          },
        },
        variant: {
          include: {
            images: {
              where: { isPrimary: true },
              orderBy: { sortOrder: 'asc' },
              take: 1,
            },
          },
        },
      },
    });

    const items = dbItems.map((it) => ({
      id: it.id,
      product_id: it.productId,
      product_name: it.product.name,
      product_slug: it.product.slug,
      product_image: it.product.images[0]?.src ?? it.product.mainImage ?? '/placehold.webp',
      product_sku_short: it.product.code,
      category_name: it.product.category.name,
      category_slug: it.product.category.slug,
      variant_id: it.variantId,
      variant_name: it.variant?.name ?? null,
      variant_code: it.variant?.code ?? null,
      variant_image: it.variant?.images[0]?.src ?? null,
      quantity: it.quantity,
      unit_price: toNumber(it.unitPrice),
      is_complement: it.isComplement ? 1 : 0,
      parent_cart_item_id: it.parentCartItemId,
      custom_photo_url: it.customPhotoUrl,
      delivery_date: it.deliveryDate ? it.deliveryDate.toISOString().slice(0, 10) : null,
      delivery_time_slot: it.deliveryTimeSlot,
    }));

    const subtotal = items.reduce((acc, item) => acc + item.unit_price * item.quantity, 0);
    const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

    const coupon = cart.couponId
      ? await prisma.coupon.findUnique({ where: { id: cart.couponId } })
      : null;

    const mappedCoupon = coupon
      ? {
          id: coupon.id,
          code: coupon.code,
          discount_type: normalizeDiscountType(coupon.discountType),
          discount_value: toNumber(coupon.discountValue),
        }
      : null;

    return {
      items,
      totals: { totalItems, subtotal: Number(subtotal.toFixed(2)) },
      coupon: mappedCoupon,
    };
  },

  async findItem(params: {
    userId: number | null;
    sessionId: string | null;
    productId: number;
    variantId: number | null;
    parentCartItemId: number | null;
  }) {
    const cart = await getActiveCart({ userId: params.userId, sessionId: params.sessionId });
    if (!cart) return null;

    return prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: params.productId,
        variantId: params.variantId,
        parentCartItemId: params.parentCartItemId,
      },
    });
  },

  async findItemsBySessionId(sessionId: string) {
    const cart = await getActiveCart({ userId: null, sessionId });
    if (!cart) return [];
    return prisma.cartItem.findMany({ where: { cartId: cart.id } });
  },

  async createItem(itemData: {
    session_id: string | null;
    user_id: number | null;
    product_id: number;
    variant_id: number | null;
    quantity: number;
    unit_price: number;
    is_complement?: number;
    parent_cart_item_id?: string | number | null;
    custom_photo_url?: string | null;
    delivery_date?: string | null;
    delivery_time_slot?: string | null;
  }) {
    const cart = await getOrCreateActiveCart({ userId: itemData.user_id, sessionId: itemData.session_id });

    const created = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: itemData.product_id,
        variantId: itemData.variant_id,
        quantity: itemData.quantity,
        unitPrice: itemData.unit_price,
        isComplement: Boolean(itemData.is_complement),
        parentCartItemId: itemData.parent_cart_item_id ? Number(itemData.parent_cart_item_id) : null,
        customPhotoUrl: itemData.custom_photo_url ?? null,
        deliveryDate: itemData.delivery_date ? new Date(itemData.delivery_date) : null,
        deliveryTimeSlot: itemData.delivery_time_slot ?? null,
      },
    });

    return created.id;
  },

  async updateItemQuantity(cartItemId: number, newQuantity: number) {
    await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity: newQuantity },
    });
    return true;
  },

  async deleteItem(cartItemId: number) {
    await prisma.cartItem.delete({ where: { id: cartItemId } });
    return true;
  },

  async clearCart(identity: Identity) {
    const cart = await getActiveCart(identity);
    if (!cart) return true;

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    await prisma.cart.update({
      where: { id: cart.id },
      data: { couponId: null, couponCode: null },
    });

    return true;
  },

  async revalidateCoupons(identity: Identity) {
    const cart = await getActiveCart(identity);
    if (!cart || !cart.couponId) return;

    const coupon = await prisma.coupon.findUnique({ where: { id: cart.couponId } });
    if (!coupon || coupon.status !== 'ACTIVE' || coupon.isDeleted) {
      await prisma.cart.update({ where: { id: cart.id }, data: { couponId: null, couponCode: null } });
    }
  },

  async removeCartCoupon(identity: Identity) {
    const cart = await getActiveCart(identity);
    if (!cart) return false;

    await prisma.cart.update({
      where: { id: cart.id },
      data: { couponId: null, couponCode: null },
    });

    return true;
  },

  async assignToUser(sessionId: string, userId: number) {
    return prisma.$transaction(async (tx) => {
      const guestCart = await tx.cart.findFirst({ where: { sessionId, status: 'ACTIVE' } });
      if (!guestCart) return 0;

      let userCart = await tx.cart.findFirst({ where: { userId, status: 'ACTIVE' } });
      if (!userCart) {
        userCart = await tx.cart.create({
          data: { userId, sessionId: null, status: 'ACTIVE' },
        });
      }

      const guestItems = await tx.cartItem.findMany({ where: { cartId: guestCart.id } });

      for (const guestItem of guestItems) {
        const existing = await tx.cartItem.findFirst({
          where: {
            cartId: userCart.id,
            productId: guestItem.productId,
            variantId: guestItem.variantId,
            parentCartItemId: guestItem.parentCartItemId,
            isComplement: guestItem.isComplement,
          },
        });

        if (existing) {
          await tx.cartItem.update({
            where: { id: existing.id },
            data: {
              quantity: existing.quantity + guestItem.quantity,
              unitPrice: guestItem.unitPrice,
              customPhotoUrl: guestItem.customPhotoUrl ?? existing.customPhotoUrl,
              deliveryDate: guestItem.deliveryDate ?? existing.deliveryDate,
              deliveryTimeSlot: guestItem.deliveryTimeSlot ?? existing.deliveryTimeSlot,
            },
          });
        } else {
          await tx.cartItem.create({
            data: {
              cartId: userCart.id,
              productId: guestItem.productId,
              variantId: guestItem.variantId,
              quantity: guestItem.quantity,
              unitPrice: guestItem.unitPrice,
              isComplement: guestItem.isComplement,
              parentCartItemId: guestItem.parentCartItemId,
              customPhotoUrl: guestItem.customPhotoUrl,
              deliveryDate: guestItem.deliveryDate,
              deliveryTimeSlot: guestItem.deliveryTimeSlot,
            },
          });
        }
      }

      await tx.cartItem.deleteMany({ where: { cartId: guestCart.id } });
      await tx.cart.delete({ where: { id: guestCart.id } });

      return guestItems.length;
    });
  },
};
