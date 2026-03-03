
// src/app/admin/products/columns.tsx
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown, Eye, Loader2, Copy, PenSquare } from 'lucide-react';
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
import { Product, ProductStatus } from '@/lib/definitions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import Image from 'next/image';
import { Switch } from '@/components/ui/switch';
import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type ProductRow = Product & {
    isVariant: boolean;
    variantName?: string;
    variantId?: number;
  searchIndex?: string;
};

const getStatusVariant = (status: ProductStatus): 'success' | 'destructive' | 'secondary' => {
  switch (status) {
    case 'PUBLISHED':
      return 'success';
    case 'HIDDEN':
      return 'secondary';
    case 'DRAFT':
      return 'destructive';
    default:
      return 'secondary';
  }
}

const statusLabels: Record<ProductStatus, string> = {
  PUBLISHED: 'Publicado',
  HIDDEN: 'Oculto',
  DRAFT: 'Borrador',
};


type ProductColumnsProps = {
  onEdit: (product: Product) => void;
  onCopy: (product: Product) => void;
  onDelete: (slug: string) => void;
  onToggleStatus: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  updatingStatusId: string | null;
};

const ToggleStatusCell = ({ product, onToggleStatus, isUpdating }: { product: Product, onToggleStatus: (product: Product) => void, isUpdating: boolean }) => {
    const isPublished = product.status === 'PUBLISHED';
    const [isAlertOpen, setIsAlertOpen] = useState(false);

    const handleConfirmToggle = () => {
        onToggleStatus(product);
        setIsAlertOpen(false);
    }
    
    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        e.preventDefault();
        if (isUpdating) return;
        setIsAlertOpen(true);
    };

    return (
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            role="button"
                            onClick={handleClick}
                            className={cn(
                            "h-8 w-10 relative flex items-center justify-center rounded-md",
                                isUpdating && "cursor-not-allowed"
                            )}
                            aria-label={isUpdating ? "Actualizando estado..." : `Cambiar estado de ${product.name}`}
                        >
                            {isUpdating && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                            <Switch
                                id={`status-switch-${product.slug}`}
                                checked={isPublished}
                                aria-readonly
                                className={cn("cursor-pointer", isUpdating && "opacity-50")}
                            />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{isPublished ? "Ocultar en la tienda" : "Publicar en la tienda"}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Confirmar cambio de estado?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Estás a punto de {isPublished ? 'ocultar' : 'publicar'} el producto <span className="font-medium">{product.name}</span>.
                        {isPublished
                            ? ' El producto ya no será visible en la tienda.'
                            : ' El producto será visible para todos los clientes en la tienda.'
                        }
                        ¿Deseas continuar?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmToggle}>
                        Sí, confirmar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};


export const columns = ({
  onEdit,
  onCopy,
  onDelete,
  onToggleStatus,
  onViewDetails,
  updatingStatusId,
}: ProductColumnsProps): ColumnDef<ProductRow>[] => [
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
    cell: ({ row }) => {
        const product = row.original;
        if(product.isVariant) return null; // No mostrar checkbox para variantes
        return (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        )
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'mainImage',
    header: '',
    cell: ({ row }) => {
      const product = row.original;
      if (product.isVariant) return null;
      return (
        <Image
          src={product.mainImage || '/placehold.webp'}
          alt={product.name}
          width={48}
          height={48}
          className="rounded-xl object-cover border border-border/50"
        />
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="hover:bg-primary/10 hover:text-primary"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Nombre
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
        const product = row.original;
        if(product.isVariant){
             return (
          <div className="pl-10 relative text-sm text-slate-500 dark:text-slate-400">
             <span className="absolute left-2 top-[-10px] bottom-1/2 w-px bg-border/70" />
             <span className="absolute left-2 top-1/2 w-4 h-px bg-border/70" />
             <span className="font-medium">{product.variantName}</span>
                </div>
            )
        }
      return <div className="font-semibold text-slate-900 dark:text-white">{product.name}</div>;
    },
  },
   {
    accessorKey: 'code',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        SKU
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-mono text-xs text-slate-400">{row.getValue('code')}</div>,
  },
  {
    accessorKey: 'category.slug',
    id: 'category',
    header: 'Categoría',
    cell: ({ row }) => {
        const product = row.original;
        if (product.isVariant) return null;
        return <span className="capitalize text-slate-500">{product.category.name}</span>
    },
    filterFn: (row, id, value) => {
      const categorySlug = (row.original as any).category.slug;
      if (!value || (Array.isArray(value) && value.length === 0)) {
        return true;
      }
      return Array.isArray(value) && value.includes(categorySlug);
    },
  },
  {
    accessorKey: 'price',
    header: 'Precio',
    cell: ({ row }) => {
      const price = parseFloat(row.getValue('price') || 0);
      const formatted = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
      }).format(price);
      return <span>{formatted}</span>;
    },
  },
  {
    accessorKey: 'stock',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Existencia
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const stock = parseInt(row.getValue('stock') as string, 10);
      let variant: 'success' | 'warning' | 'destructive' = 'success';
      
      if (isNaN(stock) || stock <= 0) {
        variant = 'destructive';
      } else if (stock <= 10) {
        variant = 'warning';
      }

      return (
        <div className="text-center">
          <Badge variant={variant} className="w-12 justify-center">
            {isNaN(stock) ? 'N/A' : stock}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      if (row.original.isVariant) return null;
      const status = row.getValue('status') as ProductStatus;
      return (
        <Badge
          variant={getStatusVariant(status)}
          className="capitalize"
        >
          {statusLabels[status] ?? status}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: 'toggleStatus',
    header: 'Publicado',
    cell: ({ row }) => {
      const product = row.original;
       if (product.isVariant) return null;
      return <ToggleStatusCell product={product} onToggleStatus={onToggleStatus} isUpdating={updatingStatusId === product.slug} />;
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const product = row.original;
      if (product.isVariant) return null;
      const isUpdating = updatingStatusId === product.slug;

      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary" disabled={isUpdating}>
                <span className="sr-only">Abrir menú</span>
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
               <DropdownMenuItem onSelect={() => onViewDetails(product)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver Detalle
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onEdit(product)} className="flex items-center">
                <PenSquare className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onCopy(product)}>
                <Copy className="mr-2 h-4 w-4" />
                Copiar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    className="text-destructive focus:bg-destructive/90 focus:text-destructive-foreground"
                    onSelect={(e) => e.preventDefault()}
                  >
                    Eliminar
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      ¿Estás seguro de que quieres eliminar este producto?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. El producto{' '}
                      <span className="font-medium">{product.name}</span>{' '}
                      será marcado como eliminado y ocultado de la vista pública.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive hover:bg-destructive/90"
                      onClick={() => onDelete(product.slug)}
                    >
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
