// src/services/loyaltyHistoryService.ts
import { loyaltyHistoryRepository } from '../repositories/loyaltyHistoryRepository';
import { mapDbLoyaltyHistoryToLoyaltyHistory } from '../mappers/loyaltyHistoryMapper';
import type { LoyaltyHistory } from '@/lib/definitions';

export const loyaltyHistoryService = {
  /**
   * Obtiene todo el historial de puntos de lealtad.
   */
  async getAllLoyaltyHistory(): Promise<LoyaltyHistory[]> {
    const dbHistory = await loyaltyHistoryRepository.findAll();
    return dbHistory.map(mapDbLoyaltyHistoryToLoyaltyHistory);
  },
};
