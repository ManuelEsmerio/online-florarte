// src/app/api/cart/validate/route.ts
import { type NextRequest } from 'next/server';
import { getIdentity } from '@/utils/request-utils';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { cartService } from '@/services/cartService';
import { productRepository } from '@/repositories/productRepository';
import { mapDbProductToProduct } from '@/mappers/productMapper';

/**
 * POST /api/cart/validate
 * Valida la disponibilidad (stock y estado) de los artículos en el carrito.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, sessionId } = await getIdentity(req);
    if (!sessionId && !userId) {
      // Si no hay sesión ni usuario, no hay carrito que validar.
      return successResponse([]);
    }

    const { items: cartItems } = await cartService.getCartContents({ userId, sessionId });

    if (cartItems.length === 0) {
      return successResponse([]);
    }

    const validationIssues = [];

    for (const item of cartItems) {
      let productInDb = null;
      let stock = -1;
      let status = 'borrador';

      if (item.variantId) {
        // Si es una variante, obtenemos los datos específicos de la variante.
        const [variantData] = await productRepository.findVariantsByProductIds([item.id]);
        if (variantData) {
          stock = variantData.stock;
          // El estado se hereda del producto padre
          const parentProduct = await productRepository.findById(item.id);
          status = parentProduct?.status || 'borrador';
        }
      } else {
        // Si es un producto simple, obtenemos sus datos.
        productInDb = await productRepository.findById(item.id);
        if (productInDb) {
          stock = productInDb.stock ?? -1;
          status = productInDb.status;
        }
      }
      
      if (!productInDb && !item.variantId) {
        validationIssues.push({
          cartItemId: item.cartItemId,
          productId: item.id,
          name: item.name,
          reason: 'not_found',
          message: 'El producto ya no existe',
        });
        continue;
      }
      
      if (status !== 'publicado') {
         validationIssues.push({
          cartItemId: item.cartItemId,
          productId: item.id,
          name: item.name,
          reason: 'not_published',
          message: 'Ya no está disponible',
        });
        continue;
      }

      if (stock < item.quantity) {
        validationIssues.push({
          cartItemId: item.cartItemId,
          productId: item.id,
          name: item.name,
          reason: 'out_of_stock',
          message: `Sin existencias (solo ${stock > 0 ? stock : 0} disponibles)`,
        });
        continue;
      }
    }

    return successResponse(validationIssues);

  } catch (error: any) {
    console.error('[API_CART_VALIDATE_ERROR]', error);
    return errorHandler(error);
  }
}
