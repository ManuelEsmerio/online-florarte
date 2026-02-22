// src/repositories/wishlistRepository.ts
import db from '@/lib/db';
import type { DbProduct } from '@/lib/definitions'; // Usamos DbProduct para el resultado del JOIN
import type { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';

export const wishlistRepository = {

  async findByUserId(userId: number): Promise<DbProduct[]> {
    const sql = `
      SELECT p.*
      FROM wishlist w
      JOIN products p ON w.product_id = p.id
      WHERE w.user_id = ? AND p.status = 'publicado'
      ORDER BY w.created_at DESC;
    `;
    const [rows] = await db.query<RowDataPacket[]>(sql, [userId]);
    return rows as DbProduct[];
  },

  /**
   * Añade o elimina un producto de la wishlist de un usuario usando el SP.
   */
  async toggle(connection: PoolConnection, userId: number, productId: number): Promise<void> {
    const sql = 'CALL sp_Wishlist_Toggle(?, ?);';
    await connection.query<ResultSetHeader>(sql, [userId, productId]);
  },
};
