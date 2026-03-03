// src/app/api/admin/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession, isAdminRole } from '@/utils/auth';
import { userService } from '@/services/userService';
import { dashboardService } from '@/services/dashboard.service';

/**
 * GET /api/admin/dashboard
 * Endpoint protegido para obtener todas las estadísticas del dashboard.
 */
export async function GET(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) {
      return errorHandler(new Error('Acceso denegado.'), 401);
    }
    const user = await userService.getUserById(session.dbId);
    if (!isAdminRole(user?.role)) {
      return errorHandler(new Error('Acceso prohibido.'), 403);
    }
    
    const stats = await dashboardService.getDashboardStatistics();

    return successResponse(stats);

  } catch (error) {
    console.error('[API_ADMIN_DASHBOARD_GET_ERROR]', error);
    return errorHandler(error);
  }
}
