// src/app/api/checkout/route.ts
import { NextRequest } from 'next/server';
import { z, ZodError } from 'zod';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession } from '@/utils/auth';
import { getSessionId } from '@/utils/session';
import { orderService } from '@/services/orderService';

const checkoutBodySchema = z.object({
  // Delivery
  deliveryDate: z.string().min(1, 'La fecha de entrega es obligatoria'),
  deliveryTimeSlot: z.string().optional(),
  p_delivery_date: z.string().optional(),
  p_delivery_time_slot: z.string().optional(),
  // Address (logged-in user)
  addressId: z.number().int().positive().optional(),
  // Guest address
  guestName: z.string().max(200).optional(),
  guestEmail: z.string().email().optional(),
  guestPhone: z.string().max(20).optional(),
  guestAddressAlias: z.string().max(100).optional(),
  guestStreetName: z.string().max(255).optional(),
  guestStreetNumber: z.string().max(50).optional(),
  guestInteriorNumber: z.string().max(50).optional(),
  guestNeighborhood: z.string().max(150).optional(),
  guestCity: z.string().max(150).optional(),
  guestState: z.string().max(100).optional(),
  guestPostalCode: z.string().max(10).optional(),
  guestReferenceNotes: z.string().max(500).optional(),
  shippingAddressSnapshot: z.string().max(500).optional(),
  // Recipient overrides
  recipientName: z.string().max(200).optional(),
  recipientPhone: z.string().max(20).optional(),
  // Order extras
  couponCode: z.string().max(50).optional(),
  dedication: z.string().max(500).optional(),
  isAnonymous: z.boolean().optional(),
  signature: z.string().max(200).optional(),
  // Payment
  gateway: z.enum(['stripe', 'mercadopago']).optional(),
  currency: z.enum(['MXN']).optional(),
});

/**
 * POST /api/checkout
 * Inicia el proceso de checkout. Llama al SP para validar el carrito,
 * crear la orden en estado 'pendiente_pago' y devolver el ID y total.
 */
export async function POST(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    const sessionId = getSessionId(req);
    if (!session?.dbId && !sessionId) {
      return errorHandler(new Error('No se pudo identificar la sesión para checkout.'), 401);
    }

    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return errorHandler(new Error('Formato de solicitud inválido.'), 400);
    }

    const parsed = checkoutBodySchema.parse(rawBody);

    const orderInput = {
        userId: session?.dbId ?? null,
        sessionId,
        ...parsed,
        gateway: parsed.gateway ?? 'stripe',
        currency: parsed.currency ?? 'MXN',
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
