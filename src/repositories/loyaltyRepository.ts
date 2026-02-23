// src/repositories/loyaltyRepository.ts
import { allUsers } from '@/lib/data/user-data';
import { allCoupons } from '@/lib/data/coupon-data';
import type { PoolConnection } from '@/lib/db';

export const loyaltyRepository = {
  async redeemPoints(connection: PoolConnection, userId: number, pointsToRedeem: number): Promise<{ coupons_created: number, points_deducted: number, result: number, message: string }> {
    const user = allUsers.find(u => u.id === userId);
    
    if (!user) {
        throw new Error('User not found');
    }
    
    // Check points
    if ((user.loyalty_points || 0) < pointsToRedeem) {
        throw new Error('Insufficient points');
    }

    // Logic: 3000 points = 1 coupon? Assuming existing logic
    // The SP name implies redeeming points and creating coupons.
    // I'll assume 3000 points = 1 coupon of some value.
    // Or just deduct and say success.
    // User mentioned "pointsToRedeem" must be multiple of 3000 in docstring? 
    // Docstring says: "debe ser múltiplo de 3000".

    const couponsCount = Math.floor(pointsToRedeem / 3000);
    
    // Deduct points
    user.loyalty_points = (user.loyalty_points || 0) - pointsToRedeem;

    // Create coupons logic
    const createdCouponIds: number[] = [];
    for (let i = 0; i < couponsCount; i++) {
        const newId = Math.max(...allCoupons.map(c => c.id), 0) + 1;
        // Mock coupon creation
        allCoupons.push({
            id: newId,
            code: `LOYALTY-${newId}-${Date.now()}`,
            description: 'Canje de puntos de lealtad',
            discount_type: 'amount', // Assumption
            discount_value: 100, // Assumption
            scope: 'global',
            max_uses: 1,
            uses_count: 0,
            valid_from: new Date().toISOString(),
            valid_until: null,
            created_at: new Date().toISOString(),
            is_deleted: false
        } as any);
        createdCouponIds.push(newId);
    }

    return Promise.resolve({
        coupons_created: couponsCount,
        points_deducted: pointsToRedeem,
        result: 1,
        message: createdCouponIds.join(',')
    });
  },
};
