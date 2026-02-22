// src/app/api/recommendations/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { recommendationService } from '@/services/recommendationService';
import { z } from 'zod';
import { getIdentity } from '@/utils/request-utils';

const recommendationQuerySchema = z.object({
  context: z.enum(['home', 'pdp-similar', 'pdp-bought-together', 'cart']),
  productId: z.coerce.number().optional(),
  categoryId: z.coerce.number().optional(),
  limit: z.coerce.number().min(1).max(20).default(10),
});

/**
 * GET /api/recommendations
 * Endpoint centralizado para obtener recomendaciones de productos.
 *
 * @param {NextRequest} req - La solicitud entrante.
 * @returns {Promise<Response>} Una respuesta JSON con la lista de productos recomendados.
 *
 * Query Params:
 * - context: 'home', 'pdp-similar', 'pdp-bought-together', 'cart'. El contexto de la recomendación.
 * - userId (opcional): ID del usuario logueado.
 * - productId (opcional): ID del producto principal (para PDP).
 * - categoryId (opcional): ID de la categoría principal (para PDP).
 * - limit (opcional): Número máximo de recomendaciones a devolver.
 */
export async function GET(req: NextRequest) {
  try {
    const { userId, sessionId } = await getIdentity(req);
    const { searchParams } = new URL(req.url);

    const queryParse = recommendationQuerySchema.safeParse({
      context: searchParams.get('context'),
      productId: searchParams.get('productId'),
      categoryId: searchParams.get('categoryId'),
      limit: searchParams.get('limit'),
    });

    if (!queryParse.success) {
      return errorHandler(new Error(`Parámetros inválidos: ${queryParse.error.message}`), 400);
    }

    const { context, productId, categoryId, limit } = queryParse.data;

    const recommendations = await recommendationService.getRecommendations({
      context,
      userId,
      sessionId,
      productId,
      categoryId,
      limit,
    });

    return successResponse(recommendations);
  } catch (error) {
    console.error('[API_RECOMMENDATIONS_ERROR]', error);
    return errorHandler(error);
  }
}
