// src/app/orders/columns.tsx
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Order, OrderStatus } from '@/lib/definitions';
import { ArrowUpDown } from 'lucide-react';
import { DialogCell } from '@/components/orders/DialogCell';

const getStatusVariant = (status: OrderStatus): 'default' | 'destructive' | 'secondary' | 'success' => {
  switch (status) {
    case 'completado':
      return 'success';
    case 'en_reparto':
      return 'default';
    case 'cancelado':
      return 'destructive';
    default:
      return 'secondary';
  }
};

const statusTranslations: { [key in OrderStatus]: string } = {
    'pendiente': 'Pendiente',
    'procesando': 'En Proceso',
    'en_reparto': 'En Camino',
    'completado': 'Completado',
    'cancelado': 'Cancelado',
}

const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return 'N/A';
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
};

export const columns = ({ onDataChange }: { onDataChange: () => void }): ColumnDef<Order>[] => [
  {
    accessorKey: 'id',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="px-0 hover:bg-transparent"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        ID
        <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => {
       const trigger = <div className="font-bold cursor-pointer text-primary hover:underline transition-all">#{String(row.original.id).padStart(4, '0')}</div>;
       return <DialogCell row={row.original} trigger={trigger} />;
    }
  },
  {
    accessorKey: 'delivery_date',
    header: 'Entrega',
     cell: ({ row }) => {
        const date = new Date(row.original.delivery_date);
        const trigger = <div className="cursor-pointer font-medium hover:text-primary transition-colors">{date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</div>;
        return <DialogCell row={row.original} trigger={trigger} />;
     }
  },
  {
    accessorKey: 'total',
    header: () => <div className="text-right">Total</div>,
    cell: ({ row }) => {
      const amount = parseFloat(String(row.getValue('total')));
      const formatted = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
      const trigger = <div className="text-right font-bold cursor-pointer hover:text-primary transition-colors">{formatted}</div>;
      return <DialogCell row={row.original} trigger={trigger} />;
    },
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const status = row.getValue('status') as OrderStatus;
      const isUnpaidOrder = !(row.original as any).has_payment_transaction;
      const trigger = (
        <Badge
            variant={isUnpaidOrder ? 'destructive' : getStatusVariant(status)}
            className="capitalize text-[10px] px-2 py-0 h-5 cursor-pointer hover:opacity-80 transition-opacity"
        >
            {isUnpaidOrder ? 'Sin pago' : statusTranslations[status]}
        </Badge>
      );
       return <DialogCell row={row.original} trigger={trigger} />;
    },
     filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: 'actions',
    header: () => <div className="text-right">Detalle</div>,
    cell: ({ row }) => {
        const trigger = <Button variant="ghost" size="sm" className="h-8 text-primary font-bold hover:bg-primary/5">Ver más</Button>;
        return <DialogCell row={row.original} trigger={trigger} onDataChange={onDataChange} />;
    }
  }
];
