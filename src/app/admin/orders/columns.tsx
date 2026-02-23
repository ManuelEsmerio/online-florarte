// src/app/admin/orders/columns.tsx
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Order, OrderStatus } from '@/lib/definitions';
import type { User as DeliveryUser } from '@/lib/definitions';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatTimeSlotForUI } from '@/lib/utils';
import { OrderActionsCell } from '@/components/admin/orders/OrderActionsCell';


const statusStyles: { [key in OrderStatus]: string } = {
  pendiente: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700',
  completado: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800',
  enviado: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800',
  procesando: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800',
  cancelado: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800',
};

const statusTranslations: { [key in OrderStatus]: string } = {
  pendiente: 'Pendiente',
  procesando: 'En Proceso',
  enviado: 'Enviado',
  completado: 'Completado',
  cancelado: 'Cancelado',
};

const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
}


export type OrderColumnsProps = {
  onUpdateStatus: (orderId: number, status: OrderStatus, payload: { deliveryDriverId?: number, deliveryNotes?: string }) => Promise<void>;
  onCancelOrder: (orderId: number) => Promise<void>;
  onSendUpdate: (order: Order) => void;
  isSendingUpdateFor: number | null;
  deliveryDrivers: DeliveryUser[];
};


export const columns = ({ onUpdateStatus, onCancelOrder, deliveryDrivers, onSendUpdate, isSendingUpdateFor }: OrderColumnsProps): ColumnDef<Order>[] => [
  {
    accessorKey: 'id',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      className='hover:bg-primary/10 data-[state=active]:bg-primary/10 hover:text-primary data-[state=active]:text-primary'>
        Pedido ID
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-medium">ORD${String(row.getValue('id')).padStart(4, '0')}</div>,
  },
  {
    accessorKey: 'customerName',
    header: 'Cliente',
     cell: ({ row }) => {
        const order = row.original;
        return (
            <div>
                <p className="font-medium">{order.customerName}</p>
                <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
            </div>
        )
    }
  },
   {
    accessorKey: 'deliveryDriverName',
    header: 'Repartidor',
    cell: ({ row }) => row.original.deliveryDriverName || <span className="text-muted-foreground">No asignado</span>,
  },
  {
    accessorKey: 'delivery_date',
    header: 'Entrega',
    cell: ({ row }) => {
        const order = row.original;
        return (
            <div>
                <p>{format(parseISO(order.delivery_date), 'dd MMM yyyy')}</p>
                <p className="text-xs text-muted-foreground">{formatTimeSlotForUI(order.delivery_time_slot)}</p>
            </div>
        )
    },
  },
   {
    accessorKey: 'total',
    header: () => <div className="text-right">Total</div>,
    cell: ({ row }) => {
        const order = row.original;
        return (
            <div className="text-right">
                <p className="font-medium">{formatCurrency(order.total)}</p>
                <p className="text-xs text-muted-foreground">Subtotal: {formatCurrency(order.subtotal)}</p>
                 {order.coupon_discount && order.coupon_discount > 0 && <p className="text-xs text-green-600">Desc: -{formatCurrency(order.coupon_discount)}</p>}
            </div>
        )
    },
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const status = row.getValue('status') as OrderStatus;
      return (
        <Badge
          variant="outline"
          className={`capitalize ${statusStyles[status]}`}
        >
          {statusTranslations[status]}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
        if (!value || (Array.isArray(value) && value.length === 0)) return true;
        return (value as string[]).includes(row.getValue(id));
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <OrderActionsCell 
        row={row} 
        onUpdateStatus={onUpdateStatus} 
        onCancelOrder={onCancelOrder} 
        deliveryDrivers={deliveryDrivers} 
        onSendUpdate={onSendUpdate} 
        isSendingUpdateFor={isSendingUpdateFor} 
    />,
  },
];
