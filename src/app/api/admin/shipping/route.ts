// src/app/api/admin/shipping/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession } from '@/utils/auth';
import { userService } from '@/services/userService';
import { shippingZoneService } from '@/services/shippingZoneService';
import { ZodError } from 'zod';

/**
 * GET /api/admin/shipping
 * Endpoint protegido para obtener todas las zonas de envío.
 */
export async function GET(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) {
      return errorHandler(new Error('Acceso denegado.'), 401);
    }
    const user = await userService.getUserById(session.dbId);
    if (user?.role !== 'admin') {
      return errorHandler(new Error('Acceso prohibido.'), 403);
    }

    const zones = await shippingZoneService.getAllShippingZones();
    return successResponse(zones);
  } catch (error) {
    console.error('[API_ADMIN_SHIPPING_GET_ERROR]', error);
    return errorHandler(error);
  }
}

/**
 * POST /api/admin/shipping
 * Endpoint protegido para crear una nueva zona de envío.
 */
export async function POST(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) {
      return errorHandler(new Error('Acceso denegado.'), 401);
    }
    const user = await userService.getUserById(session.dbId);
    if (user?.role !== 'admin') {
      return errorHandler(new Error('Acceso prohibido.'), 403);
    }
    
    const body = await req.json();
    const newZone = await shippingZoneService.createShippingZone(body, session.dbId);
    
    return successResponse(newZone, 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorHandler(error, 400);
    }
     if (error instanceof Error && error.message.includes('ya existe')) {
      return errorHandler(error, 409); // Conflict
    }
    console.error('[API_ADMIN_SHIPPING_POST_ERROR]', error);
    return errorHandler(error);
  }
}
