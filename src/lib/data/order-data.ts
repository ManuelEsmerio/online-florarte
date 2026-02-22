
// src/lib/data/order-data.ts
import type { Order } from '../definitions';

const initialOrders: Order[] = [
    {
        id: 101,
        user_id: 2,
        customerName: "Juan Pérez",
        customerEmail: "juan.perez@example.com",
        address_id: 1,
        shippingAddress: "Calle Ficticia 123, Tequila, Jalisco",
        status: 'completado',
        subtotal: 850,
        shipping_cost: 0,
        total: 850,
        delivery_date: "2024-07-22",
        delivery_time_slot: "12 PM - 5 PM",
        created_at: "2024-07-20T10:00:00Z",
        updated_at: "2024-07-22T14:30:00Z",
        items: [
            { product_id: 1, quantity: 1, price: 850, product_name: "Ramo de 12 Rosas Rojas", image: "https://picsum.photos/seed/roses12/600/600" },
        ],
        hasReview: true,
        testimonial: { id: 1, rating: 5, comment: "¡Excelente servicio!", status: 'approved' },
    }
];

const globalForOrders = global as unknown as { allOrders: Order[] };
export let allOrders = globalForOrders.allOrders || initialOrders;

if (process.env.NODE_ENV !== 'production') {
  globalForOrders.allOrders = allOrders;
}
