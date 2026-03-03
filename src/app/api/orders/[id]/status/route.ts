import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { prisma } from '@/lib/prisma';
import { getDecodedToken } from '@/utils/auth';
import { getSessionId } from '@/utils/session';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);

    if (isNaN(orderId) || orderId <= 0) {
      return errorHandler(new Error('orderId inválido'), 400);
    }

    // Verificar identidad del solicitante (usuario logueado o sesión de invitado)
    const session = await getDecodedToken(req);
    const sessionId = getSessionId(req);

    if (!session?.dbId && !sessionId) {
      return errorHandler(new Error('No autorizado.'), 401);
    }

    // Verificar que la orden pertenece al usuario o sesión que solicita
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        OR: [
          ...(session?.dbId ? [{ userId: session.dbId }] : []),
          ...(sessionId ? [{ sessionId }] : []),
        ],
      },
      select: { id: true },
    });

    if (!order) {
      return errorHandler(new Error('Pedido no encontrado.'), 404);
    }

    // Consultar PaymentTransaction tras verificar propiedad
    const tx = await prisma.paymentTransaction.findFirst({
      where: { orderId },
      select: { status: true },
      orderBy: { updatedAt: 'desc' },
    });

    if (!tx) {
      return successResponse({ status: 'pending' });
    }

    let status: 'pending' | 'paid' | 'failed';
    if (tx.status === 'SUCCEEDED') {
      status = 'paid';
    } else if (tx.status === 'FAILED' || tx.status === 'CANCELED') {
      status = 'failed';
    } else {
      status = 'pending';
    }

    return successResponse({ status });
  } catch (error) {
    console.error('[API_ORDER_STATUS_ERROR]', error);
    return errorHandler(error);
  }
}
