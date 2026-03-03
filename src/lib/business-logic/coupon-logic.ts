// src/lib/business-logic/coupon-logic.ts

import type { Coupon } from '../definitions';
import type { CouponStatus } from '../definitions';

/**
 * Determina el estado de un cupón (vigente, vencido, utilizado) basado en sus propiedades.
 * 
 * Esta función centraliza la lógica de negocio para la validación de cupones, 
 * asegurando que las reglas se apliquen de manera consistente en toda la aplicación.
 *
 * @param coupon - Un objeto que contiene las propiedades del cupón necesarias para la validación:
 *   - `max_uses`: Límite de usos totales (null para ilimitado).
 *   - `uses_count`: Número de veces que el cupón ya ha sido utilizado.
 *   - `valid_until`: Fecha de vencimiento del cupón (null para nunca expirar).
 * @returns {CouponStatus} El estado calculado del cupón.
 */
export const getCouponStatus = (coupon: { max_uses: number | null; uses_count: number; valid_until: string | Date | null }): CouponStatus => {
    const now = new Date();

    if (coupon.max_uses !== null && coupon.uses_count >= coupon.max_uses) {
        return 'USED';
    }

    if (coupon.valid_until && now > new Date(coupon.valid_until)) {
        return 'EXPIRED';
    }

    return 'ACTIVE';
};
