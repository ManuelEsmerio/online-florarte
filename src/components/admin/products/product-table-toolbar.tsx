
// src/components/admin/products/product-table-toolbar.tsx
import React from 'react';
import { Table } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { SlidersHorizontal, ChevronDown, CheckCircle, EyeOff, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import type { ProductStatus } from "@/lib/definitions"
import type { ProductCategory } from "@/lib/definitions"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


interface ProductTableToolbarProps<TData> {
  table: Table<TData>
  categories: ProductCategory[]
  onBulkAction: (action: 'publish' | 'hide' | 'delete') => void;
  isDeleting: boolean;
}

const statusTranslations: Record<ProductStatus, string> = {
    PUBLISHED: "Publicado",
    HIDDEN: "Oculto",
    DRAFT: "Borrador"
}

export function ProductTableToolbar<TData>({
  table,
  categories,
  onBulkAction,
  isDeleting
}: ProductTableToolbarProps<TData>) {
  
  const selectedCategorySlugs = (table.getColumn("category")?.getFilterValue() as string[]) ?? [];
  const selectedRowsCount = table.getFilteredSelectedRowModel().rows.length;

  const mainCategories = categories.filter(c => !c.parentId);

  const handleCategoryFilterChange = (category: ProductCategory) => {
    const isParent = !category.parentId;
    const childrenSlugs = isParent ? categories.filter(c => c.parentId === category.id).map(c => c.slug) : [];

    let newFilter = [...selectedCategorySlugs];
    const isSelected = newFilter.includes(category.slug);

    if (isSelected) {
      // Deselect
      newFilter = newFilter.filter(s => s !== category.slug);
      if (isParent) {
        newFilter = newFilter.filter(s => !childrenSlugs.includes(s));
      }
    } else {
      // Select
      newFilter.push(category.slug);
      if (isParent) {
        newFilter.push(...childrenSlugs);
      }
    }
    
    table.getColumn("category")?.setFilterValue([...new Set(newFilter)]);
  };
  
  const handleStatusFilterChange = (status: ProductStatus) => {
    const currentFilter = (table.getColumn("status")?.getFilterValue() as string[]) ?? [];
    const newFilter = currentFilter.includes(status)
      ? currentFilter.filter(s => s !== status)
      : [...currentFilter, status];
    
    table.getColumn("status")?.setFilterValue(newFilter.length > 0 ? newFilter : undefined);
  }

  const selectedStatuses = (table.getColumn("status")?.getFilterValue() as string[]) ?? [];

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex flex-col md:flex-row flex-1 items-center space-y-2 md:space-y-0 md:space-x-2 w-full">
        <Input
          placeholder="Filtrar por nombre o código..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
          className="h-8 w-full md:w-[250px]"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-full md:w-auto px-3 bg-background border-none shadow-sm text-muted-foreground hover:text-primary hover:bg-primary/5 active:bg-primary/10 transition-all flex items-center gap-2 font-medium">
              <SlidersHorizontal className="h-4 w-4" />
              Categoría
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
            <DropdownMenuLabel>Filtrar por categoría</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {mainCategories.map((category, index) => {
                const children = categories.filter(c => c.parentId === category.id);
                const allChildrenSelected = children.length > 0 && children.every(c => selectedCategorySlugs.includes(c.slug));
                return (
                    <React.Fragment key={category.id}>
                        <DropdownMenuCheckboxItem
                            className="capitalize font-semibold"
                            checked={selectedCategorySlugs.includes(category.slug) || allChildrenSelected}
                            onCheckedChange={() => handleCategoryFilterChange(category)}
                        >
                            {category.name}
                        </DropdownMenuCheckboxItem>
                        {children.map(child => (
                           <DropdownMenuCheckboxItem
                                key={child.id}
                                className="capitalize pl-8"
                                checked={selectedCategorySlugs.includes(child.slug)}
                                onCheckedChange={() => handleCategoryFilterChange(child)}
                            >
                                {child.name}
                            </DropdownMenuCheckboxItem> 
                        ))}
                        {index < mainCategories.length - 1 && <DropdownMenuSeparator />}
                    </React.Fragment>
                )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-full md:w-auto px-3 bg-background border-none shadow-sm text-muted-foreground hover:text-primary hover:bg-primary/5 active:bg-primary/10 transition-all flex items-center gap-2 font-medium">
              <SlidersHorizontal className="h-4 w-4" />
              Estado
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Filtrar por estado</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {Object.keys(statusTranslations).map((status) => (
                <DropdownMenuCheckboxItem
                    key={status}
                    className="capitalize"
                    checked={selectedStatuses.includes(status)}
                    onCheckedChange={() => handleStatusFilterChange(status as ProductStatus)}
                >
                    {statusTranslations[status as ProductStatus]}
                </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
         {selectedRowsCount > 0 && (
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 px-3 bg-background border-none shadow-sm text-primary hover:bg-primary/5 active:bg-primary/10 transition-all flex items-center gap-2 font-bold">
                Acciones en lote ({selectedRowsCount})
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Modificar estado</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => onBulkAction('publish')}>
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                Publicar seleccionados
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onBulkAction('hide')}>
                <EyeOff className="mr-2 h-4 w-4 text-orange-500" />
                Ocultar seleccionados
              </DropdownMenuItem>
              <DropdownMenuSeparator />
               <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                    <Trash2 className="mr-2 h-4 w-4" />
                     Eliminar seleccionados
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción marcará {selectedRowsCount} productos como eliminados. No serán visibles en la tienda.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive hover:bg-destructive/90"
                      onClick={() => onBulkAction('delete')}
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Eliminando..." : "Sí, eliminar"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}
