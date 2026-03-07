// src/app/admin/orders/columns.tsx
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { AdminOrderListDTO, OrderStatus } from '@/lib/definitions';
import type { User as DeliveryUser } from '@/lib/definitions';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatTimeSlotForUI } from '@/lib/utils';
import { OrderActionsCell } from '@/components/admin/orders/OrderActionsCell';


const statusStyles: { [key in OrderStatus]: string } = {
  PENDING: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700',
  DELIVERED: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800',
  SHIPPED: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800',
  PROCESSING: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800',
  PAYMENT_FAILED: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800',
  EXPIRED: 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700',
};

const statusTranslations: { [key in OrderStatus]: string } = {
  PENDING: 'Pendiente',
  PROCESSING: 'En Proceso',
  SHIPPED: 'En Reparto',
  DELIVERED: 'Completado',
  CANCELLED: 'Cancelado',
  PAYMENT_FAILED: 'Pago Fallido',
  EXPIRED: 'Expirado',
};

const normalizeOrderStatus = (value: unknown): OrderStatus | null => {
  const raw = String(value ?? '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // quita acentos

  const map: Record<string, OrderStatus> = {
    // Prisma enum
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    SHIPPED: 'SHIPPED',
    DELIVERED: 'DELIVERED',
    CANCELLED: 'CANCELLED',

    // etiquetas ES que te pueden llegar desde mapper/backend
    PENDIENTE: 'PENDING',
    PROCESANDO: 'PROCESSING',
    'EN PROCESO': 'PROCESSING',
    EN_REPARTO: 'SHIPPED',
    'EN CAMINO': 'SHIPPED',
    COMPLETADO: 'DELIVERED',
    CANCELADO: 'CANCELLED',
  };

  return map[raw] ?? null;
};

const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
}


export type OrderColumnsProps = {
  onUpdateStatus: (orderId: number, status: OrderStatus, payload: { deliveryDriverId?: number, deliveryNotes?: string }) => Promise<void>;
  onCancelOrder: (orderId: number) => Promise<void> | void;
  onViewDetails: (orderId: number) => void;
  onSendUpdate: (order: AdminOrderListDTO) => void;
  isSendingUpdateFor: number | null;
  deliveryDrivers: DeliveryUser[];
};


export const columns = ({ onUpdateStatus, onCancelOrder, onViewDetails, deliveryDrivers, onSendUpdate, isSendingUpdateFor }: OrderColumnsProps): ColumnDef<AdminOrderListDTO>[] => [
  {
    accessorKey: 'id',
    header: ({ column }) => {
        return (
          <Button 
            variant="ghost" 
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className='hover:bg-primary/10 data-[state=active]:bg-primary/10 hover:text-primary data-[state=active]:text-primary'
          >
            Pedido ID
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
    },
    sortingFn: "basic",
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
    accessorKey: 'deliveryDate',
    header: 'Entrega',
    cell: ({ row }) => {
        const order = row.original;
        return (
            <div>
          <p>{format(parseISO(order.deliveryDate), 'dd MMM yyyy')}</p>
          <p className="text-xs text-muted-foreground">{formatTimeSlotForUI(order.deliveryTimeSlot)}</p>
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
                 {order.couponDiscount && order.couponDiscount > 0 && <p className="text-xs text-green-600">Desc: -{formatCurrency(order.couponDiscount)}</p>}
            </div>
        )
    },
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const normalized = normalizeOrderStatus(row.getValue('status'));
      if (!normalized) return <span className="text-muted-foreground">Sin estado</span>;

      return (
        <Badge variant="outline" className={`capitalize ${statusStyles[normalized]}`}>
          {statusTranslations[normalized]}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      if (!value || (Array.isArray(value) && value.length === 0)) return true;
      const rowStatus = normalizeOrderStatus(row.getValue(id));
      if (!rowStatus) return false;

      const selected = (value as string[])
        .map(v => normalizeOrderStatus(v))
        .filter(Boolean) as OrderStatus[];

      return selected.includes(rowStatus);
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <OrderActionsCell 
        row={row} 
        onUpdateStatus={onUpdateStatus} 
        onCancelOrder={onCancelOrder} 
      onViewDetails={onViewDetails}
        deliveryDrivers={deliveryDrivers} 
        onSendUpdate={onSendUpdate} 
        isSendingUpdateFor={isSendingUpdateFor} 
    />,
  },
];
