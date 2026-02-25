// src/app/api/cart/validate/route.ts
import { type NextRequest } from 'next/server';
import { getIdentity } from '@/utils/request-utils';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { cartService } from '@/services/cartService';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/cart/validate
 * Valida la disponibilidad (stock y estado) de los artículos en el carrito.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, sessionId } = await getIdentity(req);
    if (!sessionId && !userId) {
      return successResponse([]);
    }

    const { items: cartItems } = await cartService.getCartContents({ userId, sessionId });

    if (cartItems.length === 0) {
      return successResponse([]);
    }

    const validationIssues = [];

    for (const item of cartItems) {
      let stock = -1;
      let status = 'borrador';
      let found = false;

      if (item.variant_id) {
        const variant = await prisma.productVariant.findUnique({
          where: { id: item.variant_id },
          include: { product: { select: { status: true } } },
        });
        if (variant) {
          found = true;
          stock = variant.stock;
          status = variant.product.status === 'PUBLISHED' ? 'publicado' : 'borrador';
        }
      } else {
        const product = await prisma.product.findUnique({
          where: { id: item.product_id, isDeleted: false },
          select: { stock: true, status: true },
        });
        if (product) {
          found = true;
          stock = product.stock;
          status = product.status === 'PUBLISHED' ? 'publicado' : 'borrador';
        }
      }

      if (!found) {
        validationIssues.push({ cartItemId: String(item.id), productId: item.product_id, name: item.product_name, reason: 'not_found', message: 'El producto ya no existe' });
        continue;
      }

      if (status !== 'publicado') {
        validationIssues.push({ cartItemId: String(item.id), productId: item.product_id, name: item.product_name, reason: 'not_published', message: 'Ya no está disponible' });
        continue;
      }

      if (stock < item.quantity) {
        validationIssues.push({ cartItemId: String(item.id), productId: item.product_id, name: item.product_name, reason: 'out_of_stock', message: `Sin existencias (solo ${stock > 0 ? stock : 0} disponibles)` });
        continue;
      }
    }

    return successResponse(validationIssues);

  } catch (error: any) {
    console.error('[API_CART_VALIDATE_ERROR]', error);
    return errorHandler(error);
  }
}
