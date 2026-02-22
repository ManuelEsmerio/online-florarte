// src/repositories/orderRepository.ts
import { allOrders } from '@/lib/data/order-data';
import { allProducts } from '@/lib/data/product-data';
import { allUsers } from '@/lib/data/user-data';

export const orderRepository = {
  async findAllForAdmin(filters: any) {
    return { orders: [...allOrders], total: allOrders.length };
  },

  async findUserOrdersWithItems(userId: number) {
    // Aplanamos los pedidos y sus items para el mapper
    return allOrders
      .filter(o => o.user_id === userId)
      .flatMap(o => (o.items || []).map(it => ({
        ...o,
        order_status_code: o.status,
        order_item_id: it.id || Math.random(),
        product_id: it.product_id,
        quantity: it.quantity,
        unit_price: it.price,
        product_name: it.product_name,
        product_image: it.image,
        customer_name: o.customerName,
        customer_email: o.customerEmail,
      })));
  },

  async findDetailsById(orderId: number) {
    return allOrders.find(o => o.id === orderId) || null;
  },

  async findItemsByOrderId(orderId: number) {
    const order = allOrders.find(o => o.id === orderId);
    return order?.items || [];
  },

  async initializeCheckout(params: any) {
    const newId = Math.max(...allOrders.map(o => o.id), 100) + 1;
    const user = allUsers.find(u => u.id === params.p_user_id);
    
    // Obtenemos la dirección seleccionada si existe
    const address = user?.addresses?.find(a => a.id === params.addressId);
    const shippingAddressString = address 
        ? `${address.streetName} ${address.streetNumber}, ${address.neighborhood}, ${address.city}, ${address.state}`
        : 'Dirección no especificada';

    // Simulamos la creación de la orden en la "base de datos"
    const newOrder: any = {
      id: newId,
      user_id: params.p_user_id,
      customerName: user?.name || 'Cliente',
      customerEmail: user?.email || '',
      status: 'procesando', // En modo mock, la pasamos directo a procesando tras el checkout
      subtotal: 0, 
      total: 0,
      shipping_cost: params.shippingCost || 0,
      delivery_date: params.p_delivery_date,
      delivery_time_slot: params.p_delivery_time_slot,
      shippingAddress: shippingAddressString,
      dedication: params.dedication || '',
      is_anonymous: params.isAnonymous || false,
      signature: params.signature || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: [],
    };

    allOrders.push(newOrder);

    return {
      order_id: newId,
      order_token: `token_${newId}`,
      amount_total: 0, // Se actualizará en el servicio
      customer_email: user?.email || '',
      result: 1,
      message: 'Orden creada correctamente en el sistema mock'
    };
  },

  async finalizePayment(params: any) {
    const order = allOrders.find(o => o.id === params.p_order_id_opt);
    if (order) {
      order.status = 'procesando';
      return { orderId: order.id, result: 1, message: 'Pago mock finalizado' };
    }
    return { orderId: null, result: 0, message: 'Orden no encontrada' };
  },

  async update(orderId: number, data: any) {
    const order = allOrders.find(o => o.id === orderId);
    if (order) {
      Object.assign(order, data);
      return true;
    }
    return false;
  }
};
