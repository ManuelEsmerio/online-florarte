
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Coupon, CouponStatus } from '@/lib/definitions';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';
import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AdminConfirmDialog } from '@/components/admin/AdminConfirmDialog';


const getStatusVariant = (status: CouponStatus): 'success' | 'destructive' | 'secondary' => {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'EXPIRED':
      return 'destructive';
    case 'USED':
    case 'PAUSED':
      return 'secondary';
    default:
      return 'secondary';
  }
};

const couponStatusLabels: Record<CouponStatus, string> = {
  ACTIVE: 'Vigente',
  EXPIRED: 'Vencido',
  USED: 'Utilizado',
  PAUSED: 'Pausado',
};


type CouponColumnsProps = {
  onEdit: (coupon: Coupon) => void;
  onDelete: (id: number) => void;
  onSendCoupon: (coupon: Coupon) => void;
  isSendingCouponId: number | null;
  isDeletingId: number | null;
};

export const columns = ({
  onEdit,
  onDelete,
  onSendCoupon,
  isSendingCouponId,
  isDeletingId
}: CouponColumnsProps): ColumnDef<Coupon>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'code',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="hover:bg-primary/10 hover:text-primary"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Código
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-mono font-bold">{row.getValue('code')}</div>,
  },
  {
    accessorKey: 'description',
    header: 'Descripción',
  },
  {
    accessorKey: 'discountValue',
    header: 'Descuento',
    cell: ({ row }) => {
      const coupon = row.original;
      if (coupon.discountType === 'PERCENTAGE') {
        return <span>{coupon.discountValue}%</span>;
      }
      return <span>{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(coupon.discountValue)}</span>;
    },
  },
   {
    id: 'usage',
    header: 'Uso',
    cell: ({ row }) => {
      const uses = row.original.usesCount || 0;
      const maxUses = row.original.maxUses;
      return <span>{uses} / {maxUses || '∞'}</span>;
    },
  },
   {
    accessorKey: 'scope',
    header: 'Ámbito',
    cell: ({ row }) => {
      const coupon = row.original;
      const scope = coupon.scope;

      let details = '';
      let detailCount = 0;
      if(scope === 'USERS' && coupon.details?.users) {
        detailCount = coupon.details.users.length;
        details = detailCount === 1 ? coupon.details.users[0].name : `${detailCount} usuarios`;
      } else if (scope === 'CATEGORIES' && coupon.details?.categories) {
        detailCount = coupon.details.categories.length;
        details = detailCount === 1 ? coupon.details.categories[0].name : `${detailCount} categorías`;
      } else if (scope === 'PRODUCTS' && coupon.details?.products) {
        detailCount = coupon.details.products.length;
        details = detailCount === 1 ? coupon.details.products[0].name : `${detailCount} productos`;
      }

      return (
        <div>
            <p className="capitalize">{scope}</p>
            {details && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="text-xs text-muted-foreground underline decoration-dashed">{details}</p>
                    </TooltipTrigger>
                    <TooltipContent>
                       {detailCount > 1 ? (
                          <ul className='list-disc pl-4'>
                            {(coupon.details?.users || coupon.details?.categories || coupon.details?.products)?.map(item => <li key={item.id}>{item.name}</li>)}
                          </ul>
                       ) : <p>{details}</p>}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
            )}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'validUntil',
    header: 'Vence',
    cell: ({ row }) => {
      const validUntil = row.original.validUntil ? new Date(row.original.validUntil) : null;
      if (!validUntil) return <span className='text-muted-foreground'>Nunca</span>;
      return (
        <div>
          <p>{format(validUntil, 'P', { locale: es })}</p>
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const status = row.getValue('status') as CouponStatus;
      return (
        <Badge
          variant={getStatusVariant(status)}
          className="capitalize"
        >
          {couponStatusLabels[status] ?? status}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const coupon = row.original;
      const isSending = isSendingCouponId === coupon.id;
      const isDeleting = isDeletingId === coupon.id;

      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary" disabled={isDeleting}>
                <span className="sr-only">Abrir menú</span>
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => onEdit(coupon)}>
                Editar
              </DropdownMenuItem>
              {coupon.scope === 'USERS' && coupon.details?.users && coupon.details.users.length > 0 && (
                <DropdownMenuItem onSelect={() => onSendCoupon(coupon)} disabled={isSending}>
                  {isSending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  {isSending ? 'Enviando...' : 'Enviar por Correo'}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <AdminConfirmDialog
                trigger={
                  <DropdownMenuItem
                    className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                    onSelect={(e) => e.preventDefault()}
                  >
                    Eliminar
                  </DropdownMenuItem>
                }
                title="¿Eliminar cupón?"
                description={
                  <>
                    Esta acción no se puede deshacer. El cupón{' '}
                    <span className="font-mono font-bold">{coupon.code}</span> será eliminado
                    permanentemente.
                  </>
                }
                confirmText="Sí, eliminar"
                onConfirm={() => onDelete(coupon.id)}
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
