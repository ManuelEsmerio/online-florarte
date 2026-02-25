// src/services/dashboard.service.ts
import { prisma } from '@/lib/prisma';
import type { DashboardStats, RecentOrder, Activity, OrderStatus } from '@/lib/definitions';

function getMonthRange() {
  const now = new Date();
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { startOfCurrentMonth, startOfPreviousMonth };
}

const calculateChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? Infinity : 0;
  return ((current - previous) / previous) * 100;
};

const ORDER_STATUS_MAP: Record<string, string> = {
  PENDING: 'pendiente',
  PROCESSING: 'procesando',
  SHIPPED: 'en_reparto',
  DELIVERED: 'completado',
  CANCELLED: 'cancelado',
};

export const dashboardService = {
  async getDashboardStatistics(): Promise<DashboardStats> {
    const { startOfCurrentMonth, startOfPreviousMonth } = getMonthRange();

    const [
      currentSalesAgg, previousSalesAgg,
      currentCustomers, previousCustomers,
      currentOrders, previousOrders,
      currentCouponAgg, previousCouponAgg,
      recentOrdersRaw, recentUsersRaw,
      categoriesRaw,
    ] = await Promise.all([
      prisma.order.aggregate({ where: { createdAt: { gte: startOfCurrentMonth }, status: { not: 'CANCELLED' } }, _sum: { total: true } }),
      prisma.order.aggregate({ where: { createdAt: { gte: startOfPreviousMonth, lt: startOfCurrentMonth }, status: { not: 'CANCELLED' } }, _sum: { total: true } }),
      prisma.user.count({ where: { createdAt: { gte: startOfCurrentMonth }, role: 'CUSTOMER' } }),
      prisma.user.count({ where: { createdAt: { gte: startOfPreviousMonth, lt: startOfCurrentMonth }, role: 'CUSTOMER' } }),
      prisma.order.count({ where: { createdAt: { gte: startOfCurrentMonth } } }),
      prisma.order.count({ where: { createdAt: { gte: startOfPreviousMonth, lt: startOfCurrentMonth } } }),
      prisma.order.aggregate({ where: { createdAt: { gte: startOfCurrentMonth }, couponId: { not: null } }, _sum: { couponDiscount: true } }),
      prisma.order.aggregate({ where: { createdAt: { gte: startOfPreviousMonth, lt: startOfCurrentMonth }, couponId: { not: null } }, _sum: { couponDiscount: true } }),
      prisma.order.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true } } } }),
      prisma.user.findMany({ take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, name: true, createdAt: true } }),
      prisma.productCategory.findMany({ where: { isDeleted: false }, include: { _count: { select: { products: { where: { isDeleted: false } } } } } }),
    ]);

    // Sales last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const recentOrdersForChart = await prisma.order.findMany({
      where: { createdAt: { gte: sixMonthsAgo }, status: { not: 'CANCELLED' } },
      select: { createdAt: true, total: true },
    });

    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const salesByMonth: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      salesByMonth[monthNames[d.getMonth()]] = 0;
    }
    for (const order of recentOrdersForChart) {
      const key = monthNames[order.createdAt.getMonth()];
      if (key in salesByMonth) salesByMonth[key] += Number(order.total);
    }
    const salesData = Object.entries(salesByMonth).map(([name, total]) => ({ name, total }));

    // Recent orders
    const recentOrders: RecentOrder[] = recentOrdersRaw.map(o => ({
      id: o.id,
      customer_name: o.user.name,
      total: Number(o.total),
      status: ORDER_STATUS_MAP[o.status] as OrderStatus,
    }));

    // Recent activities (orders + new users merged and sorted)
    const orderActivities = recentOrdersRaw.map(o => ({
      type: 'new_order' as const,
      entity_id: o.id,
      timestamp: o.createdAt.toISOString(),
      details: { customer_name: o.user.name },
    }));
    const userActivities = recentUsersRaw.map(u => ({
      type: 'new_user' as const,
      entity_id: u.id,
      timestamp: u.createdAt.toISOString(),
      details: { user_name: u.name },
    }));
    const recentActivity: Activity[] = [...orderActivities, ...userActivities]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);

    // Category product counts
    const categoryProductCounts = categoriesRaw.map(c => ({
      name: c.name,
      productCount: c._count.products,
      isSubcategory: c.parentId !== null,
    }));

    const currentSales = Number(currentSalesAgg._sum.total ?? 0);
    const previousSales = Number(previousSalesAgg._sum.total ?? 0);
    const currentCoupons = Number(currentCouponAgg._sum.couponDiscount ?? 0);
    const previousCoupons = Number(previousCouponAgg._sum.couponDiscount ?? 0);

    return {
      totalSales: { current: currentSales, change: calculateChange(currentSales, previousSales) },
      newCustomers: { current: currentCustomers, change: calculateChange(currentCustomers, previousCustomers) },
      orders: { current: currentOrders, change: calculateChange(currentOrders, previousOrders) },
      usedCoupons: { current: currentCoupons, change: calculateChange(currentCoupons, previousCoupons) },
      salesData,
      categoryProductCounts,
      recentOrders,
      recentActivity,
    };
  },
};
