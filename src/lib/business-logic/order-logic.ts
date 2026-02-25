// src/lib/business-logic/order-logic.ts
import { differenceInHours } from 'date-fns';
import { Order } from '../definitions';

/**
 * Proporciona una traducción legible para los estados de un pedido.
 * @type {{ [key in OrderStatus]: string }}
 */
type CanonicalOrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

const statusLabelMap: Record<CanonicalOrderStatus, string> = {
    PENDING: 'Pendiente',
    PROCESSING: 'En Proceso',
    SHIPPED: 'En Reparto',
    DELIVERED: 'Completado',
    CANCELLED: 'Cancelado',
};

const legacyStatusToCanonical: Record<string, CanonicalOrderStatus> = {
    pendiente: 'PENDING',
    procesando: 'PROCESSING',
    en_reparto: 'SHIPPED',
    enviado: 'SHIPPED',
    completado: 'DELIVERED',
    cancelado: 'CANCELLED',
};

const normalizeOrderStatus = (status: unknown): CanonicalOrderStatus | null => {
    if (typeof status !== 'string' || status.trim() === '') return null;

    const raw = status.trim();
    const upper = raw.toUpperCase();

    if (upper === 'PENDING' || upper === 'PROCESSING' || upper === 'SHIPPED' || upper === 'DELIVERED' || upper === 'CANCELLED') {
        return upper;
    }

    return legacyStatusToCanonical[raw.toLowerCase()] ?? null;
};

/**
 * Determina si un pedido puede ser cancelado y proporciona un mensaje explicativo.
 * 
 * La lógica es la siguiente:
 * - Un pedido solo se puede cancelar si su estado es 'pendiente'.
 * - La cancelación solo es posible dentro de las 24 horas posteriores a la creación del pedido.
 * 
 * @param {Order} order - El objeto del pedido a evaluar.
 * @returns {{ canCancel: boolean; message: string }} - Un objeto que indica si la cancelación es posible y un mensaje para el usuario.
 */
export const getCancellationInfo = (order: Order): { canCancel: boolean; message: string } => {
    const createdAt = (order as any).createdAt ?? (order as any).created_at;
    const status = normalizeOrderStatus((order as any).status);
    const hoursSinceCreation = createdAt
      ? differenceInHours(new Date(), new Date(createdAt))
      : Number.POSITIVE_INFINITY;

    if (status !== 'PENDING') {
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
        message: 'Se aplicará un reembolso completo (100%) a tu método de pago original. ¿Deseas continuar?' 
    };
};
