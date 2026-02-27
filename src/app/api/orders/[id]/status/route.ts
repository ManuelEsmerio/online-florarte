import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);

    if (isNaN(orderId) || orderId <= 0) {
      return errorHandler(new Error('orderId inválido'), 400);
    }

    // Only query the PaymentTransaction — avoid loading the full Order.
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
