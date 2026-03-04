import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession, isAdminRole } from '@/utils/auth';
import { userService } from '@/services/userService';
import { orderService } from '@/services/orderService';
import { orderEmailService } from '@/services/orderEmailService';

const VALID_REASONS = [
  'out_of_stock',
  'duplicate',
  'customer_request',
  'payment_issue',
  'delivery_problem',
  'other',
] as const;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
    const orderId = parseInt(id, 10);
    if (isNaN(orderId) || orderId <= 0) {
      return errorHandler(new Error('ID de pedido inválido.'), 400);
    }

    const body = await req.json();
    const refundPercentage = Number(body.refundPercentage ?? 0);
    const cancellationReason = String(body.cancellationReason ?? '').trim();
    const customReason = String(body.customReason ?? '').trim().slice(0, 500) || undefined;

    if (!Number.isFinite(refundPercentage) || refundPercentage < 0 || refundPercentage > 100) {
      return errorHandler(new Error('El porcentaje de reembolso debe estar entre 0 y 100.'), 400);
    }
    if (!VALID_REASONS.includes(cancellationReason as any)) {
      return errorHandler(new Error('Razón de cancelación inválida.'), 400);
    }

    const result = await orderService.adminCancelOrderWithRefund({
      orderId,
      adminId: session.dbId,
      refundPercentage,
      cancellationReason,
      customReason,
    });

    // Fire email asynchronously
    orderEmailService
      .sendRefundNotificationEmail(orderId, result.refunded)
      .catch((emailError) => {
        console.error('[ADMIN_CANCEL_EMAIL_ERROR]', { orderId, error: (emailError as Error).message });
      });

    return successResponse({
      message: 'Pedido cancelado exitosamente.',
      refunded: result.refunded,
      refundAmount: result.refundAmount,
      externalRefundId: result.externalRefundId ?? null,
    });
  } catch (error) {
    console.error('[API_ADMIN_CANCEL_ORDER_ERROR]', error);
    return errorHandler(error);
  }
}
