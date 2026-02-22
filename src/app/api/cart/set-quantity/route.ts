// src/app/api/cart/set-quantity/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { cartService } from '@/services/cartService';
import { getIdentity, toIntOrThrow, toIntOrNull } from '@/utils/request-utils';
import { successResponse, errorHandler } from '@/utils/api-utils';

/**
 * POST /api/cart/set-quantity
 * Endpoint para establecer una cantidad específica de un artículo en el carrito.
 * Si la cantidad es 0, el artículo es eliminado.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, sessionId } = await getIdentity(req);
    const body = await req.json();

    // Validar los datos de entrada
    const productId = toIntOrThrow(body.productId, 'productId');
    const quantity = toIntOrThrow(body.quantity, 'quantity'); // Permite 0
    const variantId = toIntOrNull(body.variantId);
    const customPhotoId = toIntOrNull(body.customPhotoId);
    const customPhotoUrl = body.customPhotoUrl || null;
    const deliveryDate = body.deliveryDate || null;
    const deliveryTimeSlot = body.deliveryTimeSlot || null;

    if (quantity < 0) {
      throw new Error('La cantidad no puede ser negativa.');
    }

    if (!sessionId && !userId) {
        throw new Error("Se requiere una sesión o un usuario para modificar el carrito.");
    }

    const result = await cartService.upsertItem({
      sessionId,
      userId,
      mode: 'set',
      productId,
      variantId,
      quantity,
      customPhotoId,
      customPhotoUrl,
      deliveryDate: deliveryDate || null,
      deliveryTimeSlot: deliveryTimeSlot || null,
    });

    if (result.resultCode <= 0) {
      throw new Error(result.message || 'No se pudo actualizar la cantidad del artículo.');
    }

    return successResponse({
      itemId: result.itemId,
      totalItems: result.totalItems,
      subtotal: result.subtotal,
      message: result.message,
    });
  } catch (error: any) {
    return errorHandler(error, 400);
  }
}
