// src/app/api/wishlist/route.ts
import { NextRequest } from 'next/server';
import { wishlistService } from '@/services/wishlistService';
import { errorHandler, successResponse } from '@/utils/api-utils';
import { getDecodedToken, UserSession } from '@/utils/auth';

/**
 * GET /api/wishlist
 * Obtiene la lista de deseos del usuario autenticado.
 */
export async function GET(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) {
      // Si no hay usuario, es un invitado. Devolvemos una wishlist vacía.
      // La lógica del lado del cliente podría manejar una wishlist local.
      return successResponse({ wishlistItems: [], productIds: [] });
    }

    const wishlistData = await wishlistService.getWishlistByUserId(session.dbId);
    
    return successResponse(wishlistData);

  } catch (error) {
    console.error('[API_WISHLIST_GET_ERROR]', error);
    return errorHandler(error);
  }
}

/**
 * POST /api/wishlist
 * Añade o elimina (soft delete) un producto de la lista de deseos del usuario.
 */
export async function POST(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) {
      return errorHandler(new Error('No autorizado. Debes iniciar sesión para guardar favoritos.'), 401);
    }
    const { productId } = await req.json();
    if (!productId) {
      return errorHandler(new Error('El ID del producto es requerido.'), 400);
    }
    
    await wishlistService.toggleWishlist(session.dbId, productId);
    
    return successResponse({ message: 'Wishlist actualizada correctamente.' }, 200);
  } catch (error) {
    console.error('[API_WISHLIST_POST_ERROR]', error);
    return errorHandler(error);
  }
}
