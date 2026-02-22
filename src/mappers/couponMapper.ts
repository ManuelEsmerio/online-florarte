
// src/mappers/couponMapper.ts
import type { Coupon, DbCoupon, User } from '@/lib/definitions';
import { getCouponStatus } from '@/lib/business-logic/coupon-logic';

/**
 * Mapea una fila de la base de datos a un objeto Coupon limpio.
 * @param row El objeto DbCoupon de la base de datos.
 * @returns Un objeto Coupon.
 */
export function mapDbCouponToCoupon(row: DbCoupon): Coupon {
  return {
    id: row.id,
    code: row.code,
    description: row.description,
    discount_type: row.discount_type,
    discount_value: row.discount_value,
    valid_from: new Date(row.valid_from).toISOString(),
    valid_until: row.valid_until ? new Date(row.valid_until).toISOString() : null,
    status: getCouponStatus(row),
    scope: row.scope,
    max_uses: row.max_uses,
    uses_count: row.uses_count,
    details: {
      users: [],
      products: [],
      categories: [],
    }
  };
}
