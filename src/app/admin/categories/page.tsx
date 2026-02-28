
'use client';

import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, SlidersHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table/data-table';
import { useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel, getFilteredRowModel, RowSelectionState, PaginationState, SortingState, ColumnFiltersState } from '@tanstack/react-table';
import { DataTableSkeleton } from '@/components/ui/data-table/data-table-skeleton';
import { columns } from './columns';
import { CategoryForm } from './category-form';
import type { ProductCategory } from '@/lib/definitions';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useProductContext } from '@/context/ProductContext';
import { productCategories } from '@/lib/data/categories-data';


const CategoryToolbar = ({ table }: { table: any }) => {
  const parentCategories = useMemo(() => {
    const allCats = (table.options.data || []) as ProductCategory[];
    return allCats.filter(c => !c.parentId);
  }, [table.options.data]);

  const selectedParent = table.getColumn('parentId')?.getFilterValue() as string || 'all';

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex flex-col md:flex-row flex-1 items-center space-y-2 md:space-y-0 md:space-x-2 w-full">
        <Input
          placeholder="Filtrar por nombre..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="h-10 rounded-xl w-full md:w-[300px] border-none bg-background shadow-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-10 w-full md:w-auto px-4 bg-background border-none shadow-sm text-muted-foreground hover:text-primary hover:bg-primary/5 active:bg-primary/10 transition-all flex items-center gap-2 font-bold rounded-xl">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Categoría Padre
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-2xl p-2 border-none shadow-2xl max-h-80 overflow-y-auto">
            <DropdownMenuLabel className="text-[10px] uppercase tracking-widest font-bold px-3 py-2">Filtrar por Padre</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-muted/50" />
            <DropdownMenuCheckboxItem
              checked={selectedParent === 'all'}
              onCheckedChange={() => table.getColumn("parentId")?.setFilterValue('all')}
              className="rounded-xl my-1"
            >
              Todas
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={selectedParent === 'main'}
              onCheckedChange={() => table.getColumn("parentId")?.setFilterValue('main')}
              className="rounded-xl my-1"
            >
              Solo Principales
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator className="bg-muted/50" />
            {parentCategories.map(cat => (
              <DropdownMenuCheckboxItem
                key={cat.id}
                checked={selectedParent === String(cat.id)}
                onCheckedChange={() => table.getColumn("parentId")?.setFilterValue(String(cat.id))}
                className="rounded-xl my-1"
              >
                Hijas de "{cat.name}"
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}


export default function CategoriesPage() {
  const { toast } = useToast();
  const { categories, isLoading, fetchAppData } = useProductContext();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);
  const [updatingVisibilityId, setUpdatingVisibilityId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);

  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const sortedCategories = useMemo(() => {
    if (!categories?.length) return [];

    const groups: Record<number, ProductCategory[]> = {};
    const roots: ProductCategory[] = [];

    for (const cat of categories) {
      if (cat.parentId) {
        if (!groups[cat.parentId]) {
          groups[cat.parentId] = [];
        }
        groups[cat.parentId].push(cat);
      } else {
        roots.push(cat);
      }
    }

    const sortByName = (a: ProductCategory, b: ProductCategory) =>
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });

    roots.sort(sortByName);
    for(const key in groups) {
      groups[key].sort(sortByName);
    }

    const out: ProductCategory[] = [];
    for (const rootCat of roots) {
      out.push(rootCat);
      const children = groups[rootCat.id] || [];
      out.push(...children);
    }

    return out;
  }, [categories]);

  const handleAdd = () => {
    setSelectedCategory(null);
    setIsFormOpen(true);
  };

  const handleEdit = (category: ProductCategory) => {
    setSelectedCategory(category);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    setIsDeletingId(id);
    const idx = productCategories.findIndex(c => c.id === id);
    if (idx > -1) productCategories.splice(idx, 1);
    toast({ title: '¡Categoría Eliminada!', description: 'La categoría se ha eliminado correctamente.', variant: 'success' });
    await fetchAppData();
    setIsDeletingId(null);
  };

  const handleSave = async (data: any, imageFile: File | null, id?: number) => {
    setIsSaving(true);

    const isEditing = !!id;
    const imageUrl = imageFile
      ? URL.createObjectURL(imageFile)
      : (isEditing ? productCategories.find(c => c.id === id)?.imageUrl ?? '' : '');

    if (isEditing) {
      const idx = productCategories.findIndex(c => c.id === id);
      if (idx > -1) {
        productCategories[idx] = {
          ...productCategories[idx],
          name: data.name,
          slug: data.slug ?? productCategories[idx].slug,
          prefix: data.prefix ?? productCategories[idx].prefix,
          description: data.description ?? productCategories[idx].description,
          parentId: data.parent_id ?? null,
          showOnHome: data.show_on_home ?? productCategories[idx].showOnHome,
          imageUrl: imageUrl || productCategories[idx].imageUrl,
        };
      }
    } else {
      const newId = Math.max(...productCategories.map(c => c.id), 0) + 1;
      const slug = data.slug ?? (data.name as string).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      productCategories.push({
        id: newId,
        name: data.name,
        slug,
        prefix: data.prefix ?? '',
        description: data.description ?? '',
        parentId: data.parent_id ?? null,
        showOnHome: data.show_on_home ?? false,
        imageUrl: imageUrl,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    toast({ title: isEditing ? '¡Categoría Actualizada!' : '¡Categoría Creada!', description: 'La categoría ha sido guardada.', variant: 'success' });
    setIsFormOpen(false);
    await fetchAppData();
    setIsSaving(false);
  };

  const handleToggleShowOnHome = useCallback(async (category: ProductCategory) => {
    setUpdatingVisibilityId(category.id);
    const newShowOnHome = !category.showOnHome;
    const idx = productCategories.findIndex(c => c.id === category.id);
    if (idx > -1) productCategories[idx] = { ...productCategories[idx], showOnHome: newShowOnHome };
    toast({
      title: 'Visibilidad Actualizada',
      description: `La categoría "${category.name}" ahora ${newShowOnHome ? 'se mostrará' : 'no se mostrará'} en la página de inicio.`,
      variant: 'success'
    });
    await fetchAppData();
    setUpdatingVisibilityId(null);
  }, [fetchAppData, toast]);

  const tableColumns = useMemo(
    () => columns({
        onEdit: handleEdit,
        onDelete: handleDelete,
        onToggleShowOnHome: handleToggleShowOnHome,
        allCategories: categories,
        isDeletingId,
        updatingVisibilityId
    }),
    [handleDelete, categories, isDeletingId, handleToggleShowOnHome, updatingVisibilityId]
  );

  const table = useReactTable({
    data: sortedCategories,
    columns: tableColumns,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { pagination, sorting, rowSelection, columnFilters },
  });

  if (isLoading) {
    return (
      <div className="flex-1 space-y-8 p-6 md:p-10 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-4xl font-bold font-headline tracking-tight text-slate-900 dark:text-white">Categorías</h2>
          <Button disabled className="rounded-2xl h-11 px-6 font-bold shadow-lg shadow-primary/20"><PlusCircle className="mr-2 h-4 w-4" />Crear Categoría</Button>
        </div>
        <DataTableSkeleton columnCount={7} />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 pt-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
        <h2 className="text-4xl font-bold font-headline tracking-tight text-slate-900 dark:text-white">Categorías</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={handleAdd} className="rounded-2xl h-11 px-6 font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white transition-all transform hover:-translate-y-1">
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Categoría
          </Button>
        </div>
      </div>
      <CategoryForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSave}
        category={selectedCategory}
        allCategories={categories}
        isSaving={isSaving}
      />
      <DataTable
        table={table}
        columns={tableColumns}
        data={sortedCategories}
        isLoading={isLoading}
        toolbar={<CategoryToolbar table={table} />}
      />
    </div>
  );
}
