// src/services/cartService.ts
import { cartRepository } from '../repositories/cartRepository';
import { mapDbCartItemToCartItem } from '../mappers/cartMapper';
import type { CartItem, Product } from '@/lib/definitions';
import { saveCartPhoto } from './file.service';

interface UpsertItemParams {
  sessionId: string | null;
  userId: number | null;
  productId: number;
  variantId: number | null;
  quantity: number;
  unitPrice: number;
  isComplement: boolean;
  parentCartItemId: string | null;
  customPhotoUrl: string | null;
  deliveryDate: string | null;
  deliveryTimeSlot: string | null;
  mode: 'add' | 'set';
}

interface GetContentsParams {
  sessionId: string | null;
  userId: number | null;
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

  async upsertItem(params: UpsertItemParams): Promise<{ itemId: number, newQuantity: number }> {
    const { sessionId, userId, productId, variantId, quantity, unitPrice, isComplement, parentCartItemId, customPhotoUrl, deliveryDate, deliveryTimeSlot, mode } = params;

    const existingItem = await cartRepository.findItem({ userId, sessionId, productId, variantId, parentCartItemId: parentCartItemId ? parseInt(parentCartItemId, 10) : null });

    if (existingItem) {
      const newQuantity = mode === 'set' ? quantity : existingItem.quantity + quantity;
      if (newQuantity <= 0) {
        await this.removeItem(existingItem.id, { userId, sessionId });
        return { itemId: existingItem.id, newQuantity: 0 };
      }
      await cartRepository.updateItemQuantity(existingItem.id, newQuantity);
      return { itemId: existingItem.id, newQuantity };
    } else {
      if (quantity <= 0) {
        return { itemId: 0, newQuantity: 0 }; // No item to add or update
      }
      const newItemId = await cartRepository.createItem({
        session_id: sessionId,
        user_id: userId,
        product_id: productId,
        variant_id: variantId,
        quantity,
        unit_price: unitPrice,
        is_complement: isComplement ? 1 : 0,
        parent_cart_item_id: parentCartItemId,
        custom_photo_url: customPhotoUrl,
        delivery_date: deliveryDate,
        delivery_time_slot: deliveryTimeSlot,
      });
      return { itemId: newItemId, newQuantity: quantity };
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
