// src/app/api/products/search/route.ts
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

/**
 * GET /api/products/search?q=<term>
 * Endpoint optimizado para búsqueda de productos.
 * Usa SELECT mínimo en lugar del PRODUCT_INCLUDE completo.
 * Retorna máximo 100 resultados para evitar payloads excesivos.
 */
export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = checkRateLimit(`product_search:${ip}`, 30, 60 * 1000);
    if (!rl.allowed) {
      return errorHandler(new Error('Demasiadas solicitudes. Intenta de nuevo en unos momentos.'), 429);
    }

    const q = (new URL(req.url).searchParams.get('q') ?? '').slice(0, 200);

    const products = await prisma.product.findMany({
      where: {
        status: 'PUBLISHED',
        isDeleted: false,
        OR: [
          { name: { contains: q } },
          { code: { contains: q } },
          { tags: { some: { tag: { name: { contains: q } } } } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        code: true,
        mainImage: true,
        price: true,
        salePrice: true,
        hasVariants: true,
        badgeText: true,
        category: { select: { name: true, slug: true } },
        tags: { select: { tag: { select: { name: true } } } },
        variants: {
          where: { isDeleted: false },
          select: {
            id: true,
            name: true,
            price: true,
            salePrice: true,
            code: true,
            images: { take: 1, orderBy: { sortOrder: 'asc' }, select: { src: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return successResponse({ products });
  } catch (error) {
    console.error('[API_PRODUCTS_SEARCH_ERROR]', error);
    return errorHandler(error);
  }
}
