// src/app/api/checkout/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession } from '@/utils/auth';
import { getSessionId } from '@/utils/session';
import { orderService } from '@/services/orderService';
import { ZodError } from 'zod';

/**
 * POST /api/checkout
 * Inicia el proceso de checkout. Llama al SP para validar el carrito,
 * crear la orden en estado 'pendiente_pago' y devolver el ID y total.
 */
export async function POST(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    // Para el checkout, el usuario DEBE estar autenticado.
    if (!session?.dbId) {
      return errorHandler(new Error('Acceso denegado. Se requiere autenticación.'), 401);
    }

    const sessionId = getSessionId(req);
    const body = await req.json();

    const orderInput = {
        userId: session.dbId,
        sessionId,
        ...body,
        gateway: body.gateway || 'stripe', // 'stripe' o 'paypal'
        currency: body.currency || 'MXN',
    };
    
    // El servicio ahora llama al nuevo sp_Checkout_Init
    const { orderId, total } = await orderService.initializeCheckout(orderInput);
    
    // Aquí, en un paso futuro, se crearía el PaymentIntent de Stripe o la Order de PayPal
    // usando el orderId y el total devueltos.
    
    // Por ahora, devolvemos el resultado de la inicialización.
    return successResponse({ orderId, total }, 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorHandler(error, 400);
    }
    console.error('[API_CHECKOUT_INIT_ERROR]', error);
    return errorHandler(error);
  }
}
