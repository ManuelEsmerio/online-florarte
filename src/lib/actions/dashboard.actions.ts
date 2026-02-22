// src/lib/actions/dashboard.actions.ts
'use server';

import { dashboardService } from '@/services/dashboard.service';
import type { DashboardStats } from '@/lib/definitions';

/**
 * Server action to fetch and compute all statistics required for the admin dashboard.
 * @returns A promise that resolves to the complete DashboardStats object.
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
    return await dashboardService.getDashboardStatistics();
};
