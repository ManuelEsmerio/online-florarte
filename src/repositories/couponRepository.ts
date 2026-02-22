// src/repositories/couponRepository.ts
import db from '@/lib/db';
import type { DbCoupon, User, Product, ProductCategory } from '@/lib/definitions';
import type { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';

type FindAllParams = {
  search: string;
  status: string[];
  page: number;
  limit: number;
};

type CreateCouponParams = {
  p_code: string;
  p_description: string;
  p_discount_type: string;
  p_discount_value: number;
  p_scope: string;
  p_max_uses: number | null;
  p_valid_from: Date;
  p_valid_until: Date | null;
  p_user_ids_csv: string | null;
  p_category_ids_csv: string | null;
  p_product_ids_csv: string | null;
}

type UpdateCouponParams = CreateCouponParams & { p_coupon_id: number; };

type ValidateCartParams = {
  couponCode: string;
  userId: number | null;
  sessionId: string | null;
  deliveryDate: string | null;
};

type ValidateCartResult = {
  o_coupon_id: number;
  o_scope: string;
  o_discount_type: string;
  o_discount_value: number;
  o_applicable: number;
  o_reason: string;
  o_matched_items: number;
}


export const couponRepository = {
  async findAll({ search, status, page, limit }: FindAllParams): Promise<DbCoupon[]> {
    let sql = 'SELECT * FROM coupons WHERE is_deleted = 0';
    const params: (string | number)[] = [];
    const whereClauses: string[] = [];

    if (search) {
      whereClauses.push('(code LIKE ? OR description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status.length > 0 && status[0] !== '') {
       const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
       const statusConditions = status.map(s => {
          if (s === 'vigente') return `(valid_until IS NULL OR valid_until > '${now}') AND (max_uses IS NULL OR uses_count < max_uses)`;
          if (s === 'vencido') return `(valid_until IS NOT NULL AND valid_until <= '${now}')`;
          if (s === 'utilizado') return `(max_uses IS NOT NULL AND uses_count >= max_uses)`;
          return '';
       }).filter(Boolean);
       
       if(statusConditions.length > 0) {
           whereClauses.push(`(${statusConditions.join(' OR ')})`);
       }
    }
    
    if (whereClauses.length) {
      sql += ` AND ${whereClauses.join(' AND ')}`;
    }
    
    sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);

    const [rows] = await db.query<RowDataPacket[]>(sql, params);
    return rows as DbCoupon[];
  },

  async countAll({ search, status }: Omit<FindAllParams, 'page' | 'limit'>): Promise<number> {
    let sql = 'SELECT COUNT(*) as count FROM coupons WHERE is_deleted = 0';
    const params: string[] = [];
    const whereClauses: string[] = [];

    if (search) {
      whereClauses.push('(code LIKE ? OR description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
     if (status.length > 0 && status[0] !== '') {
       const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
       const statusConditions = status.map(s => {
          if (s === 'vigente') return `(valid_until IS NULL OR valid_until > '${now}') AND (max_uses IS NULL OR uses_count < max_uses)`;
          if (s === 'vencido') return `(valid_until IS NOT NULL AND valid_until <= '${now}')`;
          if (s === 'utilizado') return `(max_uses IS NOT NULL AND uses_count >= max_uses)`;
          return '';
       }).filter(Boolean);
       
       if(statusConditions.length > 0) {
           whereClauses.push(`(${statusConditions.join(' OR ')})`);
       }
    }

    if (whereClauses.length) {
      sql += ` AND ${whereClauses.join(' AND ')}`;
    }

    const [rows] = await db.query<RowDataPacket[]>(sql, params);
    return rows[0].count;
  },

  async findById(id: number): Promise<DbCoupon | null> {
    const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM coupons WHERE id = ? AND is_deleted = 0', [id]);
    return (rows[0] as DbCoupon) || null;
  },
  
  async findCouponsByIds(ids: number[]): Promise<DbCoupon[]> {
    if (ids.length === 0) return [];
    const placeholders = ids.map(() => '?').join(',');
    const [rows] = await db.query<RowDataPacket[]>(`SELECT * FROM coupons WHERE id IN (${placeholders})`, ids);
    return rows as DbCoupon[];
  },

  async findForUser(userId: number): Promise<DbCoupon[]> {
    const sql = `
      SELECT c.* 
      FROM coupons c
      LEFT JOIN cupon_user cu ON c.id = cu.coupon_id
      WHERE 
        c.is_deleted = 0 
        AND (
          c.scope = 'global' 
          OR cu.user_id = ?
        )
      GROUP BY c.id
      ORDER BY c.created_at DESC;
    `;
    const [rows] = await db.query<RowDataPacket[]>(sql, [userId]);
    return rows as DbCoupon[];
  },

  async findByCode(code: string): Promise<DbCoupon | null> {
    const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM coupons WHERE code = ? AND is_deleted = 0', [code]);
    return (rows[0] as DbCoupon) || null;
  },

  async create(connection: PoolConnection, params: CreateCouponParams): Promise<number> {
    const sql = 'CALL sp_Coupon_Create(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @new_id)';
    await connection.query(sql, [
      params.p_code,
      params.p_description,
      params.p_discount_type,
      params.p_discount_value,
      params.p_scope,
      params.p_max_uses,
      params.p_valid_from,
      params.p_valid_until,
      params.p_user_ids_csv,
      params.p_category_ids_csv,
      params.p_product_ids_csv
    ]);
    const [[{ new_id }]] = await connection.query('SELECT @new_id as new_id');
    return new_id as number;
  },
  
  async update(connection: PoolConnection, params: UpdateCouponParams): Promise<boolean> {
    const sql = 'CALL sp_Coupon_Update(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const [result] = await connection.query<ResultSetHeader>(sql, [
        params.p_coupon_id,
        params.p_code,
        params.p_description,
        params.p_discount_type,
        params.p_discount_value,
        params.p_scope,
        params.p_max_uses,
        params.p_valid_from,
        params.p_valid_until,
        params.p_user_ids_csv,
        params.p_category_ids_csv,
        params.p_product_ids_csv
    ]);
    return result.affectedRows > 0;
  },
  
  async delete(connection: PoolConnection, id: number): Promise<boolean> {
    const sql = 'UPDATE coupons SET is_deleted = 1, deleted_at = now() WHERE id = ?';
    const [result] = await connection.query<ResultSetHeader>(sql, [id]);
    return result.affectedRows > 0;
  },
  
  async bulkDelete(connection: PoolConnection, ids: number[]): Promise<number> {
    if (ids.length === 0) return 0;
    const placeholders = ids.map(() => '?').join(',');
    const sql = `UPDATE coupons SET is_deleted = 1, deleted_at = now() WHERE id IN (${placeholders})`;
    const [result] = await connection.query<ResultSetHeader>(sql, ids);
    return result.affectedRows;
  },

  async findRelatedUsers(couponId: number): Promise<Pick<User, 'id' | 'name'>[]> {
    const [rows] = await db.query<RowDataPacket[]>(`
      SELECT u.id, u.name 
      FROM cupon_user cu 
      JOIN users u ON cu.user_id = u.id 
      WHERE cu.coupon_id = ? AND u.is_deleted = 0
    `, [couponId]);
    return rows as Pick<User, 'id' | 'name'>[];
  },

  async findRelatedProducts(couponId: number): Promise<Pick<Product, 'id' | 'name'>[]> {
    const [rows] = await db.query<RowDataPacket[]>(`
      SELECT p.id, p.name 
      FROM cupon_product cp
      JOIN products p ON cp.product_id = p.id
      WHERE cp.coupon_id = ? AND p.is_deleted = 0
    `, [couponId]);
    return rows as Pick<Product, 'id' | 'name'>[];
  },

  async findRelatedCategories(couponId: number): Promise<Pick<ProductCategory, 'id' | 'name'>[]> {
     const [rows] = await db.query<RowDataPacket[]>(`
      SELECT c.id, c.name
      FROM coupon_categories cc
      JOIN categories c ON cc.category_id = c.id
      WHERE cc.coupon_id = ? AND c.is_deleted = 0
    `, [couponId]);
    return rows as Pick<ProductCategory, 'id' | 'name'>[];
  },

  async validateForCart(params: ValidateCartParams): Promise<ValidateCartResult> {
    const sql = 'CALL sp_Coupon_Validate_FromCart(?, ?, ?, ?, @o_coupon_id, @o_scope, @o_discount_type, @o_discount_value, @o_applicable, @o_reason, @o_matched_items)';
    await db.query(sql, [params.couponCode, params.userId, params.sessionId, params.deliveryDate]);
    const [[result]] = await db.query<RowDataPacket[]>('SELECT @o_coupon_id AS o_coupon_id, @o_scope AS o_scope, @o_discount_type AS o_discount_type, @o_discount_value AS o_discount_value, @o_applicable AS o_applicable, @o_reason AS o_reason, @o_matched_items AS o_matched_items');
    
    return {
      o_coupon_id: Number(result.o_coupon_id),
      o_scope: result.o_scope,
      o_discount_type: result.o_discount_type,
      o_discount_value: Number(result.o_discount_value),
      o_applicable: Number(result.o_applicable),
      o_reason: result.o_reason,
      o_matched_items: Number(result.o_matched_items),
    };
  }
};
