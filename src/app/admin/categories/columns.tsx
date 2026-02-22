'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { ProductCategory } from '@/lib/definitions';
import React from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

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
            checked={category.show_on_home}
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
    accessorKey: 'image_url',
    header: 'Imagen',
    cell: ({ row }) => {
      const imageUrl = row.getValue('image_url') as string;
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
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Nombre
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
        const category = row.original;
        const isSubcategory = !!category.parent_id;
        return (
            <div className={isSubcategory ? 'pl-4' : ''}>
                {isSubcategory && <span className="text-muted-foreground mr-1">↳</span>}
                <span className="font-medium">{category.name}</span>
            </div>
        )
    }
  },
  {
    accessorKey: 'parent_id',
    header: 'Categoría Padre',
    cell: ({ row }) => {
      const parentId = row.getValue('parent_id') as number | undefined;
      if (!parentId) {
        return <Badge variant="secondary">Principal</Badge>;
      }
      const parentCategory = allCategories.find(c => c.id === parentId);
      return parentCategory ? parentCategory.name : 'N/A';
    },
     filterFn: (row, id, value) => {
      const parentId = row.getValue('parent_id') as number | null;
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
    accessorKey: 'show_on_home',
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
              <Button variant="ghost" className="h-8 w-8 p-0" disabled={isDeleting}>
                <span className="sr-only">Abrir menú</span>
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => onEdit(category)}>Editar</DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="text-destructive focus:bg-destructive/90 focus:text-destructive-foreground" onSelect={(e) => e.preventDefault()}>
                    Eliminar
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro de que quieres eliminar esta categoría?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. La categoría <span className="font-medium">{category.name}</span> será eliminada permanentemente.
                       <br/><br/>
                      <span className="font-bold text-destructive">Nota:</span> Solo podrás eliminarla si no tiene productos o subcategorías asociadas.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => onDelete(category.id)}>
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
