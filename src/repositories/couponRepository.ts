// src/repositories/couponRepository.ts
import { allCoupons } from '@/lib/data/coupon-data';
import type { DbCoupon, User, Product, ProductCategory } from '@/lib/definitions';
import type { PoolConnection } from '@/lib/db';

type FindAllParams = {
  search: string;
  status: string[];
  page: number;
  limit: number;
};

type CreateCouponParams = {
  p_code: string;
  p_description: string;
  p_discount_type: string;
  p_discount_value: number;
  p_scope: string;
  p_max_uses: number | null;
  p_valid_from: Date;
  p_valid_until: Date | null;
  p_user_ids_csv: string | null;
  p_category_ids_csv: string | null;
  p_product_ids_csv: string | null;
}

type UpdateCouponParams = CreateCouponParams & { p_coupon_id: number; };

type ValidateCartParams = {
  couponCode: string;
  userId: number | null;
  sessionId: string | null;
  deliveryDate: string | null;
};

type ValidateCartResult = {
  o_coupon_id: number;
  o_scope: string;
  o_discount_type: string;
  o_discount_value: number;
  o_applicable: number;
  o_reason: string;
  o_matched_items: number;
}


export const couponRepository = {
  async findAll({ search, status, page, limit }: FindAllParams): Promise<DbCoupon[]> {
    let coupons = allCoupons.filter(c => !(c as any).is_deleted);
    
    if (search) {
      const s = search.toLowerCase();
      coupons = coupons.filter(c => c.code.toLowerCase().includes(s) || c.description.toLowerCase().includes(s));
    }
    
    // Status filtering omitted for brevity, assumes default
    
    const start = (page - 1) * limit;
    return Promise.resolve(coupons.slice(start, start + limit) as unknown as DbCoupon[]);
  },

  async countAll({ search, status }: Omit<FindAllParams, 'page' | 'limit'>): Promise<number> {
    let coupons = allCoupons.filter(c => !(c as any).is_deleted);
    if (search) {
      const s = search.toLowerCase();
      coupons = coupons.filter(c => c.code.toLowerCase().includes(s) || c.description.toLowerCase().includes(s));
    }
    return Promise.resolve(coupons.length);
  },

  async findById(id: number): Promise<DbCoupon | null> {
    const c = allCoupons.find(c => c.id === id && !(c as any).is_deleted);
    return Promise.resolve((c as unknown as DbCoupon) || null);
  },
  
  async findCouponsByIds(ids: number[]): Promise<DbCoupon[]> {
    if (ids.length === 0) return Promise.resolve([]);
    const coupons = allCoupons.filter(c => ids.includes(c.id));
    return Promise.resolve(coupons as unknown as DbCoupon[]);
  },

  async findForUser(userId: number): Promise<DbCoupon[]> {
    // Mock: return global coupons
    const coupons = allCoupons.filter(c => c.scope === 'global' && !(c as any).is_deleted);
    return Promise.resolve(coupons as unknown as DbCoupon[]);
  },

  async findByCode(code: string): Promise<DbCoupon | null> {
    const c = allCoupons.find(c => c.code === code && !(c as any).is_deleted);
    return Promise.resolve((c as unknown as DbCoupon) || null);
  },

  async create(connection: PoolConnection, params: CreateCouponParams): Promise<number> {
    const newId = Math.max(...allCoupons.map(c => c.id), 0) + 1;
    // @ts-ignore
    allCoupons.push({ ...params, id: newId, created_at: new Date().toISOString() });
    return Promise.resolve(newId);
  },
  
  async update(connection: PoolConnection, params: UpdateCouponParams): Promise<boolean> {
    const index = allCoupons.findIndex(c => c.id === params.p_coupon_id);
    if (index === -1) return Promise.resolve(false);
    // @ts-ignore
    allCoupons[index] = { ...allCoupons[index], ...params };
    return Promise.resolve(true);
  },
  
  async delete(connection: PoolConnection, id: number): Promise<boolean> {
    const index = allCoupons.findIndex(c => c.id === id);
    if (index === -1) return Promise.resolve(false);
    (allCoupons[index] as any).is_deleted = true;
    (allCoupons[index] as any).deleted_at = new Date().toISOString();
    return Promise.resolve(true);
  },
  
  async bulkDelete(connection: PoolConnection, ids: number[]): Promise<number> {
    let count = 0;
    ids.forEach(id => {
        const index = allCoupons.findIndex(c => c.id === id);
        if(index !== -1) {
            (allCoupons[index] as any).is_deleted = true;
            (allCoupons[index] as any).deleted_at = new Date().toISOString();
            count++;
        }
    });
    return Promise.resolve(count);
  },

  async findRelatedUsers(couponId: number): Promise<Pick<User, 'id' | 'name'>[]> {
    return Promise.resolve([]);
  },

  async findRelatedProducts(couponId: number): Promise<Pick<Product, 'id' | 'name'>[]> {
    return Promise.resolve([]);
  },

  async findRelatedCategories(couponId: number): Promise<Pick<ProductCategory, 'id' | 'name'>[]> {
    return Promise.resolve([]);
  },

  async validateForCart(params: ValidateCartParams): Promise<ValidateCartResult> {
    const c = allCoupons.find(c => c.code === params.couponCode && !(c as any).is_deleted);
    if (!c) {
        return Promise.resolve({
            o_coupon_id: 0,
            o_scope: '',
            o_discount_type: '',
            o_discount_value: 0,
            o_applicable: 0, // False
            o_reason: 'Cupón no encontrado',
            o_matched_items: 0,
        });
    }
    // Simple valid check
    return Promise.resolve({
      o_coupon_id: c.id,
      o_scope: c.scope,
      o_discount_type: c.discount_type,
      o_discount_value: c.discount_value,
      o_applicable: 1, // True
      o_reason: 'Cupón válido',
      o_matched_items: 1,
    });
  }
};
