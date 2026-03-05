// src/app/api/admin/loyalty/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession, isAdminRole } from '@/utils/auth';
import { loyaltyHistoryService } from '@/services/loyaltyHistoryService';

/**
 * GET /api/admin/loyalty
 * Obtiene el historial de puntos de lealtad.
 */
export async function GET(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) return errorHandler(new Error('Acceso denegado.'), 401);
    
        if (!isAdminRole(session.role)) return errorHandler(new Error('Acceso prohibido.'), 403);
    
    const searchParams = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const { history, total } = await loyaltyHistoryService.getAllLoyaltyHistory(page, limit);
    return successResponse({ history, total, page, limit });
  } catch (error) {
    console.error('[API_ADMIN_LOYALTY_GET_ERROR]', error);
    return errorHandler(error);
  }
}
