// src/services/loyaltyHistoryService.ts
import { prisma } from '@/lib/prisma';
import type { LoyaltyHistory } from '@/lib/definitions';

export const loyaltyHistoryService = {
  async getAllLoyaltyHistory(page = 1, limit = 50): Promise<{ history: LoyaltyHistory[]; total: number }> {
    const skip = (page - 1) * limit;
    const [rows, total] = await prisma.$transaction([
      prisma.loyaltyHistory.findMany({
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.loyaltyHistory.count(),
    ]);

    return {
      total,
      history: rows.map(row => ({
        id: row.id,
        userId: row.userId,
        userName: row.user.name,
        userEmail: row.user.email,
        orderId: row.orderId,
        points: row.points,
        transactionType: row.transactionType,
        notes: row.notes,
        createdAt: row.createdAt,
      })),
    };
  },
};
