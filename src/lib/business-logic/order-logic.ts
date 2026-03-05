// src/lib/business-logic/order-logic.ts
import { differenceInHours } from 'date-fns';
import { Order } from '../definitions';

type CanonicalOrderStatus = 'PENDING' | 'PAYMENT_FAILED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'EXPIRED';

const statusLabelMap: Record<CanonicalOrderStatus, string> = {
    PENDING: 'Pendiente',
    PAYMENT_FAILED: 'Pago Fallido',
    PROCESSING: 'En Proceso',
    SHIPPED: 'En Reparto',
    DELIVERED: 'Completado',
    CANCELLED: 'Cancelado',
    EXPIRED: 'Expirado',
};

const legacyStatusToCanonical: Record<string, CanonicalOrderStatus> = {
    pendiente: 'PENDING',
    pago_fallido: 'PAYMENT_FAILED',
    procesando: 'PROCESSING',
    en_reparto: 'SHIPPED',
    enviado: 'SHIPPED',
    completado: 'DELIVERED',
    cancelado: 'CANCELLED',
    expirado: 'EXPIRED',
};

const normalizeOrderStatus = (status: unknown): CanonicalOrderStatus | null => {
    if (typeof status !== 'string' || status.trim() === '') return null;
    const raw = status.trim();
    const upper = raw.toUpperCase() as CanonicalOrderStatus;
    if (upper in statusLabelMap) return upper;
    return legacyStatusToCanonical[raw.toLowerCase()] ?? null;
};

/** Pre-payment statuses that can be cancelled without a refund */
const CANCELLABLE_PRE_PAYMENT_STATUSES: CanonicalOrderStatus[] = ['PENDING', 'PAYMENT_FAILED'];

/**
 * Determina si un pedido puede ser cancelado por el usuario.
 * - PENDING / PAYMENT_FAILED: cancelable dentro de 24h (sin reembolso — no hay pago exitoso).
 * - Otros estados: no cancelables por el usuario.
 */
export const getCancellationInfo = (order: Order): { canCancel: boolean; message: string } => {
    const createdAt = (order as any).createdAt ?? (order as any).created_at;
    const status = normalizeOrderStatus((order as any).status);
    const hoursSinceCreation = createdAt
      ? differenceInHours(new Date(), new Date(createdAt))
      : Number.POSITIVE_INFINITY;

    if (!status || !CANCELLABLE_PRE_PAYMENT_STATUSES.includes(status)) {
        const label = status ? statusLabelMap[status] : 'Desconocido';
        return {
            canCancel: false,
            message: `El pedido ya no se puede cancelar porque su estado es "${label}".`
        };
    }

    if (hoursSinceCreation > 24) {
        return {
            canCancel: false,
            message: `El pedido ya no se puede cancelar porque han pasado más de 24 horas desde su creación.`
        };
    }

    return {
        canCancel: true,
        message: 'Se cancelará el pedido. ¿Deseas continuar?'
    };
};
