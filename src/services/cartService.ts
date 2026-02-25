// src/services/cartService.ts
import { cartRepository } from '../repositories/cartRepository';
import { mapDbCartItemToCartItem } from '../mappers/cartMapper';
import type { CartItem } from '@/lib/definitions';
import { productService } from './productService';

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
  async getCartContents(params: GetContentsParams): Promise<{ items: CartItem[], totalItems: number, subtotal: number, coupon: any | null }> {
    if (!params.sessionId && !params.userId) {
      return { items: [], totalItems: 0, subtotal: 0, coupon: null };
    }
    await cartRepository.revalidateCoupons(params);
    const { items: dbItems, totals, coupon } = await cartRepository.getContents(params);
    const items = dbItems.map(mapDbCartItemToCartItem);
    return { items, totalItems: totals.totalItems, subtotal: totals.subtotal, coupon };
  },

  async upsertItem(params: UpsertItemParams): Promise<UpsertResult> {
    const {
      sessionId,
      userId,
      productId,
      variantId,
      quantity,
      unitPrice,
      isComplement,
      parentCartItemId,
      customPhotoUrl,
      deliveryDate,
      deliveryTimeSlot,
      mode = 'set',
    } = params;

    const existingItem = await cartRepository.findItem({ userId, sessionId, productId, variantId, parentCartItemId: parentCartItemId ? parseInt(parentCartItemId, 10) : null });

    if (existingItem) {
      const newQuantity = mode === 'set' ? quantity : existingItem.quantity + quantity;
      if (newQuantity <= 0) {
        await this.removeItem(existingItem.id, { userId, sessionId });
        const cart = await this.getCartContents({ userId, sessionId });
        return {
          itemId: existingItem.id,
          newQuantity: 0,
          resultCode: 1,
          message: 'Ítem eliminado',
          totalItems: cart.totalItems,
          subtotal: cart.subtotal,
          cart_item_id: existingItem.id,
          total: cart.subtotal,
        };
      }
      await cartRepository.updateItemQuantity(existingItem.id, newQuantity);
      const cart = await this.getCartContents({ userId, sessionId });
      return {
        itemId: existingItem.id,
        newQuantity,
        resultCode: 1,
        message: 'Carrito actualizado',
        totalItems: cart.totalItems,
        subtotal: cart.subtotal,
        cart_item_id: existingItem.id,
        total: cart.subtotal,
      };
    } else {
      if (quantity <= 0) {
        const cart = await this.getCartContents({ userId, sessionId });
        return {
          itemId: 0,
          newQuantity: 0,
          resultCode: 1,
          message: 'Sin cambios',
          totalItems: cart.totalItems,
          subtotal: cart.subtotal,
          cart_item_id: 0,
          total: cart.subtotal,
        };
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

      const newItemId = await cartRepository.createItem({
        session_id: sessionId,
        user_id: userId,
        product_id: productId,
        variant_id: variantId,
        quantity,
        unit_price: effectiveUnitPrice,
        is_complement: isComplement ? 1 : 0,
        parent_cart_item_id: parentCartItemId,
        custom_photo_url: customPhotoUrl,
        delivery_date: deliveryDate,
        delivery_time_slot: deliveryTimeSlot ?? null,
      });
      const cart = await this.getCartContents({ userId, sessionId });
      return {
        itemId: newItemId,
        newQuantity: quantity,
        resultCode: 1,
        message: 'Carrito actualizado',
        totalItems: cart.totalItems,
        subtotal: cart.subtotal,
        cart_item_id: newItemId,
        total: cart.subtotal,
      };
    }
  },
  
  async updateQuantity(cartItemId: number, newQuantity: number, identity: GetContentsParams) {
    if (newQuantity < 1) {
      await this.removeItem(cartItemId, identity);
      return;
    } 

    await cartRepository.updateItemQuantity(cartItemId, newQuantity);
    await cartRepository.revalidateCoupons(identity);
  },

  async removeItem(cartItemId: number, identity: GetContentsParams) {
    await cartRepository.deleteItem(cartItemId);
    await cartRepository.revalidateCoupons(identity);
  },

  async clearCart(identity: GetContentsParams) {
    await cartRepository.clearCart(identity);
  },

  async mergeGuestCart(sessionId: string, userId: number): Promise<{ merged: number, items: number, subtotal: number }> {
    const guestItems = await cartRepository.findItemsBySessionId(sessionId);

    if (guestItems.length === 0) {
      const userCart = await this.getCartContents({ userId, sessionId: null });
      return { merged: 0, items: userCart.totalItems, subtotal: userCart.subtotal };
    }
    
    // Asignar los items al usuario y revalidar
    await cartRepository.assignToUser(sessionId, userId);
    await cartRepository.revalidateCoupons({ userId, sessionId: null });
    
    const finalCart = await this.getCartContents({userId, sessionId: null});

    return {
      merged: guestItems.length,
      items: finalCart.totalItems,
      subtotal: finalCart.subtotal,
    };
  }
};
