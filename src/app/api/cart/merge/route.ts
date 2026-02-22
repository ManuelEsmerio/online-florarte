// src/app/api/cart/merge/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { cartService } from '@/services/cartService';
import { getDecodedToken, type UserSession } from '@/utils/auth';
import { successResponse, errorHandler } from '@/utils/api-utils';

/**
 * POST /api/cart/merge
 * Endpoint para fusionar el carrito de un invitado (session_id) con el de un
 * usuario autenticado. Este endpoint debe ser llamado inmediatamente después
 * de que un usuario inicie sesión o se registre.
 */
export async function POST(req: NextRequest) {
  try {
    const user: UserSession | null = await getDecodedToken(req);
    
    // 1. Validar que el usuario esté autenticado.
    if (!user?.dbId || !user.firebaseUid) {
      return errorHandler(new Error('Acceso denegado. Se requiere autenticación.'), 401);
    }
    
    const { sessionId } = await req.json();

    // 2. Si no hay sessionId en el body, no hay nada que hacer.
    if (!sessionId) {
      return successResponse({ message: 'No session to merge.' }, 204);
    }
    
    // 3. Llamar al servicio para realizar la fusión.
    const result = await cartService.mergeGuestCart(sessionId, user.dbId);
    
    return successResponse(result);

  } catch (error: any) {
    return errorHandler(error);
  }
}
