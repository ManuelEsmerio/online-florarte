// src/lib/data/loyalty-history-data.ts
import type { DbLoyaltyHistory } from '@/lib/definitions';

export const loyaltyHistoryData: (DbLoyaltyHistory & { user_name: string; user_email: string; })[] = [
    {
        id: 1,
        user_id: 2,
        user_name: "Juan Pérez",
        user_email: "juan.perez@example.com",
        order_id: 101,
        points: 850,
        transaction_type: 'ganado',
        notes: 'Puntos por compra de pedido ORD101',
        created_at: new Date('2024-07-22T14:31:00Z'),
    },
    {
        id: 2,
        user_id: 3,
        user_name: "Maria Garcia",
        user_email: "maria.garcia@example.com",
        order_id: 102,
        points: 1000,
        transaction_type: 'ganado',
        notes: 'Puntos por compra de pedido ORD102',
        created_at: new Date('2024-07-21T10:16:00Z'),
    },
    {
        id: 3,
        user_id: 3,
        user_name: "Maria Garcia",
        user_email: "maria.garcia@example.com",
        points: -3000,
        transaction_type: 'redimido',
        notes: 'Canje por cupón de $200',
        created_at: new Date('2024-07-23T11:00:00Z'),
    },
];
