

'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { PeakDate } from '@/lib/definitions';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { formatDateIntl } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

type ColumnsProps = {
  onEdit: (peakDate: PeakDate) => void;
  onDelete: (id: number) => void;
  onToggleRestriction: (peakDate: PeakDate) => void;
  isDeletingId: number | null;
  updatingRestrictionId: number | null;
};

const RestrictionToggle = ({
  peakDate,
  onToggleRestriction,
  isUpdating
}: {
  peakDate: PeakDate;
  onToggleRestriction: (peakDate: PeakDate) => void;
  isUpdating: boolean;
}) => {

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onToggleRestriction(peakDate);
  };
  
  return (
    <div className="relative flex items-center justify-center">
        {isUpdating && <Loader2 className="absolute h-4 w-4 animate-spin" />}
        <Switch
            checked={peakDate.is_coupon_restricted}
            onCheckedChange={() => onToggleRestriction(peakDate)}
            disabled={isUpdating}
            className={isUpdating ? 'opacity-50' : ''}
            aria-label={`Restringir cupones para ${peakDate.name}`}
        />
    </div>
  );
};


export const columns = ({ onEdit, onDelete, onToggleRestriction, isDeletingId, updatingRestrictionId }: ColumnsProps): ColumnDef<PeakDate>[] => [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Nombre
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: 'peak_date',
    header: 'Fecha',
    cell: ({ row }) => {
      const dateValue = row.getValue('peak_date') as string;
      return formatDateIntl(dateValue) || '-';
    },
  },
  {
    accessorKey: 'is_coupon_restricted',
    header: 'Cupones Restringidos',
    cell: ({ row }) => {
      const peakDate = row.original;
      return (
        <RestrictionToggle
          peakDate={peakDate}
          onToggleRestriction={onToggleRestriction}
          isUpdating={updatingRestrictionId === peakDate.id}
        />
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const peakDate = row.original;
      const isDeleting = isDeletingId === peakDate.id;

      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0" disabled={isDeleting}>
                <span className="sr-only">Abrir menú</span>
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => onEdit(peakDate)}>Editar</DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="text-destructive focus:bg-destructive/90 focus:text-destructive-foreground" onSelect={(e) => e.preventDefault()}>
                    Eliminar
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro de que quieres eliminar esta fecha?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. La fecha pico <span className="font-medium">{peakDate.name}</span> será eliminada permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => onDelete(peakDate.id)}>
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
