// src/lib/business-logic/order-logic.ts
import { differenceInHours } from 'date-fns';
import { Order, OrderStatus } from '../definitions';

/**
 * Proporciona una traducción legible para los estados de un pedido.
 * @type {{ [key in OrderStatus]: string }}
 */
const statusTranslations: { [key in OrderStatus]: string } = {
    'pendiente': 'Pendiente',
    'procesando': 'En Proceso',
    'en_reparto': 'En Reparto',
    'completado': 'Completado',
    'cancelado': 'Cancelado',
}

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
    const hoursSinceCreation = differenceInHours(new Date(), new Date(order.created_at));

    if (order.status !== 'pendiente') {
        return { 
            canCancel: false, 
            message: `El pedido ya no se puede cancelar porque su estado es "${statusTranslations[order.status]}".`
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
