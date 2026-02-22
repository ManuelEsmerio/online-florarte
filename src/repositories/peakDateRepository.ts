// src/repositories/peakDateRepository.ts
import db from '@/lib/db';
import type { DbPeakDate } from '@/lib/definitions';
import type { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';

export const peakDateRepository = {
  /**
   * Obtiene todas las fechas pico de la base de datos.
   */
  async findAll(): Promise<DbPeakDate[]> {
    const sql = `SELECT id, name, peak_date, is_coupon_restricted FROM peak_days WHERE is_deleted = 0 ORDER BY peak_date DESC;`;
    const [rows] = await db.query<RowDataPacket[]>(sql);
    return rows as DbPeakDate[];
  },

  async findById(id: number): Promise<DbPeakDate | null> {
    const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM peak_days WHERE id = ?', [id]);
    return (rows[0] as DbPeakDate) || null;
  },
  
  async findByDate(date: string): Promise<DbPeakDate[]> {
    const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM peak_days WHERE peak_date = ? AND is_deleted = 0', [date]);
    return rows as DbPeakDate[];
  },

  async findByName(name: string): Promise<DbPeakDate[]> {
    const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM peak_days WHERE name = ? AND is_deleted = 0', [name]);
    return rows as DbPeakDate[];
  },
  
  async create(connection: PoolConnection, data: Omit<DbPeakDate, 'id'>): Promise<number> {
    const sql = 'INSERT INTO peak_days (name, peak_date, is_coupon_restricted) VALUES (?, ?, ?)';
    const [result] = await connection.query<ResultSetHeader>(sql, [data.name, data.peak_date, data.is_coupon_restricted]);
    return result.insertId;
  },
  
  async update(connection: PoolConnection, id: number, data: Partial<Omit<DbPeakDate, 'id'>>): Promise<boolean> {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = Object.values(data);
    const sql = `UPDATE peak_days SET ${fields} WHERE id = ?`;
    const [result] = await connection.query<ResultSetHeader>(sql, [...values, id]);
    return result.affectedRows > 0;
  },

  async createOrUpdateByNameAndYear(connection: PoolConnection, data: Omit<DbPeakDate, 'id'>): Promise<void> {
    const sql = `
      INSERT INTO peak_days (name, peak_date, is_coupon_restricted)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
      is_coupon_restricted = VALUES(is_coupon_restricted),
      is_deleted = 0,
      deleted_at = NULL;
    `;
    // ON DUPLICATE KEY UPDATE requires a unique index on (name, YEAR(peak_date)) or similar.
    // A simpler approach for now might be a SELECT then INSERT/UPDATE.
    
    const year = new Date(data.peak_date).getFullYear();
    const [existing] = await connection.query<RowDataPacket[]>(
        'SELECT * FROM peak_days WHERE name = ? AND YEAR(peak_date) = ?',
        [data.name, year]
    );

    if (existing.length > 0) {
        await this.update(connection, existing[0].id, data);
    } else {
        await this.create(connection, data);
    }
  },
  
  async delete(connection: PoolConnection, id: number): Promise<boolean> {
    const [result] = await connection.query<ResultSetHeader>('UPDATE peak_days SET is_deleted = 1, deleted_at = NOW() WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },
};

    
