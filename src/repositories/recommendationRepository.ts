// src/repositories/recommendationRepository.ts
import { initialProducts } from '@/lib/data/product-data';

/**
 * Encapsula las consultas SQL para el motor de recomendaciones.
 */
export const recommendationRepository = {

  /**
   * Busca los IDs de productos más populares en los últimos 30 días.
   */
  async findTrendingProductIds(limit: number): Promise<number[]> {
    // Mock: just return first N products
    return Promise.resolve(initialProducts.slice(0, limit).map(p => p.id));
  },

  /**
   * Busca IDs de productos similares basados en tags y ocasiones compartidas.
   */
  async findSimilarProductIdsByContent(productId: number, categoryId: number, limit: number): Promise<number[]> {
    // Mock: return products from same category excluding itself
    const similar = initialProducts
      .filter(p => p.category?.id === categoryId && p.id !== productId)
      .slice(0, limit)
      .map(p => p.id);
      
    if (similar.length < limit) {
      // Fill with others if not enough
      const others = initialProducts
        .filter(p => p.id !== productId && !similar.includes(p.id))
        .slice(0, limit - similar.length)
        .map(p => p.id);
      return Promise.resolve([...similar, ...others]);
    }
    
    return Promise.resolve(similar);
  },

  /**
   * Busca IDs de productos que se compran frecuentemente junto con un conjunto de productos.
   */
  async findFrequentlyBoughtTogetherIds(productIds: number[], limit: number): Promise<number[]> {
    // Mock: return random products not in the input list
    const others = initialProducts
        .filter(p => !productIds.includes(p.id))
        .slice(0, limit)
        .map(p => p.id);
    return Promise.resolve(others);
  },
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
