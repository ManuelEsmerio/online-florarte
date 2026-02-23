// src/repositories/loyaltyHistoryRepository.ts
import { loyaltyHistoryData } from '@/lib/data/loyalty-history-data';
import type { RowDataPacket } from '@/lib/db';

export const loyaltyHistoryRepository = {
  /**
   * Obtiene todo el historial de puntos, uniendo con la tabla de usuarios
   * para obtener el nombre y correo del cliente.
   * @returns Una promesa que resuelve a un array de todos los registros del historial.
   */
  async findAll(): Promise<any[]> {
    return Promise.resolve(loyaltyHistoryData);
  },
};
