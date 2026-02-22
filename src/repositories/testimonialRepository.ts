// src/repositories/testimonialRepository.ts
import db from '@/lib/db';
import type { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';
import type { Testimonial } from '@/lib/definitions';


export const testimonialRepository = {
  /**
   * Obtiene todos los testimonios que han sido aprobados.
   * Une las tablas `testimonials` y `users` para obtener el nombre del autor.
   * @returns Una promesa que resuelve a un array de testimonios con datos del usuario.
   */
  async findApproved(): Promise<any[]> {
    // La consulta SQL une las tablas y selecciona solo los testimonios con estado 'aprobado'.
    // También selecciona el nombre y la URL de la foto de perfil del usuario para mostrarlos.
    const sql = `
      SELECT 
        t.id,
        t.user_id,
        u.name as user_name,
        u.profile_pic_url as user_profile_pic,
        t.order_id,
        t.rating,
        t.comment,
        t.status,
        t.created_at
      FROM testimonials t
      JOIN users u ON t.user_id = u.id
      WHERE t.status = 'aprobado' AND t.is_deleted = 0
      ORDER BY t.created_at DESC;
    `;
    const [rows] = await db.query<RowDataPacket[]>(sql);
    return rows;
  },

  async findByOrder(connection: PoolConnection, orderId: number): Promise<any | null> {
    const [rows] = await connection.query<RowDataPacket[]>('SELECT * FROM testimonials WHERE order_id = ? AND is_deleted = 0', [orderId]);
    return rows[0] || null;
  },

  /**
   * Envía un nuevo testimonio usando el Stored Procedure.
   */
  async submit(connection: PoolConnection, userId: number, orderId: number, rating: number, comment: string): Promise<number> {
    const sql = 'CALL sp_Testimonial_Submit(?, ?, ?, ?, @new_id)';
    await connection.query(sql, [userId, orderId, rating, comment]);
    const [[{ new_id }]] = await connection.query('SELECT @new_id as new_id');
    return new_id as number;
  },

  async update(connection: PoolConnection, id: number, data: { rating: number, comment: string }): Promise<boolean> {
    const sql = 'UPDATE testimonials SET rating = ?, comment = ?, status = "pending", updated_at = NOW() WHERE id = ?';
    const [result] = await connection.query<ResultSetHeader>(sql, [data.rating, data.comment, id]);
    return result.affectedRows > 0;
  },

  /**
   * Actualiza el estado de un testimonio usando el Stored Procedure.
   */
  async setStatus(connection: PoolConnection, id: number, status: 'pending' | 'approved' | 'rejected'): Promise<boolean> {
    const sql = 'CALL sp_Testimonial_SetStatus(?, ?)';
    const [result] = await connection.query<ResultSetHeader>(sql, [id, status]);
    return result.affectedRows > 0;
  }
};
