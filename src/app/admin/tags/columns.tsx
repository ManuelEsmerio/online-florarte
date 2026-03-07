'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tag } from '@/lib/definitions';
import React from 'react';
import { AdminConfirmDialog } from '@/components/admin/AdminConfirmDialog';

type ColumnsProps = {
  onEdit: (tag: Tag) => void;
  onDelete: (id: number) => void;
  isDeletingId: number | null;
};

export const columns = ({ onEdit, onDelete, isDeletingId }: ColumnsProps): ColumnDef<Tag>[] => [
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
    id: 'actions',
    cell: ({ row }) => {
      const tag = row.original;
      const isDeleting = isDeletingId === tag.id;

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
              <DropdownMenuItem onSelect={() => onEdit(tag)}>Editar</DropdownMenuItem>
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
                title="¿Eliminar etiqueta?"
                description={
                  <>
                    Esta acción no se puede deshacer. La etiqueta{' '}
                    <span className="font-semibold">{tag.name}</span> será eliminada
                    permanentemente.
                    <br />
                    <br />
                    <span className="font-semibold text-destructive">Nota:</span> Solo podrás
                    eliminarla si no tiene productos asociados.
                  </>
                }
                confirmText="Sí, eliminar"
                onConfirm={() => onDelete(tag.id)}
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
