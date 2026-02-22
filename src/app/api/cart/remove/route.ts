// src/app/api/cart/remove/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { cartService } from '@/services/cartService';
import { getIdentity, toIntOrThrow, toIntOrNull } from '@/utils/request-utils';
import { successResponse, errorHandler } from '@/utils/api-utils';

/**
 * POST /api/cart/remove
 * Endpoint para eliminar un artículo del carrito.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, sessionId } = await getIdentity(req);
    const body = await req.json();

    // Validar los datos de entrada
    const productId = toIntOrThrow(body.productId, 'productId');
    const variantId = toIntOrNull(body.variantId);
    const customPhotoId = toIntOrNull(body.customPhotoId);
    
    if (!sessionId && !userId) {
        throw new Error("Se requiere una sesión o un usuario para modificar el carrito.");
    }

    const result = await cartService.upsertItem({
      sessionId,
      userId,
      productId,
      variantId,
      quantity: 0,
      deliveryDate: null,
      customPhotoUrl: null,
    });

    if (result.resultCode <= 0) {
      throw new Error(result.message || 'No se pudo eliminar el artículo del carrito.');
    }

    return successResponse({
      itemId: result.cart_item_id,
      totalItems: result.subtotal,
      subtotal: result.total,
      message: result.message,
    });
  } catch (error: any) {
    return errorHandler(error, 400);
  }
}
