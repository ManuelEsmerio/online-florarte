// src/services/orderService.ts
import { orderRepository } from '../repositories/orderRepository';
import { cartRepository } from '../repositories/cartRepository';
import type { Order, OrderStatus } from '@/lib/definitions';

export const orderService = {
  async getAllOrdersForAdmin(filters: any) {
    return await orderRepository.findAllForAdmin(filters);
  },
  
  async getOrdersForUser(userId: number): Promise<Order[]> {
    const dbRows = await orderRepository.findUserOrdersWithItems(userId);
    const ordersMap = new Map<number, Order>();

    for (const row of dbRows) {
        if (!ordersMap.has(row.id)) {
            ordersMap.set(row.id, {
                id: row.id,
                user_id: row.user_id,
                customerName: row.customer_name,
                customerEmail: row.customer_email,
                status: row.status as OrderStatus,
                subtotal: row.subtotal,
                total: row.total,
                shipping_cost: row.shipping_cost,
                shippingAddress: row.shippingAddress || 'Dirección de prueba',
                delivery_date: row.delivery_date,
                delivery_time_slot: row.delivery_time_slot,
                dedication: row.dedication,
                is_anonymous: row.is_anonymous,
                signature: row.signature,
                created_at: row.created_at,
                items: [],
            } as Order);
        }
        const order = ordersMap.get(row.id)!;
        order.items!.push({
            product_id: row.product_id,
            quantity: row.quantity,
            price: row.unit_price,
            product_name: row.product_name,
            image: row.product_image,
        } as any);
    }
    return Array.from(ordersMap.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },
  
  async getOrderDetails(orderId: number): Promise<Order | null> {
    const dbOrder = await orderRepository.findDetailsById(orderId);
    if (!dbOrder) return null;
    const items = await orderRepository.findItemsByOrderId(orderId);
    return { ...dbOrder, items } as any;
  },
  
  async updateOrderStatus(orderId: number, newStatus: OrderStatus, payload: any): Promise<boolean> {
    return await orderRepository.update(orderId, { status: newStatus, ...payload });
  },

  async initializeCheckout(params: any) {
    // Obtenemos el carrito para calcular el total real y pasar los items a la orden
    const cartData = await cartRepository.getContents({ userId: params.userId, sessionId: params.sessionId });
    
    if (!cartData.items || cartData.items.length === 0) {
        throw new Error("El carrito está vacío.");
    }

    const result = await orderRepository.initializeCheckout({
        ...params,
        p_user_id: params.userId,
        p_session_id: params.sessionId,
        p_delivery_date: params.deliveryDate,
        p_delivery_time_slot: params.deliveryTimeSlot,
    });
    
    if (result.order_id) {
        const order = await orderRepository.findDetailsById(result.order_id);
        if (order) {
            order.subtotal = cartData.totals.subtotal;
            order.total = cartData.totals.subtotal + (params.shippingCost || 0);
            order.items = cartData.items.map(it => ({
                product_id: it.product_id,
                quantity: it.quantity,
                price: it.unit_price,
                product_name: it.product_name,
                image: it.product_image
            }));
        }
    }

    return { 
        orderId: result.order_id!, 
        total: (cartData.totals.subtotal + (params.shippingCost || 0)),
        customerEmail: result.customer_email || '',
        orderToken: result.order_token || '',
    };
  },
  
  async finalizeOrderFromWebhook(params: any) {
    const result = await orderRepository.finalizePayment({ p_order_id_opt: params.orderId, ...params });
    return { success: true, orderId: result.orderId };
  },
};
