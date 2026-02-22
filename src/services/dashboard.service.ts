// src/services/dashboard.service.ts
import { dashboardRepository } from '../repositories/dashboardRepository';
import type { DashboardStats, RecentOrder, Activity, OrderStatus } from '@/lib/definitions';

const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) {
        return current > 0 ? Infinity : 0;
    }
    return ((current - previous) / previous) * 100;
};

export const dashboardService = {
    async getDashboardStatistics(): Promise<DashboardStats> {
        const [
            salesMetrics,
            customersMetrics,
            ordersMetrics,
            couponMetrics,
            salesData,
            recentOrdersData,
            recentActivityData,
            categoryProductCountsData,
        ] = await Promise.all([
            dashboardRepository.getSalesMetrics(),
            dashboardRepository.getNewCustomersMetrics(),
            dashboardRepository.getOrdersMetrics(),
            dashboardRepository.getCouponUsageMetrics(),
            dashboardRepository.getSalesForLastSixMonths(),
            dashboardRepository.getRecentOrders(5),
            dashboardRepository.getRecentActivities(5),
            dashboardRepository.getProductCountByCategory(),
        ]);

        const recentOrders: RecentOrder[] = recentOrdersData.map(order => ({
            id: order.id,
            customer_name: order.customer_name,
            total: Number(order.total),
            status: order.status as OrderStatus,
        }));
        
        const recentActivity: Activity[] = recentActivityData.map(activity => ({
            type: activity.type,
            timestamp: new Date(activity.timestamp).toISOString(),
            entity_id: activity.entity_id,
            details: activity.details
        }));

        return {
            totalSales: {
                current: salesMetrics.current_month,
                change: calculateChange(salesMetrics.current_month, salesMetrics.previous_month),
            },
            newCustomers: {
                current: customersMetrics.current_month,
                change: calculateChange(customersMetrics.current_month, customersMetrics.previous_month),
            },
            orders: {
                current: ordersMetrics.current_month,
                change: calculateChange(ordersMetrics.current_month, ordersMetrics.previous_month),
            },
            usedCoupons: {
                current: couponMetrics.current_month,
                change: calculateChange(couponMetrics.current_month, couponMetrics.previous_month),
            },
            salesData: salesData,
            categoryProductCounts: categoryProductCountsData,
            recentOrders: recentOrders,
            recentActivity: recentActivity,
        };
    }
};
