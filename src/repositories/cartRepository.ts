
// src/repositories/cartRepository.ts
import { allProducts } from '@/lib/data/product-data';

// Use global to persist data across HMR and different API route instances in dev
const globalForCart = global as unknown as {
  mockCarts: Map<string, any[]>;
  mockCoupons: Map<string, any>;
};

const mockCarts = globalForCart.mockCarts || new Map<string, any[]>();
const mockCoupons = globalForCart.mockCoupons || new Map<string, any>();

if (process.env.NODE_ENV !== 'production') {
  globalForCart.mockCarts = mockCarts;
  globalForCart.mockCoupons = mockCoupons;
}

export const cartRepository = {
  async getContents({ userId, sessionId }: { userId: number | null, sessionId: string | null }) {
    const key = userId ? `u_${userId}` : `s_${sessionId}`;
    if (!key || key === 's_null') return { items: [], totals: { totalItems: 0, subtotal: 0 }, coupon: null };

    const items = mockCarts.get(key) || [];
    const subtotal = items.reduce((acc, it) => acc + (it.unit_price * it.quantity), 0);
    
    return {
      items: items.map(it => {
        const product = allProducts.find(p => p.id === it.product_id);
        return {
          ...it,
          product_name: product?.name || 'Producto',
          product_slug: product?.slug || '',
          product_image: product?.image || '',
          product_sku_short: product?.code || '',
          category_name: product?.category?.name || 'Varios',
          category_slug: product?.category?.slug || 'varios',
        };
      }),
      totals: {
        totalItems: items.reduce((acc, it) => acc + it.quantity, 0),
        subtotal: subtotal,
      },
      coupon: mockCoupons.get(key) || null,
    };
  },

  async findItem(params: any) {
    const { userId, sessionId, productId, variantId, parentCartItemId } = params;
    const key = userId ? `u_${userId}` : `s_${sessionId}`;
    if (!key || key === 's_null') return null;
    const cart = mockCarts.get(key) || [];
    return cart.find(it => 
        it.product_id === productId && 
        it.variant_id === variantId && 
        it.parent_cart_item_id === parentCartItemId
    ) || null;
  },

  async findItemsBySessionId(sessionId: string) {
    return mockCarts.get(`s_${sessionId}`) || [];
  },

  async createItem(itemData: any) {
    const key = itemData.user_id ? `u_${itemData.user_id}` : `s_${itemData.session_id}`;
    if (!key || key === 's_null') return 0;
    const cart = mockCarts.get(key) || [];
    const newId = Date.now() + Math.floor(Math.random() * 1000);
    cart.push({ ...itemData, id: newId });
    mockCarts.set(key, cart);
    return newId;
  },

  async updateItemQuantity(cartItemId: number, newQuantity: number) {
    for (const [key, cart] of mockCarts.entries()) {
      const item = cart.find(it => it.id === cartItemId);
      if (item) {
        item.quantity = newQuantity;
        return true;
      }
    }
    return false;
  },

  async deleteItem(cartItemId: number) {
    for (const [key, cart] of mockCarts.entries()) {
      const index = cart.findIndex(it => it.id === cartItemId);
      if (index > -1) {
        cart.splice(index, 1);
        return true;
      }
    }
    return false;
  },

  async clearCart({ userId, sessionId }: { userId: number | null, sessionId: string | null }) {
    const key = userId ? `u_${userId}` : `s_${sessionId}`;
    if (key && key !== 's_null') {
        mockCarts.set(key, []);
        mockCoupons.delete(key);
    }
    return true;
  },

  async revalidateCoupons(identity: any) {
      // Mock validation logic
  },

  async assignToUser(sessionId: string, userId: number) {
    const guestKey = `s_${sessionId}`;
    const userKey = `u_${userId}`;
    const guestCart = mockCarts.get(guestKey) || [];
    const userCart = mockCarts.get(userKey) || [];
    
    // Simple merge logic: combine all and handle duplicates if necessary
    const mergedCart = [...userCart];
    
    guestCart.forEach(gItem => {
        const existing = mergedCart.find(uItem => 
            uItem.product_id === gItem.product_id && 
            uItem.variant_id === gItem.variant_id &&
            uItem.parent_cart_item_id === gItem.parent_cart_item_id
        );
        if (existing) {
            existing.quantity += gItem.quantity;
        } else {
            mergedCart.push({ ...gItem, user_id: userId, session_id: null });
        }
    });

    mockCarts.set(userKey, mergedCart);
    mockCarts.delete(guestKey);
    return guestCart.length;
  }
};
