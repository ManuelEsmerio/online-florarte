// src/app/api/admin/shipping/[id]/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession } from '@/utils/auth';
import { userService } from '@/services/userService';
import { shippingZoneService } from '@/services/shippingZoneService';
import { ZodError } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/admin/shipping/[id]
 * Endpoint protegido para actualizar una zona de envío por su ID.
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  let routeZoneId = '';

  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) {
      return errorHandler(new Error('Acceso denegado.'), 401);
    }
    const adminUser = await userService.getUserById(session.dbId);
    if (adminUser?.role !== 'admin') {
      return errorHandler(new Error('Acceso prohibido.'), 403);
    }

    const { id } = await params;
    routeZoneId = id;

    const zoneId = parseInt(id, 10);
    const body = await req.json();

    const updatedZone = await shippingZoneService.updateShippingZone(zoneId, body, session.dbId);
    
    return successResponse(updatedZone);

  } catch (error) {
    if (error instanceof ZodError) {
      return errorHandler(error, 400);
    }
    if (error instanceof Error && error.message.includes('ya existe')) {
      return errorHandler(error, 409); // Conflict
    }
    console.error(`[API_ADMIN_SHIPPING_UPDATE_ERROR] ID: ${routeZoneId}`, error);
    return errorHandler(error);
  }
}

/**
 * DELETE /api/admin/shipping/[id]
 * Endpoint protegido para eliminar una zona de envío.
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  let routeZoneId = '';

  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) {
      return errorHandler(new Error('Acceso denegado.'), 401);
    }
    const adminUser = await userService.getUserById(session.dbId);
    if (adminUser?.role !== 'admin') {
      return errorHandler(new Error('Acceso prohibido.'), 403);
    }
    
    const { id } = await params;
    routeZoneId = id;

    const zoneId = parseInt(id, 10);
    const success = await shippingZoneService.deleteShippingZone(zoneId, session.dbId);
    
    if(!success) {
        return errorHandler(new Error('No se pudo eliminar la zona o no fue encontrada.'), 404);
    }

    return successResponse({ message: 'Zona de envío eliminada correctamente.' });
  } catch (error) {
    console.error(`[API_ADMIN_SHIPPING_DELETE_ERROR] ID: ${routeZoneId}`, error);
    return errorHandler(error);
  }
}
