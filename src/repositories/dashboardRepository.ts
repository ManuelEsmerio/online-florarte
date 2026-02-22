// src/repositories/dashboardRepository.ts
import db from '@/lib/db';
import type { RowDataPacket } from 'mysql2/promise';

type MetricResult = { current_month: number; previous_month: number };

const getMonthlyMetrics = async (query: string): Promise<MetricResult> => {
    const [rows] = await db.query<RowDataPacket[]>(query);
    const data = rows[0];
    return {
        current_month: Number(data.current_month_total) || 0,
        previous_month: Number(data.previous_month_total) || 0,
    };
};

export const dashboardRepository = {
    async getSalesMetrics(): Promise<MetricResult> {
        const query = `
            SELECT
                SUM(CASE WHEN DATE_FORMAT(o.created_at, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m') THEN o.total ELSE 0 END) as current_month_total,
                SUM(CASE WHEN DATE_FORMAT(o.created_at, '%Y-%m') = DATE_FORMAT(CURDATE() - INTERVAL 1 MONTH, '%Y-%m') THEN o.total ELSE 0 END) as previous_month_total
            FROM orders o
            JOIN order_statuses os ON o.order_status_id = os.id
            WHERE o.is_deleted = 0 AND os.code = 'completado';
        `;
        return getMonthlyMetrics(query);
    },

    async getNewCustomersMetrics(): Promise<MetricResult> {
        const query = `
            SELECT
                COUNT(CASE WHEN DATE_FORMAT(created_at, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m') THEN id ELSE NULL END) as current_month_total,
                COUNT(CASE WHEN DATE_FORMAT(created_at, '%Y-%m') = DATE_FORMAT(CURDATE() - INTERVAL 1 MONTH, '%Y-%m') THEN id ELSE NULL END) as previous_month_total
            FROM users
            WHERE is_deleted = 0;
        `;
        return getMonthlyMetrics(query);
    },

    async getOrdersMetrics(): Promise<MetricResult> {
        const query = `
            SELECT
                COUNT(CASE WHEN DATE_FORMAT(created_at, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m') THEN id ELSE NULL END) as current_month_total,
                COUNT(CASE WHEN DATE_FORMAT(created_at, '%Y-%m') = DATE_FORMAT(CURDATE() - INTERVAL 1 MONTH, '%Y-%m') THEN id ELSE NULL END) as previous_month_total
            FROM orders
            WHERE is_deleted = 0;
        `;
        return getMonthlyMetrics(query);
    },

    async getCouponUsageMetrics(): Promise<MetricResult> {
        const query = `
            SELECT
                SUM(CASE WHEN DATE_FORMAT(created_at, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m') THEN coupon_discount ELSE 0 END) as current_month_total,
                SUM(CASE WHEN DATE_FORMAT(created_at, '%Y-%m') = DATE_FORMAT(CURDATE() - INTERVAL 1 MONTH, '%Y-%m') THEN coupon_discount ELSE 0 END) as previous_month_total
            FROM orders
            WHERE is_deleted = 0 AND coupon_id IS NOT NULL AND coupon_discount > 0;
        `;
        return getMonthlyMetrics(query);
    },

    async getSalesForLastSixMonths(): Promise<{ name: string; total: number }[]> {
        const query = `
            SELECT
            DATE_FORMAT(o.created_at, '%b') as name,
                SUM(o.total) as total
            FROM orders o
            JOIN order_statuses os ON o.order_status_id = os.id
            WHERE o.created_at >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH) 
            AND o.is_deleted = 0 
            AND os.code = 'completado'
            GROUP BY YEAR(o.created_at), MONTH(o.created_at), DATE_FORMAT(o.created_at, '%b')
            ORDER BY YEAR(o.created_at), MONTH(o.created_at);
        `;
        const [rows] = await db.query<RowDataPacket[]>(query);
        return rows.map(row => ({ name: row.name, total: Number(row.total) }));
    },
    
    async getRecentOrders(limit: number = 5): Promise<any[]> {
        const query = `
            SELECT o.id, u.name as customer_name, o.total, os.code as status
            FROM orders o
            JOIN users u ON o.user_id = u.id
            JOIN order_statuses os ON o.order_status_id = os.id
            WHERE o.is_deleted = 0
            ORDER BY o.created_at DESC
            LIMIT ?;
        `;
        const [rows] = await db.query<RowDataPacket[]>(query, [limit]);
        return rows;
    },

    async getRecentActivities(limit: number = 5): Promise<any[]> {
        const query = `
           SELECT * FROM (
                (
                    SELECT 
                        'new_order' as type, 
                        o.id as entity_id, 
                        o.created_at as timestamp, 
                        JSON_OBJECT('customer_name', u.name) as details
                    FROM orders o
                    JOIN users u ON o.user_id = u.id
                    WHERE o.id IS NOT NULL
                    ORDER BY o.created_at DESC
                    LIMIT ?
                )
                UNION ALL
                (
                    SELECT 
                        'new_user' as type, 
                        u.id as entity_id, 
                        u.created_at as timestamp, 
                        JSON_OBJECT('user_name', u.name) as details
                    FROM users u
                    WHERE u.role = 'customer' AND u.id IS NOT NULL
                    ORDER BY u.created_at DESC
                    LIMIT ?
                )
            ) as activities
            ORDER BY timestamp DESC
            LIMIT ?;
        `;
        const [rows] = await db.query<RowDataPacket[]>(query, [limit, limit, limit]);
        return rows;
    },
    
    async getProductCountByCategory(): Promise<{ name: string; productCount: number, isSubcategory: boolean }[]> {
        const query = `
            SELECT 
                c.name,
                COUNT(p.id) as productCount,
                (c.parent_id IS NOT NULL) as isSubcategory
            FROM categories c
            LEFT JOIN products p ON c.id = p.category_id AND p.is_deleted = 0
            WHERE c.is_deleted = 0
            GROUP BY c.id
            ORDER BY isSubcategory, c.name;
        `;
        const [rows] = await db.query<RowDataPacket[]>(query);
        return rows.map(row => ({
            name: row.name,
            productCount: Number(row.productCount),
            isSubcategory: !!row.isSubcategory,
        }));
    }
};
