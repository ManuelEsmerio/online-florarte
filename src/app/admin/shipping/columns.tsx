
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ShippingZone } from '@/lib/definitions';
import React from 'react';
import { Badge } from '@/components/ui/badge';

type ColumnsProps = {
  onEdit: (zone: ShippingZone) => void;
  onDelete: (id: number) => void;
  isDeletingId: number | null;
};

const formatCurrency = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

export const columns = ({ onEdit, onDelete, isDeletingId }: ColumnsProps): ColumnDef<ShippingZone>[] => [
  {
    accessorKey: 'postalCode',
    header: ({ column }) => (
      <Button variant="ghost" className="hover:bg-primary/10 hover:text-primary" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Código Postal
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-mono">{row.getValue('postalCode')}</div>,
  },
  {
    accessorKey: 'locality',
    header: 'Localidad',
  },
  {
    accessorKey: 'municipality',
    header: 'Municipio',
    cell: ({ row }) => row.original.municipality ?? '—',
  },
  {
    accessorKey: 'zone',
    header: 'Zona',
    cell: ({ row }) => row.original.zone ?? '—',
  },
  {
    accessorKey: 'shippingCost',
    header: () => <div className="text-right">Costo de Envío</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('shippingCost'));
      return <div className="text-right font-medium">{formatCurrency(amount)}</div>;
    },
  },
  {
    accessorKey: 'isActive',
    header: 'Estado',
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? 'success' : 'secondary'}>
        {row.original.isActive ? 'Activo' : 'Inactivo'}
      </Badge>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const zone = row.original;
      const isDeleting = isDeletingId === zone.id;

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
              <DropdownMenuItem onSelect={() => onEdit(zone)}>Editar</DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="text-destructive focus:bg-destructive/90 focus:text-destructive-foreground" onSelect={(e) => e.preventDefault()}>
                    Eliminar
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro de que quieres eliminar esta zona?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. La zona para el código postal <span className="font-mono font-bold">{zone.postalCode}</span> será eliminada permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => onDelete(zone.id)}>
                      Sí, eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
