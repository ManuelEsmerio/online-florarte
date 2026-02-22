// src/repositories/loyaltyRepository.ts
import type { PoolConnection, ResultSetHeader } from 'mysql2/promise';

export const loyaltyRepository = {
  /**
   * Llama al SP para canjear puntos de un usuario y generar los cupones correspondientes.
   * @param connection - La conexión a la base de datos (para transacciones).
   * @param userId - El ID del usuario que canjea los puntos.
   * @param pointsToRedeem - La cantidad de puntos a canjear (debe ser múltiplo de 3000).
   * @returns Un objeto con el resultado de la operación.
   */
  async redeemPoints(connection: PoolConnection, userId: number, pointsToRedeem: number): Promise<{ coupons_created: number, points_deducted: number, result: number, message: string }> {
    
    const sql = 'CALL sp_Loyalty_RedeemPoints_AndCreateCoupons(?, ?, @o_coupons_created, @o_points_deducted, @o_result, @o_message)';
    
    await connection.query(sql, [userId, pointsToRedeem]);
    
    const [[result]] = await connection.query('SELECT @o_coupons_created as coupons_created, @o_points_deducted as points_deducted, @o_result as result, @o_message as message');
    
    const output = result as any;
    
    if (output.result <= 0) {
      throw new Error(output.message || 'Error desconocido al canjear puntos.');
    }
    
    return {
        coupons_created: Number(output.coupons_created),
        points_deducted: Number(output.points_deducted),
        result: Number(output.result),
        message: output.message // Esto ahora contendrá los IDs de los cupones
    };
  },
};
