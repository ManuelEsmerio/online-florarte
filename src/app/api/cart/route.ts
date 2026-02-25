// src/app/api/cart/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getIdentity } from '@/utils/request-utils';
import { cartService } from '@/services/cartService';

/**
 * GET /api/cart
 * Obtiene el contenido del carrito para la sesión/usuario actual.
 */
export async function GET(req: NextRequest) {
  try {
    const { userId, sessionId } = await getIdentity(req);
    
    if (!sessionId && !userId) {
      // Si aún no hay identificador (lo que no debería pasar gracias al middleware),
      // devolvemos un carrito vacío.
      return successResponse({ items: [], totalItems: 0, subtotal: 0 });
    }

    const cartContents = await cartService.getCartContentsForUi({
      userId: userId,
      sessionId: sessionId,
    });
    
    return successResponse(cartContents);
  } catch (error) {
    return errorHandler(error);
  }
}

/**
 * DELETE /api/cart
 * Vacía el carrito para la sesión/usuario actual.
 */
export async function DELETE(req: NextRequest) {
  try {
    const { userId, sessionId } = await getIdentity(req);
    
    if (!sessionId && !userId) {
      return successResponse({ message: 'El carrito ya está vacío.' });
    }

    await cartService.clearCart({ userId, sessionId });
    
    return successResponse({ message: 'El carrito ha sido vaciado.' });
  } catch (error) {
    return errorHandler(error);
  }
}
