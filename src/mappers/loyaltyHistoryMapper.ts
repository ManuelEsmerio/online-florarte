
// src/mappers/loyaltyHistoryMapper.ts
import type { LoyaltyHistory } from '@/lib/definitions';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Mapea una fila de la tabla `loyalty_history` a un objeto `LoyaltyHistory` limpio.
 *
 * @param row El objeto de la base de datos que incluye datos del JOIN con `users`.
 * @returns Un objeto LoyaltyHistory.
 */
export function mapDbLoyaltyHistoryToLoyaltyHistory(row: any): LoyaltyHistory {
  return {
    id: row.id,
    userName: row.user_name,
    userEmail: row.user_email,
    orderId: row.order_id,
    points: row.points,
    transactionType: row.transaction_type,
    createdAt: format(new Date(row.created_at), "dd MMM yyyy, HH:mm'h'", { locale: es }),
  };
}
