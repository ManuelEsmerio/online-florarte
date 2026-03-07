'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { ProductCategory } from '@/lib/definitions';
import React from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AdminConfirmDialog } from '@/components/admin/AdminConfirmDialog';

type ColumnsProps = {
  onEdit: (category: ProductCategory) => void;
  onDelete: (id: number) => Promise<void>;
  onToggleShowOnHome: (category: ProductCategory) => void;
  allCategories: ProductCategory[];
  isDeletingId: number | null;
  updatingVisibilityId: number | null;
};

const ShowOnHomeToggle = ({
  category,
  onToggle,
  isUpdating
}: {
  category: ProductCategory;
  onToggle: (category: ProductCategory) => void;
  isUpdating: boolean;
}) => {
  return (
    <div className="relative flex items-center justify-center">
        {isUpdating && <Loader2 className="absolute h-4 w-4 animate-spin" />}
        <Switch
            checked={category.showOnHome}
            onCheckedChange={() => onToggle(category)}
            disabled={isUpdating}
            className={isUpdating ? 'opacity-50' : ''}
            aria-label={`Mostrar ${category.name} en la página de inicio`}
        />
    </div>
  );
};


export const columns = ({ onEdit, onDelete, onToggleShowOnHome, allCategories, isDeletingId, updatingVisibilityId }: ColumnsProps): ColumnDef<ProductCategory>[] => [
  {
    accessorKey: 'imageUrl',
    header: 'Imagen',
    cell: ({ row }) => {
      const imageUrl = row.getValue('imageUrl') as string;
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
    cell: ({ row }) => {
        const category = row.original;
        const isSubcategory = !!category.parentId;
        return (
            <div className={isSubcategory ? 'pl-4' : ''}>
                {isSubcategory && <span className="text-muted-foreground mr-1">↳</span>}
                <span className="font-medium">{category.name}</span>
            </div>
        )
    }
  },
  {
    accessorKey: 'parentId',
    header: 'Categoría Padre',
    cell: ({ row }) => {
      const parentId = row.getValue('parentId') as number | undefined;
      if (!parentId) {
        return <Badge variant="secondary">Principal</Badge>;
      }
      const parentCategory = allCategories.find(c => c.id === parentId);
      return parentCategory ? parentCategory.name : 'N/A';
    },
     filterFn: (row, id, value) => {
      const parentId = row.getValue('parentId') as number | null;
      if (value === 'all') return true;
      if (value === 'main') return parentId === null;
      return parentId === Number(value);
    },
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
        const category = row.original;
        return (
            <ShowOnHomeToggle
                category={category}
                onToggle={onToggleShowOnHome}
                isUpdating={updatingVisibilityId === category.id}
            />
        )
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const category = row.original;
      const isDeleting = isDeletingId === category.id;

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
              <DropdownMenuItem onSelect={() => onEdit(category)}>Editar</DropdownMenuItem>
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
                title="¿Eliminar categoría?"
                description={
                  <>
                    Esta acción no se puede deshacer. La categoría{' '}
                    <span className="font-semibold">{category.name}</span> será eliminada
                    permanentemente.
                    <br />
                    <br />
                    <span className="font-semibold text-destructive">Nota:</span> Solo podrás
                    eliminarla si no tiene productos o subcategorías asociadas.
                  </>
                }
                confirmText="Sí, eliminar"
                onConfirm={() => onDelete(category.id)}
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
