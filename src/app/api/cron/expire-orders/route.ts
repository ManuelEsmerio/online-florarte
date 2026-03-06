// src/app/api/cron/expire-orders/route.ts
//
// Invoked every 30 min by Railway's cron scheduler.
// Protected by CRON_SECRET — only Railway (or authorized callers) may call this.
//
// Example Railway call:
//   curl -H "Authorization: Bearer <CRON_SECRET>" https://your-domain/api/cron/expire-orders
//
// Handles two expiry paths:
//
// 1. PENDING orders (no payment attempted at all):
//    Delegates to the MySQL stored procedure `expire_pending_orders()`.
//    That SP restores stock, decrements coupon usesCount, and sets status = 'EXPIRED'
//    for orders WHERE status = 'PENDING' AND createdAt <= NOW() - INTERVAL 30 MINUTE.
//
// 2. PAYMENT_FAILED orders (had at least one failed attempt, never succeeded):
//    Handled here via Prisma — same logic as cancelAbandonedOrder.
//    Uses a 35-min cutoff (5 min buffer on top of the 30-min Stripe session expiry).
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { orderService } from '@/services/orderService';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');

  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let pendingExpired = 0;
  let failedExpired = 0;
  let errors = 0;

  // --- Path 1: call the stored procedure for PENDING orders ---
  try {
    await prisma.$executeRaw`CALL expire_pending_orders()`;
    // Row count is not returned by MySQL procedures via Prisma $executeRaw,
    // so we log success without a specific count.
    pendingExpired = -1; // -1 = handled by SP (count unknown)
  } catch (spError) {
    console.error('[CRON_EXPIRE_ORDERS] SP error:', spError);
    errors++;
  }

  // --- Path 2: expire PAYMENT_FAILED orders older than 35 min ---
  const cutoff = new Date(Date.now() - 35 * 60 * 1000);

  let staleFailedOrders: { id: number }[] = [];
  try {
    staleFailedOrders = await prisma.order.findMany({
      where: {
        status: 'PAYMENT_FAILED',
        createdAt: { lt: cutoff },
      },
      select: { id: true },
    });
  } catch (fetchError) {
    console.error('[CRON_EXPIRE_ORDERS] fetch PAYMENT_FAILED error:', fetchError);
    errors++;
  }

  const results = await Promise.allSettled(
    staleFailedOrders.map((o) =>
      orderService.cancelAbandonedOrder(o.id, 'EXPIRED'),
    ),
  );

  for (const result of results) {
    if (result.status === 'fulfilled') {
      failedExpired++;
    } else {
      errors++;
      console.error('[CRON_EXPIRE_ORDERS] expiry error:', result.reason);
    }
  }

  console.info('[CRON_EXPIRE_ORDERS] done', {
    pendingExpiredViaSP: pendingExpired === -1 ? 'handled_by_sp' : pendingExpired,
    paymentFailedExpired: failedExpired,
    paymentFailedTotal: staleFailedOrders.length,
    errors,
  });

  return NextResponse.json({
    ok: true,
    pendingExpiredViaSP: pendingExpired === -1 ? 'handled_by_sp' : pendingExpired,
    paymentFailedExpired: failedExpired,
    errors,
  });
}
