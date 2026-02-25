// src/services/cartService.ts
import { prisma } from '@/lib/prisma';
import { DiscountType } from '@prisma/client';
import { mapDbCartItemToCartItem } from '../mappers/cartMapper';
import type { CartItem } from '@/lib/definitions';
import { productService } from './productService';

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
    where: { status: 'ACTIVE', ...(userId ? { userId } : { sessionId: sessionId! }) },
  });
}

async function getOrCreateActiveCart(identity: Identity) {
  const existing = await getActiveCart(identity);
  if (existing) return existing;
  return prisma.cart.create({
    data: { userId: identity.userId, sessionId: identity.userId ? null : identity.sessionId, status: 'ACTIVE' },
  });
}

async function getCartContentsRaw(identity: Identity) {
  const cart = await getActiveCart(identity);
  if (!cart) return { items: [], totals: { totalItems: 0, subtotal: 0 }, coupon: null };

  const dbItems = await prisma.cartItem.findMany({
    where: { cartId: cart.id },
    orderBy: { id: 'asc' },
    include: {
      product: {
        include: {
          category: true,
          images: { where: { isPrimary: true, variantId: null }, orderBy: { sortOrder: 'asc' }, take: 1 },
        },
      },
      variant: {
        include: {
          images: { where: { isPrimary: true }, orderBy: { sortOrder: 'asc' }, take: 1 },
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
    ? { id: coupon.id, code: coupon.code, discount_type: normalizeDiscountType(coupon.discountType), discount_value: toNumber(coupon.discountValue) }
    : null;

  return { items, totals: { totalItems, subtotal: Number(subtotal.toFixed(2)) }, coupon: mappedCoupon };
}

interface UpsertItemParams {
  sessionId: string | null;
  userId: number | null;
  productId: number;
  variantId: number | null;
  quantity: number;
  unitPrice?: number;
  isComplement?: boolean;
  parentCartItemId?: string | null;
  customPhotoId?: number | null;
  customPhotoUrl: string | null;
  deliveryDate: string | null;
  deliveryTimeSlot?: string | null;
  mode?: 'add' | 'set';
}

interface GetContentsParams {
  sessionId: string | null;
  userId: number | null;
}

interface UpsertResult {
  itemId: number;
  newQuantity: number;
  resultCode: number;
  message: string;
  totalItems: number;
  subtotal: number;
  cart_item_id: number;
  total: number;
}

export const cartService = {
  async getCartContents(params: GetContentsParams): Promise<{ items: CartItem[]; totalItems: number; subtotal: number; coupon: any | null }> {
    if (!params.sessionId && !params.userId) {
      return { items: [], totalItems: 0, subtotal: 0, coupon: null };
    }
    await this.revalidateCoupons(params);
    const { items: dbItems, totals, coupon } = await getCartContentsRaw(params);
    const items = dbItems.map(mapDbCartItemToCartItem);
    return { items, totalItems: totals.totalItems, subtotal: totals.subtotal, coupon };
  },

  async upsertItem(params: UpsertItemParams): Promise<UpsertResult> {
    const { sessionId, userId, productId, variantId, quantity, unitPrice, isComplement, parentCartItemId, customPhotoUrl, deliveryDate, deliveryTimeSlot, mode = 'set' } = params;

    const cart = await getActiveCart({ userId, sessionId });
    const existingItem = cart
      ? await prisma.cartItem.findFirst({ where: { cartId: cart.id, productId, variantId, parentCartItemId: parentCartItemId ? parseInt(parentCartItemId, 10) : null } })
      : null;

    if (existingItem) {
      const newQuantity = mode === 'set' ? quantity : existingItem.quantity + quantity;
      if (newQuantity <= 0) {
        await this.removeItem(existingItem.id, { userId, sessionId });
        const c = await this.getCartContents({ userId, sessionId });
        return { itemId: existingItem.id, newQuantity: 0, resultCode: 1, message: 'Ítem eliminado', totalItems: c.totalItems, subtotal: c.subtotal, cart_item_id: existingItem.id, total: c.subtotal };
      }
      await prisma.cartItem.update({ where: { id: existingItem.id }, data: { quantity: newQuantity } });
      const c = await this.getCartContents({ userId, sessionId });
      return { itemId: existingItem.id, newQuantity, resultCode: 1, message: 'Carrito actualizado', totalItems: c.totalItems, subtotal: c.subtotal, cart_item_id: existingItem.id, total: c.subtotal };
    } else {
      if (quantity <= 0) {
        const c = await this.getCartContents({ userId, sessionId });
        return { itemId: 0, newQuantity: 0, resultCode: 1, message: 'Sin cambios', totalItems: c.totalItems, subtotal: c.subtotal, cart_item_id: 0, total: c.subtotal };
      }

      let effectiveUnitPrice = unitPrice;
      if (effectiveUnitPrice === undefined) {
        const product = await productService.getCompleteProductDetailsById(productId);
        if (!product) throw new Error('Producto no encontrado.');
        if (variantId) {
          const variant = product.variants?.find((v) => v.id === variantId);
          if (!variant) throw new Error('Variante no encontrada.');
          effectiveUnitPrice = (variant as any).sale_price ?? (variant as any).salePrice ?? (variant as any).price;
        } else {
          effectiveUnitPrice = (product as any).sale_price ?? (product as any).salePrice ?? (product as any).price;
        }
      }

      if (effectiveUnitPrice === undefined || Number.isNaN(Number(effectiveUnitPrice))) {
        throw new Error('No se pudo resolver el precio del producto.');
      }

      const activeCart = await getOrCreateActiveCart({ userId, sessionId });
      const created = await prisma.cartItem.create({
        data: { cartId: activeCart.id, productId, variantId, quantity, unitPrice: effectiveUnitPrice, isComplement: Boolean(isComplement), parentCartItemId: parentCartItemId ? Number(parentCartItemId) : null, customPhotoUrl: customPhotoUrl ?? null, deliveryDate: deliveryDate ? new Date(deliveryDate) : null, deliveryTimeSlot: deliveryTimeSlot ?? null },
      });

      const c = await this.getCartContents({ userId, sessionId });
      return { itemId: created.id, newQuantity: quantity, resultCode: 1, message: 'Carrito actualizado', totalItems: c.totalItems, subtotal: c.subtotal, cart_item_id: created.id, total: c.subtotal };
    }
  },

  async updateQuantity(cartItemId: number, newQuantity: number, identity: GetContentsParams) {
    if (newQuantity < 1) { await this.removeItem(cartItemId, identity); return; }
    await prisma.cartItem.update({ where: { id: cartItemId }, data: { quantity: newQuantity } });
    await this.revalidateCoupons(identity);
  },

  async removeItem(cartItemId: number, identity: GetContentsParams) {
    await prisma.cartItem.delete({ where: { id: cartItemId } });
    await this.revalidateCoupons(identity);
  },

  async clearCart(identity: GetContentsParams) {
    const cart = await getActiveCart(identity);
    if (!cart) return true;
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    await prisma.cart.update({ where: { id: cart.id }, data: { couponId: null, couponCode: null } });
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
    await prisma.cart.update({ where: { id: cart.id }, data: { couponId: null, couponCode: null } });
    return true;
  },

  async findItemsBySessionId(sessionId: string) {
    const cart = await getActiveCart({ userId: null, sessionId });
    if (!cart) return [];
    return prisma.cartItem.findMany({ where: { cartId: cart.id } });
  },

  async mergeGuestCart(sessionId: string, userId: number): Promise<{ merged: number; items: number; subtotal: number }> {
    const guestItems = await this.findItemsBySessionId(sessionId);

    if (guestItems.length === 0) {
      const userCart = await this.getCartContents({ userId, sessionId: null });
      return { merged: 0, items: userCart.totalItems, subtotal: userCart.subtotal };
    }

    await prisma.$transaction(async (tx) => {
      const guestCart = await tx.cart.findFirst({ where: { sessionId, status: 'ACTIVE' } });
      if (!guestCart) return;

      let userCart = await tx.cart.findFirst({ where: { userId, status: 'ACTIVE' } });
      if (!userCart) {
        userCart = await tx.cart.create({ data: { userId, sessionId: null, status: 'ACTIVE' } });
      }

      for (const guestItem of guestItems) {
        const existing = await tx.cartItem.findFirst({ where: { cartId: userCart.id, productId: guestItem.productId, variantId: guestItem.variantId, parentCartItemId: guestItem.parentCartItemId, isComplement: guestItem.isComplement } });
        if (existing) {
          await tx.cartItem.update({ where: { id: existing.id }, data: { quantity: existing.quantity + guestItem.quantity, unitPrice: guestItem.unitPrice, customPhotoUrl: guestItem.customPhotoUrl ?? existing.customPhotoUrl, deliveryDate: guestItem.deliveryDate ?? existing.deliveryDate, deliveryTimeSlot: guestItem.deliveryTimeSlot ?? existing.deliveryTimeSlot } });
        } else {
          await tx.cartItem.create({ data: { cartId: userCart.id, productId: guestItem.productId, variantId: guestItem.variantId, quantity: guestItem.quantity, unitPrice: guestItem.unitPrice, isComplement: guestItem.isComplement, parentCartItemId: guestItem.parentCartItemId, customPhotoUrl: guestItem.customPhotoUrl, deliveryDate: guestItem.deliveryDate, deliveryTimeSlot: guestItem.deliveryTimeSlot } });
        }
      }

      await tx.cartItem.deleteMany({ where: { cartId: guestCart.id } });
      await tx.cart.delete({ where: { id: guestCart.id } });
    });

    await this.revalidateCoupons({ userId, sessionId: null });
    const finalCart = await this.getCartContents({ userId, sessionId: null });
    return { merged: guestItems.length, items: finalCart.totalItems, subtotal: finalCart.subtotal };
  },
};
