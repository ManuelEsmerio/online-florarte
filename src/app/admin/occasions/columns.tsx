'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Occasion } from '@/lib/definitions';
import React from 'react';
import Image from 'next/image';
import { Switch } from '@/components/ui/switch';
import { AdminConfirmDialog } from '@/components/admin/AdminConfirmDialog';

type ColumnsProps = {
  onEdit: (occasion: Occasion) => void;
  onDelete: (id: number) => void;
  onToggleShowOnHome: (occasion: Occasion) => void;
  isDeletingId: number | null;
  updatingVisibilityId: number | null;
};

const ShowOnHomeToggle = ({
  occasion,
  onToggle,
  isUpdating
}: {
  occasion: Occasion;
  onToggle: (occasion: Occasion) => void;
  isUpdating: boolean;
}) => {
  return (
    <div className="relative flex items-center justify-center">
        {isUpdating && <Loader2 className="absolute h-4 w-4 animate-spin" />}
        <Switch
            checked={occasion.showOnHome}
            onCheckedChange={() => onToggle(occasion)}
            disabled={isUpdating}
            className={isUpdating ? 'opacity-50' : ''}
            aria-label={`Mostrar ${occasion.name} en la página de inicio`}
        />
    </div>
  );
};

export const columns = ({ onEdit, onDelete, onToggleShowOnHome, isDeletingId, updatingVisibilityId }: ColumnsProps): ColumnDef<Occasion>[] => [
    {
    accessorKey: 'imageUrl',
    header: 'Imagen',
    cell: ({ row }) => {
      const imageUrl = row.original.imageUrl;
      const name = row.original.name;
      return (
        <Image
          src={imageUrl || '/placehold.webp'}
          alt={name}
          width={40}
          height={40}
          className="rounded-md object-cover"
        />
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button variant="ghost" className="hover:bg-primary/10 hover:text-primary" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Nombre
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: 'slug',
    header: 'Slug',
    cell: ({ row }) => <div className="font-mono">{row.getValue('slug')}</div>,
  },
   {
    accessorKey: 'description',
    header: 'Descripción',
    cell: ({ row }) => <div className="truncate max-w-xs">{row.getValue('description')}</div>,
  },
  {
    accessorKey: 'showOnHome',
    header: 'Mostrar en Home',
    cell: ({ row }) => {
      const occasion = row.original;
      return (
        <ShowOnHomeToggle
          occasion={occasion}
          onToggle={onToggleShowOnHome}
          isUpdating={updatingVisibilityId === occasion.id}
        />
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const occasion = row.original;
      const isDeleting = isDeletingId === occasion.id;

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
              <DropdownMenuItem onSelect={() => onEdit(occasion)}>Editar</DropdownMenuItem>
              <DropdownMenuSeparator />
              <AdminConfirmDialog
                trigger={
                  <DropdownMenuItem
                    className="text-destructive focus:bg-destructive/90 focus:text-destructive-foreground"
                    onSelect={(e) => e.preventDefault()}
                  >
                    Eliminar
                  </DropdownMenuItem>
                }
                title="¿Eliminar ocasión?"
                description={
                  <>
                    Esta acción no se puede deshacer. La ocasión{' '}
                    <span className="font-semibold">{occasion.name}</span> será eliminada
                    permanentemente.
                    <br />
                    <br />
                    <span className="font-semibold text-destructive">Nota:</span> Solo podrás
                    eliminarla si no tiene productos asociados.
                  </>
                }
                confirmText="Sí, eliminar"
                onConfirm={() => onDelete(occasion.id)}
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
