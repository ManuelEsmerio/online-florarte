// src/app/api/cron/cancel-pending-orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { orderService } from '@/services/orderService';

/**
 * GET /api/cron/cancel-pending-orders
 *
 * Cancela órdenes PENDING que llevan más de 24 horas sin registro
 * en PaymentTransaction y restaura el stock correspondiente.
 *
 * Seguridad: Vercel inyecta automáticamente el header
 * Authorization: Bearer <CRON_SECRET> al ejecutar cron jobs.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const abandonedOrders = await prisma.order.findMany({
    where: {
      status: 'PENDING',
      createdAt: { lt: cutoffDate },
      paymentTransactions: { none: {} },
    },
    select: { id: true },
  });

  if (abandonedOrders.length === 0) {
    return NextResponse.json({ processed: 0, failed: 0, cancelledIds: [] });
  }

  let failed = 0;
  const cancelledIds: number[] = [];

  for (const order of abandonedOrders) {
    try {
      await orderService.cancelAbandonedOrder(order.id);
      cancelledIds.push(order.id);
    } catch (error) {
      console.error(`[CRON_CANCEL_ORDER_ERROR] orderId=${order.id}`, error);
      failed++;
    }
  }

  console.log(`[CRON] cancel-pending-orders: cancelled=${cancelledIds.length}, failed=${failed}`);

  return NextResponse.json({
    processed: cancelledIds.length,
    failed,
    cancelledIds,
  });
}
