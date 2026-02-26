// src/app/api/cart/update/[cartItemId]/route.ts
import { type NextRequest } from 'next/server';
import { cartService } from '@/services/cartService';
import { getIdentity, toIntOrThrow } from '@/utils/request-utils';
import { successResponse, errorHandler } from '@/utils/api-utils';

interface RouteParams {
  params: Promise<{ cartItemId: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { userId, sessionId } = await getIdentity(req);
    const body = await req.json();
    const { cartItemId: cartItemIdParam } = await params;
    const cartItemId = parseInt(cartItemIdParam, 10);

    if (isNaN(cartItemId)) throw new Error("ID de artículo inválido.");

    const quantity = toIntOrThrow(body.quantity, 'quantity'); 

    if (quantity < 0) throw new Error('La cantidad no puede ser negativa.');
    if (!sessionId && !userId) throw new Error("Se requiere una sesión o un usuario para modificar el carrito.");

    await cartService.updateQuantity(cartItemId, quantity, { userId, sessionId });
    
    const finalCart = await cartService.getCartContentsForUi({userId, sessionId});

    return successResponse(finalCart);
  } catch (error: any) {
    return errorHandler(error, 400);
  }
}
