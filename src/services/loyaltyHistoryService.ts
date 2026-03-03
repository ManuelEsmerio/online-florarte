// src/services/loyaltyHistoryService.ts
import { prisma } from '@/lib/prisma';
import type { LoyaltyHistory } from '@/lib/definitions';

export const loyaltyHistoryService = {
  async getAllLoyaltyHistory(): Promise<LoyaltyHistory[]> {
    const rows = await prisma.loyaltyHistory.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map(row => ({
      id: row.id,
      userId: row.userId,
      userName: row.user.name,
      userEmail: row.user.email,
      orderId: row.orderId,
      points: row.points,
      transactionType: row.transactionType,
      notes: row.notes,
      createdAt: row.createdAt,
    }));
  },
};
