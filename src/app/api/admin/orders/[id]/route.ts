// src/app/api/admin/orders/[id]/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession, isAdminRole } from '@/utils/auth';
import { userService } from '@/services/userService';
import { orderService } from '@/services/orderService';
import { ZodError } from 'zod';
import { OrderStatus } from '@/lib/definitions';


interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/orders/[id]
 * Obtiene los detalles completos de un pedido para el panel de administración.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  let routeOrderId = '';

  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) {
      return errorHandler(new Error('Acceso denegado.'), 401);
    }
    const user = await userService.getUserById(session.dbId);
    if (!isAdminRole(user?.role)) {
      return errorHandler(new Error('Acceso prohibido.'), 403);
    }

    const { id } = await params;
    routeOrderId = id;

    const orderId = parseInt(id, 10);
    const order = await orderService.getOrderDetails(orderId);

    if (!order) {
      return errorHandler(new Error('Pedido no encontrado.'), 404);
    }

    return successResponse(order);
  } catch (error) {
    console.error(`[API_ADMIN_ORDER_GET_ERROR] ID: ${routeOrderId}`, error);
    return errorHandler(error);
  }
}

/**
 * PUT /api/admin/orders/[id]
 * Actualiza el estado de un pedido.
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  let routeOrderId = '';

    try {
        const session: UserSession | null = await getDecodedToken(req);
        if (!session?.dbId) {
            return errorHandler(new Error('Acceso denegado.'), 401);
        }
        const user = await userService.getUserById(session.dbId);
        if (!isAdminRole(user?.role)) {
            return errorHandler(new Error('Acceso prohibido.'), 403);
        }

        const { id } = await params;
        routeOrderId = id;

        const orderId = parseInt(id, 10);
        const body = await req.json();

        // Validar que el código de estado sea uno de los permitidos
        const validStatusCodes: OrderStatus[] = ['PENDING', 'PROCESSING', 'DELIVERED', 'SHIPPED', 'CANCELLED'];
        if (!body.status || !validStatusCodes.includes(body.status)) {
            return errorHandler(new Error('Código de estado no válido.'), 400);
        }
        
        const payload = {
            deliveryDriverId: body.deliveryDriverId || null,
            deliveryNotes: body.deliveryNotes || null,
        };

        const success = await orderService.updateOrderStatus(orderId, body.status, payload);

        if (!success) {
            throw new Error('No se pudo actualizar el estado del pedido.');
        }

        return successResponse({ message: 'Estado del pedido actualizado correctamente.' });

    } catch (error) {
        if (error instanceof ZodError) {
            return errorHandler(error, 400);
        }
      console.error(`[API_ADMIN_ORDER_UPDATE_ERROR] ID: ${routeOrderId}`, error);
        return errorHandler(error);
  }
}
