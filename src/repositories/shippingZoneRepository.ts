// src/repositories/shippingZoneRepository.ts
import db from '@/lib/db';
import type { DbShippingZone } from '@/lib/definitions';
import type { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';

export const shippingZoneRepository = {
  /**
   * Obtiene todas las zonas de envío de la base de datos,
   * ordenadas por código postal.
   * @returns Una promesa que resuelve a un array de DbShippingZone.
   */
  async findAll(): Promise<DbShippingZone[]> {
    const sql = 'SELECT id, postal_code, locality, shipping_cost FROM shipping_zones WHERE is_deleted = 0 ORDER BY postal_code ASC';
    const [rows] = await db.query<RowDataPacket[]>(sql);
    return rows as DbShippingZone[];
  },

  /**
   * Busca una zona de envío específica por su código postal.
   */
  async findByPostalCode(postalCode: string): Promise<DbShippingZone | null> {
    const sql = 'SELECT id, postal_code, locality, shipping_cost FROM shipping_zones WHERE is_deleted = 0 AND postal_code = ? LIMIT 1';
    const [rows] = await db.query<RowDataPacket[]>(sql, [postalCode]);
    return (rows[0] as DbShippingZone) || null;
  },

  /**
   * Busca una zona de envío específica por su ID.
   */
  async findById(id: number): Promise<DbShippingZone | null> {
    const sql = 'SELECT id, postal_code, locality, shipping_cost FROM shipping_zones WHERE is_deleted = 0 AND id = ? LIMIT 1';
    const [rows] = await db.query<RowDataPacket[]>(sql, [id]);
    return (rows[0] as DbShippingZone) || null;
  },
  
  /**
   * Crea una nueva zona de envío.
   */
  async create(connection: PoolConnection, data: Omit<DbShippingZone, 'id'>): Promise<number> {
    const sql = 'INSERT INTO shipping_zones (postal_code, locality, shipping_cost) VALUES (?, ?, ?)';
    const [result] = await connection.query<ResultSetHeader>(sql, [data.postal_code, data.locality, data.shipping_cost]);
    return result.insertId;
  },

  /**
   * Actualiza una zona de envío existente.
   */
  async update(connection: PoolConnection, id: number, data: Partial<Omit<DbShippingZone, 'id'>>): Promise<boolean> {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = Object.values(data);
    const sql = `UPDATE shipping_zones SET ${fields} WHERE id = ?`;
    const [result] = await connection.query<ResultSetHeader>(sql, [...values, id]);
    return result.affectedRows > 0;
  },

  /**
   * Elimina una zona de envío.
   */
  async delete(connection: PoolConnection, id: number): Promise<boolean> {
    const sql = 'UPDATE shipping_zones SET is_deleted = 1, deleted_at = now() WHERE id = ?';
    const [result] = await connection.query<ResultSetHeader>(sql, [id]);
    return result.affectedRows > 0;
  }
};
