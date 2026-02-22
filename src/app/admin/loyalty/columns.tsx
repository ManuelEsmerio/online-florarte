'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, TrendingUp, TrendingDown } from 'lucide-react';
import type { LoyaltyHistory } from '@/lib/definitions';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export const columns: ColumnDef<LoyaltyHistory>[] = [
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Fecha
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: 'userName',
    header: 'Cliente',
    cell: ({ row }) => (
        <div>
            <p className="font-medium">{row.original.userName}</p>
            <p className="text-xs text-muted-foreground">{row.original.userEmail}</p>
        </div>
    ),
  },
  {
    accessorKey: 'orderId',
    header: 'Pedido Ref.',
    cell: ({ row }) => {
        const orderId = row.original.orderId;
        return orderId 
            ? <Button variant="link" asChild className="p-0 h-auto"><Link href={`/admin/orders`}>ORD{String(orderId).padStart(4, '0')}</Link></Button> 
            : <span className="text-muted-foreground">N/A</span>;
    },
  },
  {
    accessorKey: 'transactionType',
    header: 'Tipo',
    cell: ({ row }) => {
        const type = row.original.transactionType;
        return <span className="capitalize">{type}</span>;
    }
  },
  {
    accessorKey: 'points',
    header: () => <div className="text-right">Puntos</div>,
    cell: ({ row }) => {
      const points = row.original.points;
      const isPositive = points > 0;
      return (
        <div className={cn(
            "flex items-center justify-end font-mono font-bold",
            isPositive ? "text-green-600" : "text-destructive"
        )}>
            {isPositive ? <TrendingUp className="mr-2 h-4 w-4" /> : <TrendingDown className="mr-2 h-4 w-4" />}
            {isPositive ? '+' : ''}{points}
        </div>
      );
    },
  },
];
