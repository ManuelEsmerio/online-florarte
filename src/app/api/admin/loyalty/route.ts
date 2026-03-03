// src/app/api/admin/loyalty/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession, isAdminRole } from '@/utils/auth';
import { userService } from '@/services/userService';
import { loyaltyHistoryService } from '@/services/loyaltyHistoryService';

/**
 * GET /api/admin/loyalty
 * Obtiene el historial de puntos de lealtad.
 */
export async function GET(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) return errorHandler(new Error('Acceso denegado.'), 401);
    
    const user = await userService.getUserById(session.dbId);
    if (!isAdminRole(user?.role)) return errorHandler(new Error('Acceso prohibido.'), 403);
    
    const history = await loyaltyHistoryService.getAllLoyaltyHistory();
    return successResponse(history);
  } catch (error) {
    console.error('[API_ADMIN_LOYALTY_GET_ERROR]', error);
    return errorHandler(error);
  }
}
