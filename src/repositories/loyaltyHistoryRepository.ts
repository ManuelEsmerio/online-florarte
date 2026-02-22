// src/repositories/loyaltyHistoryRepository.ts
import db from '@/lib/db';
import type { RowDataPacket } from 'mysql2/promise';

export const loyaltyHistoryRepository = {
  /**
   * Obtiene todo el historial de puntos, uniendo con la tabla de usuarios
   * para obtener el nombre y correo del cliente.
   * @returns Una promesa que resuelve a un array de todos los registros del historial.
   */
  async findAll(): Promise<any[]> {
    const sql = `
      SELECT 
        lh.id,
        lh.user_id,
        u.name as user_name,
        u.email as user_email,
        lh.order_id,
        lh.points,
        lh.transaction_type,
        lh.notes,
        lh.created_at
      FROM loyalty_history lh
      JOIN users u ON lh.user_id = u.id
      ORDER BY lh.created_at DESC;
    `;
    const [rows] = await db.query<RowDataPacket[]>(sql);
    return rows;
  },
};
