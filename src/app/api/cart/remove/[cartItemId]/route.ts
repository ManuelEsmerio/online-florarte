// src/app/api/cart/remove/[cartItemId]/route.ts
import { type NextRequest } from 'next/server';
import { cartService } from '@/services/cartService';
import { getIdentity } from '@/utils/request-utils';
import { successResponse, errorHandler } from '@/utils/api-utils';

interface RouteParams {
  params: Promise<{ cartItemId: string }>;
}

/**
 * DELETE /api/cart/remove/[cartItemId]
 * Endpoint para eliminar un artículo del carrito.
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { userId, sessionId } = await getIdentity(req);
    const { cartItemId: cartItemIdParam } = await params;
    const cartItemId = parseInt(cartItemIdParam, 10);
    
    if (isNaN(cartItemId)) {
        throw new Error("ID de artículo inválido.");
    }

    if (!sessionId && !userId) {
        throw new Error("Se requiere una sesión o un usuario para modificar el carrito.");
    }

    await cartService.removeItem(cartItemId, { userId, sessionId });

    const finalCart = await cartService.getCartContentsForUi({userId, sessionId});

    return successResponse(finalCart);
  } catch (error: any) {
    return errorHandler(error, 400);
  }
}
