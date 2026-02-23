// src/repositories/dashboardRepository.ts
import type { RowDataPacket } from '@/lib/db';

type MetricResult = { current_month: number; previous_month: number };

export const dashboardRepository = {
    async getSalesMetrics(): Promise<MetricResult> {
        // Mock data
        return Promise.resolve({
            current_month: 25400,
            previous_month: 21000,
        });
    },

    async getNewCustomersMetrics(): Promise<MetricResult> {
        return Promise.resolve({
            current_month: 45,
            previous_month: 38,
        });
    },

    async getOrdersMetrics(): Promise<MetricResult> {
        return Promise.resolve({
            current_month: 120,
            previous_month: 95,
        });
    },

    async getCouponUsageMetrics(): Promise<MetricResult> {
        return Promise.resolve({
            current_month: 3200,
            previous_month: 2800,
        });
    },

    async getSalesForLastSixMonths(): Promise<{ name: string; total: number }[]> {
        return Promise.resolve([
            { name: 'Ene', total: 18000 },
            { name: 'Feb', total: 22000 },
            { name: 'Mar', total: 20000 },
            { name: 'Abr', total: 24000 },
            { name: 'May', total: 28000 },
            { name: 'Jun', total: 25400 },
        ]);
    },
    
    async getRecentOrders(limit: number = 5): Promise<any[]> {
        return Promise.resolve([
            { id: 105, customer_name: 'Ana García', total: 1200, status: 'completado' },
            { id: 104, customer_name: 'Carlos Ruiz', total: 850, status: 'procesando' },
            { id: 103, customer_name: 'María López', total: 1500, status: 'en_reparto' },
            { id: 102, customer_name: 'Juan Pérez', total: 450, status: 'pendiente' },
            { id: 101, customer_name: 'Lucía Méndez', total: 2100, status: 'completado' },
        ].slice(0, limit));
    },

    async getRecentActivities(limit: number = 5): Promise<any[]> {
        return Promise.resolve([
            { type: 'new_order', entity_id: 105, timestamp: new Date().toISOString(), details: { customer_name: 'Ana García' } },
            { type: 'new_user', entity_id: 45, timestamp: new Date(Date.now() - 3600000).toISOString(), details: { user_name: 'Pedro Sánchez' } },
            { type: 'new_order', entity_id: 104, timestamp: new Date(Date.now() - 7200000).toISOString(), details: { customer_name: 'Carlos Ruiz' } },
        ].slice(0, limit));
    },
    
    async getProductCountByCategory(): Promise<{ name: string; productCount: number, isSubcategory: boolean }[]> {
        return Promise.resolve([
            { name: 'Ramos', productCount: 15, isSubcategory: false },
            { name: 'Arreglos', productCount: 12, isSubcategory: false },
            { name: 'Cajas', productCount: 8, isSubcategory: true },
            { name: 'Eventos', productCount: 5, isSubcategory: true },
        ]);
    }
};
