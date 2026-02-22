// src/repositories/recommendationRepository.ts
import db from '@/lib/db';
import type { RowDataPacket } from 'mysql2/promise';

/**
 * Encapsula las consultas SQL para el motor de recomendaciones.
 */
export const recommendationRepository = {

  /**
   * Busca los IDs de productos más populares en los últimos 30 días.
   */
  async findTrendingProductIds(limit: number): Promise<number[]> {
    const sql = `
      SELECT product_id, popularity_score, v_orders
      FROM v_product_popularity_30d
      ORDER BY popularity_score DESC, v_orders DESC
      LIMIT ?;
    `;
    const [rows] = await db.query<RowDataPacket[]>(sql, [limit]);
    return rows.map(row => row.product_id);
  },

  /**
   * Busca IDs de productos similares basados en tags y ocasiones compartidas.
   */
  async findSimilarProductIdsByContent(productId: number, categoryId: number, limit: number): Promise<number[]> {
    const sql = `
      SELECT
        p2.id AS recommended_product_id,
        (
          -- Puntuación por tags compartidos
          (SELECT COUNT(*) FROM product_tags pt1 JOIN product_tags pt2 ON pt1.tag_id = pt2.tag_id WHERE pt1.product_id = p1.id AND pt2.product_id = p2.id) * 2 +
          -- Puntuación por ocasiones compartidas
          (SELECT COUNT(*) FROM product_occasions po1 JOIN product_occasions po2 ON po1.occasion_id = po2.occasion_id WHERE po1.product_id = p1.id AND po2.product_id = p2.id)
        ) AS similarity_score
      FROM products p1
      JOIN products p2 ON p1.category_id = p2.category_id AND p1.id != p2.id
      WHERE p1.id = ? AND p2.is_deleted = 0 AND p2.status = 'publicado' AND p2.stock > 0
      ORDER BY similarity_score DESC
      LIMIT ?;
    `;
    const [rows] = await db.query<RowDataPacket[]>(sql, [productId, limit]);
    return rows.map(row => row.recommended_product_id);
  },

  /**
   * Busca IDs de productos que se compran frecuentemente junto con un conjunto de productos.
   */
  async findFrequentlyBoughtTogetherIds(productIds: number[], limit: number): Promise<number[]> {
    if (productIds.length === 0) return [];
    
    const placeholders = productIds.map(() => '?').join(',');
    const sql = `
      SELECT oi2.product_id, COUNT(oi2.product_id) AS frequency
      FROM order_items oi1
      JOIN order_items oi2 ON oi1.order_id = oi2.order_id AND oi1.product_id != oi2.product_id
      WHERE oi1.product_id IN (${placeholders})
        AND oi2.product_id NOT IN (${placeholders})
      GROUP BY oi2.product_id
      ORDER BY frequency DESC
      LIMIT ?;
    `;
    const params = [...productIds, ...productIds, limit];
    const [rows] = await db.query<RowDataPacket[]>(sql, params);
    return rows.map(row => row.product_id);
  },
  
  /**
   * Obtiene productos de fallback (destacados o más nuevos).
   */
  async findFallbackProductIds(limit: number, excludeIds: number[]): Promise<number[]> {
    let sql = `
      SELECT p.id 
      FROM products p
      LEFT JOIN product_tags pt ON p.id = pt.product_id
      LEFT JOIN tags t ON pt.tag_id = t.id AND t.name = 'destacado'
      WHERE p.is_deleted = 0 AND p.status = 'publicado'
    `;
    const params: any[] = [];
    if (excludeIds.length > 0) {
      sql += ` AND p.id NOT IN (?)`;
      params.push(excludeIds);
    }
    
    sql += `
      ORDER BY (t.id IS NOT NULL) DESC, p.created_at DESC
      LIMIT ?;
    `;
    params.push(limit);

    const [rows] = await db.query<RowDataPacket[]>(sql, params);
    return rows.map(row => row.id);
  },

  async findProductsByIds(productIds: number[]): Promise<any[]> {
    if (productIds.length === 0) return [];
    const placeholders = productIds.map(() => '?').join(',');
    const sql = `SELECT * FROM products WHERE id IN (${placeholders})`;
    const [rows] = await db.query<RowDataPacket[]>(sql, [productIds]);
    return rows;
  }
};
