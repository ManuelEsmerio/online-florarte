// src/app/api/cart/validate/route.ts
import { type NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getIdentity } from '@/utils/request-utils';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { cartService } from '@/services/cartService';
import { prisma } from '@/lib/prisma';

interface ClientItem {
  cartItemId: string;
  productId: number;
  variantId?: number | null;
  quantity: number;
  name: string;
}

const CART_VALIDATE_CACHE_CONTROL = 'public, s-maxage=10, stale-while-revalidate=30';

function cachedApiResponse(data: any) {
  return NextResponse.json({
    success: true,
    data,
    message: null,
    errorCode: null,
  }, {
    status: 200,
    headers: {
      'Cache-Control': CART_VALIDATE_CACHE_CONTROL,
    },
  });
}

/**
 * POST /api/cart/validate
 * Valida la disponibilidad (stock y estado) de los artículos en el carrito.
 *
 * Acepta opcionalmente `{ items: ClientItem[] }` en el body para evitar
 * re-consultar el carrito desde la DB (el cliente ya lo tiene en contexto).
 * Si no se envía body, hace fallback a DB (compatibilidad).
 *
 * Siempre valida stock/status en DB con 2 queries en paralelo (no N en serie).
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, sessionId } = await getIdentity(req);
    if (!sessionId && !userId) {
      return cachedApiResponse([]);
    }

    // Intentar leer items del body enviados por el cliente
    let clientItems: ClientItem[] | null = null;
    try {
      const body = await req.json();
      if (Array.isArray(body?.items) && body.items.length > 0) {
        clientItems = body.items as ClientItem[];
      }
    } catch {
      // body vacío o no JSON — usamos DB como fallback
    }

    // Si el cliente no envió items, fallback: consultar DB
    let cartItems: ClientItem[];
    if (clientItems) {
      cartItems = clientItems;
    } else {
      const { items: dbItems } = await cartService.getCartContents({ userId, sessionId });
      if (dbItems.length === 0) return cachedApiResponse([]);
      cartItems = dbItems.map(i => ({
        cartItemId: String(i.id),
        productId: i.product_id,
        variantId: i.variant_id ?? null,
        quantity: i.quantity,
        name: i.product_name,
      }));
    }

    if (cartItems.length === 0) return cachedApiResponse([]);

    // Separar IDs de productos simples y variantes
    const productIds = cartItems.filter(i => !i.variantId).map(i => i.productId);
    const variantIds = cartItems.filter(i => !!i.variantId).map(i => i.variantId as number);

    // 2 queries en paralelo en lugar de N queries secuenciales
    const [products, variants] = await Promise.all([
      productIds.length > 0
        ? prisma.product.findMany({
            where: { id: { in: productIds }, isDeleted: false },
            select: { id: true, stock: true, status: true },
          })
        : [],
      variantIds.length > 0
        ? prisma.productVariant.findMany({
            where: { id: { in: variantIds } },
            select: { id: true, stock: true, product: { select: { status: true } } },
          })
        : [],
    ]);

    const productMap = new Map(products.map(p => [p.id, p]));
    const variantMap = new Map(variants.map(v => [v.id, v]));

    const validationIssues = [];

    for (const item of cartItems) {
      let stock = -1;
      let status = 'borrador';
      let found = false;

      if (item.variantId) {
        const variant = variantMap.get(item.variantId);
        if (variant) {
          found = true;
          stock = variant.stock;
          status = variant.product.status === 'PUBLISHED' ? 'publicado' : 'borrador';
        }
      } else {
        const product = productMap.get(item.productId);
        if (product) {
          found = true;
          stock = product.stock;
          status = product.status === 'PUBLISHED' ? 'publicado' : 'borrador';
        }
      }

      if (!found) {
        validationIssues.push({ cartItemId: item.cartItemId, productId: item.productId, name: item.name, reason: 'not_found', message: 'El producto ya no existe' });
        continue;
      }

      if (status !== 'publicado') {
        validationIssues.push({ cartItemId: item.cartItemId, productId: item.productId, name: item.name, reason: 'not_published', message: 'Ya no está disponible' });
        continue;
      }

      if (stock < item.quantity) {
        validationIssues.push({ cartItemId: item.cartItemId, productId: item.productId, name: item.name, reason: 'out_of_stock', message: `Sin existencias (solo ${stock > 0 ? stock : 0} disponibles)` });
        continue;
      }
    }

    return cachedApiResponse(validationIssues);

  } catch (error: any) {
    console.error('[API_CART_VALIDATE_ERROR]', error);
    return errorHandler(error);
  }
}
