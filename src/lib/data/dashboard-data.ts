// src/lib/data/dashboard-data.ts
import { dashboardService } from '@/services/dashboard.service';
import type { DashboardStats } from '@/lib/definitions';
import { useAuth } from '@/context/AuthContext';

/**
 * Fetches and computes all statistics required for the admin dashboard.
 * @returns A promise that resolves to the complete DashboardStats object.
 */
// This function is now OBSOLETE as the logic has been moved to a server action.
// It is kept here to avoid breaking imports, but it should not be used directly
// in client components.
export const getDashboardStats = async (apiFetch?: any): Promise<DashboardStats> => {
    // The apiFetch parameter is kept for signature consistency but is not used
    // as the service layer now directly accesses the repository.
    return await dashboardService.getDashboardStatistics();
};
