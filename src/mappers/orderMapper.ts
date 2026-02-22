// src/mappers/orderMapper.ts
import type { Order, OrderItem } from '@/lib/definitions';
import { getPublicUrlForPath } from '@/utils/file-utils';

/**
 * Mapea una fila de la base de datos a un objeto Order limpio y parcial.
 * 
 * Esta función es el primer paso para convertir los datos crudos de la tabla `orders`
 * a un formato utilizable por la aplicación. Se encarga de la conversión de tipos
 * (ej. de string a número) y del renombramiento de campos (ej. `customer_name` a `customerName`).
 *
 * @param {any} row - El objeto de la fila de la base de datos, usualmente de un JOIN.
 * @returns {Order} Un objeto Order parcial. Las propiedades complejas como `items` o `shippingAddress`
 * se deben añadir posteriormente en la capa de servicio.
 */
export function mapDbOrderToOrder(row: any): Order {
  return {
    id: row.id,
    user_id: row.user_id,
    address_id: row.address_id,
    coupon_id: row.coupon_id,
    status: row.order_status_code, // El código de estado viene del JOIN con order_statuses
    subtotal: parseFloat(row.subtotal),
    coupon_discount: row.coupon_discount ? parseFloat(row.coupon_discount) : undefined,
    shipping_cost: parseFloat(row.shipping_cost),
    total: parseFloat(row.total),
    delivery_date: new Date(row.delivery_date).toISOString().split('T')[0],
    delivery_time_slot: row.delivery_time_slot,
    dedication: row.dedication,
    is_anonymous: !!row.is_anonymous,
    signature: row.signature,
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString(),
    
    // --- Campos enriquecidos (vienen de JOINs) ---
    customerName: row.customer_name || '',
    customerEmail: row.customer_email || '',
    customerPhone: row.customer_phone || null,
    recipientName: row.recipient_name || '',
    recipientPhone: row.recipient_phone || '',
    
    // --- Campos que se llenarán por separado en el servicio ---
    shippingAddress: '', // Se construye en el servicio a partir de los datos de la dirección.
    items: [], // Se obtiene con una consulta separada a `order_items`.
  };
}

/**
 * Mapea un array de filas de la tabla `order_items` a un array de objetos OrderItem.
 * 
 * Esta función procesa los productos de un pedido, construyendo la URL pública
 * para las imágenes y asegurando que la estructura de datos sea la correcta para el frontend.
 *
 * @param {any[]} rows - Un array de filas de la tabla `order_items`.
 * @returns {OrderItem[]} Un array de objetos OrderItem listos para ser usados en la aplicación.
 */
export function mapDbOrderItemsToOrderItems(rows: any[]): OrderItem[] {
  return rows.map(row => ({
    id: row.id,
    order_id: row.order_id,
    product_id: row.product_id,
    variant_id: row.variant_id,
    quantity: row.quantity,
    price: parseFloat(row.price),
    product_name: row.product_name,
    image: getPublicUrlForPath(row.product_image), // Construye la URL pública
    variant_name: row.variant_name,
    customPhotoUrl: row.custom_photo_url ? getPublicUrlForPath(row.custom_photo_url) : undefined,
  }));
}
