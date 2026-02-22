// src/repositories/announcementRepository.ts
import db from '@/lib/db';
import type { Announcement } from '@/lib/definitions';
import type { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';

export const announcementRepository = {
  async findAll(): Promise<Announcement[]> {
    const sql = `SELECT * FROM product_all_banners WHERE is_deleted = 0 ORDER BY sort_order ASC, created_at DESC;`;
    const [rows] = await db.query<RowDataPacket[]>(sql);
    return rows as Announcement[];
  },

  async findById(id: number): Promise<Announcement | null> {
    const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM product_all_banners WHERE id = ? AND is_deleted = 0', [id]);
    return (rows[0] as Announcement) || null;
  },

  async create(connection: PoolConnection, data: Omit<Announcement, 'id'>): Promise<number> {
    const sql = 'INSERT INTO product_all_banners (title, description, button_text, button_link, image_url, image_mobile_url, is_active, start_at, end_at, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const [result] = await connection.query<ResultSetHeader>(sql, [
      data.title, data.description, data.button_text, data.button_link, data.image_url, data.image_mobile_url, data.is_active, data.start_at, data.end_at, data.sort_order
    ]);
    return result.insertId;
  },

  async update(connection: PoolConnection, id: number, data: Partial<Omit<Announcement, 'id'>>): Promise<boolean> {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = Object.values(data);
    if (fields.length === 0) return true;
    const sql = `UPDATE product_all_banners SET ${fields} WHERE id = ?`;
    const [result] = await connection.query<ResultSetHeader>(sql, [...values, id]);
    return result.affectedRows > 0;
  },

  async delete(connection: PoolConnection, id: number): Promise<boolean> {
    const [result] = await connection.query<ResultSetHeader>('UPDATE product_all_banners SET is_deleted = 1, deleted_at = NOW() WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },
};
