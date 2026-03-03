// src/lib/data/dashboard-data.ts
// Mock estático de estadísticas para el panel de administración.
// No requiere backend, API, ni base de datos.
import type { DashboardStats } from '@/lib/definitions';

export const mockDashboardStats: DashboardStats = {
  totalSales: { current: 45200, change: 12.5 },
  newCustomers: { current: 14, change: 7.3 },
  orders: { current: 38, change: -5.2 },
  usedCoupons: { current: 3200, change: 22.0 },
  salesData: [
    { name: 'Sep', total: 28000 },
    { name: 'Oct', total: 35000 },
    { name: 'Nov', total: 42000 },
    { name: 'Dic', total: 58000 },
    { name: 'Ene', total: 38000 },
    { name: 'Feb', total: 45200 },
  ],
  categoryProductCounts: [
    { name: 'Arreglos Florales', productCount: 15, isSubcategory: false },
    { name: 'Plantas', productCount: 8, isSubcategory: false },
    { name: 'Ramos', productCount: 12, isSubcategory: false },
    { name: 'Paquetes', productCount: 6, isSubcategory: false },
    { name: 'Regalos', productCount: 4, isSubcategory: false },
    { name: 'Rosas', productCount: 7, isSubcategory: true },
    { name: 'Girasoles', productCount: 5, isSubcategory: true },
    { name: 'Lirios', productCount: 4, isSubcategory: true },
    { name: 'Orquídeas', productCount: 3, isSubcategory: true },
    { name: 'Tulipanes', productCount: 6, isSubcategory: true },
  ],
  recentOrders: [
    { id: 101, customer_name: 'Juan Pérez', total: 850, status: 'completado' },
    { id: 102, customer_name: 'Maria Garcia', total: 1200, status: 'en_reparto' },
    { id: 103, customer_name: 'Carlos López', total: 650, status: 'pendiente' },
    { id: 104, customer_name: 'Ana Martínez', total: 980, status: 'procesando' },
    { id: 105, customer_name: 'Roberto Díaz', total: 430, status: 'cancelado' },
  ],
  recentActivity: [
    {
      type: 'new_order',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      entity_id: 105,
      details: { customer_name: 'Roberto Díaz' },
    },
    {
      type: 'new_user',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      entity_id: 6,
      details: { user_name: 'Sofía Ramírez' },
    },
    {
      type: 'low_stock',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      entity_id: 12,
      details: { product_name: 'Ramo de Rosas Rojas' },
    },
    {
      type: 'new_order',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      entity_id: 104,
      details: { customer_name: 'Ana Martínez' },
    },
    {
      type: 'new_user',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      entity_id: 5,
      details: { user_name: 'Miguel Torres' },
    },
  ],
};
