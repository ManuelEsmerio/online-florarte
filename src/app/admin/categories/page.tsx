
'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, SlidersHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table/data-table';
import { useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel, getFilteredRowModel, RowSelectionState, PaginationState, SortingState, ColumnFiltersState } from '@tanstack/react-table';
import { DataTableSkeleton } from '@/components/ui/data-table/data-table-skeleton';
import { columns } from './columns';
import { CategoryForm } from './category-form';
import { CategoryPreview, CategoryPreviewSkeleton } from './category-preview';
import type { ProductCategory } from '@/lib/definitions';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';


const CategoryToolbar = ({ table }: { table: any }) => {
  const parentCategories = useMemo(() => {
    const allCats = (table.options.data || []) as ProductCategory[];
    return allCats.filter((c: ProductCategory) => !c.parentId);
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
            {parentCategories.map((cat: ProductCategory) => (
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
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);
  const [updatingVisibilityId, setUpdatingVisibilityId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [previewCategory, setPreviewCategory] = useState<ProductCategory | null>(null);
  const [focusedRowId, setFocusedRowId] = useState<string | null>(null);

  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/categories');
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Error al cargar categorías');
      setCategories(json.data ?? []);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const sortedCategories = useMemo(() => {
    if (!categories?.length) return [];

    const groups: Record<number, ProductCategory[]> = {};
    const roots: ProductCategory[] = [];

    for (const cat of categories) {
      if (cat.parentId) {
        if (!groups[cat.parentId]) groups[cat.parentId] = [];
        groups[cat.parentId].push(cat);
      } else {
        roots.push(cat);
      }
    }

    const sortByName = (a: ProductCategory, b: ProductCategory) =>
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });

    roots.sort(sortByName);
    for (const key in groups) groups[key].sort(sortByName);

    const out: ProductCategory[] = [];
    for (const rootCat of roots) {
      out.push(rootCat);
      out.push(...(groups[rootCat.id] || []));
    }

    return out;
  }, [categories]);

  useEffect(() => {
    if (!sortedCategories.length) {
      setPreviewCategory(null);
      setFocusedRowId(null);
      return;
    }

    setPreviewCategory((prev) => {
      if (!prev) return sortedCategories[0];
      const match = sortedCategories.find((cat) => cat.id === prev.id);
      return match ?? sortedCategories[0];
    });
  }, [sortedCategories]);

  useEffect(() => {
    if (!previewCategory) return;
    const rowId = `category-${previewCategory.id}`;
    if (focusedRowId !== rowId) {
      setFocusedRowId(rowId);
    }
  }, [previewCategory, focusedRowId]);

  const handleAdd = () => {
    setSelectedCategory(null);
    setIsFormOpen(true);
  };

  const handleEdit = (category: ProductCategory) => {
    setSelectedCategory(category);
    setIsFormOpen(true);
  };

  const handleRowPreview = useCallback((category: ProductCategory) => {
    setPreviewCategory(category);
    setFocusedRowId(`category-${category.id}`);
  }, []);

  const handleDelete = async (id: number) => {
    setIsDeletingId(id);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Error al eliminar');
      toast({ title: '¡Categoría Eliminada!', description: 'La categoría se ha eliminado correctamente.', variant: 'success' });
      await loadCategories();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleSave = async (data: any, imageFile: File | null, id?: number) => {
    setIsSaving(true);
    const isEditing = !!id;
    try {
      const fd = new FormData();
      fd.append('categoryData', JSON.stringify({
        name: data.name,
        description: data.description ?? '',
        parentId: data.parent_id ?? null,
        showOnHome: data.show_on_home ?? false,
      }));
      if (imageFile) fd.append('image', imageFile);

      const url = isEditing ? `/api/admin/categories/${id}` : '/api/admin/categories';
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Error al guardar');
      toast({ title: isEditing ? '¡Categoría Actualizada!' : '¡Categoría Creada!', description: 'La categoría ha sido guardada.', variant: 'success' });
      setIsFormOpen(false);
      await loadCategories();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleShowOnHome = useCallback(async (category: ProductCategory) => {
    setUpdatingVisibilityId(category.id);
    try {
      const res = await fetch(`/api/admin/categories/${category.id}/toggle-visibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showOnHome: !category.showOnHome }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Error al actualizar');
      toast({
        title: 'Visibilidad Actualizada',
        description: `La categoría "${category.name}" ahora ${!category.showOnHome ? 'se mostrará' : 'no se mostrará'} en la página de inicio.`,
        variant: 'success'
      });
      await loadCategories();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setUpdatingVisibilityId(null);
    }
  }, [loadCategories, toast]);

  const tableColumns = useMemo(
    () => columns({
        onEdit: handleEdit,
        onDelete: handleDelete,
        onToggleShowOnHome: handleToggleShowOnHome,
        allCategories: categories,
        isDeletingId,
        updatingVisibilityId
    }),
    [categories, isDeletingId, handleToggleShowOnHome, updatingVisibilityId]
  );

  const previewParentName = useMemo(() => {
    if (!previewCategory?.parentId) return undefined;
    const parent = categories.find((cat) => cat.id === previewCategory.parentId);
    return parent?.name;
  }, [previewCategory, categories]);

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
    getRowId: (row) => `category-${row.id}`,
  });

  if (isLoading) {
    return (
      <div className="flex-1 space-y-8 p-6 md:p-10 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-4xl font-bold font-headline tracking-tight text-slate-900 dark:text-white">Categorías</h2>
          <Button disabled className="rounded-2xl h-11 px-6 font-bold shadow-lg shadow-primary/20"><PlusCircle className="mr-2 h-4 w-4" />Crear Categoría</Button>
        </div>
        <div className="flex flex-col xl:flex-row gap-6 min-h-[calc(100vh-230px)]">
          <div className="flex-1 min-w-0"><DataTableSkeleton columnCount={7} className="h-full" /></div>
          <div className="hidden xl:block w-px bg-border/40" />
          <aside className="w-full xl:w-[32%]"><CategoryPreviewSkeleton /></aside>
        </div>
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
      <div className="flex flex-col xl:flex-row gap-6 min-h-[calc(100vh-230px)]">
        <div className="flex-1 min-w-0">
          <DataTable
            table={table}
            columns={tableColumns}
            data={sortedCategories}
            isLoading={isLoading}
            toolbar={<CategoryToolbar table={table} />}
            onRowClick={handleRowPreview}
            selectedRowId={focusedRowId}
            className="h-full"
          />
        </div>
        <div className="hidden xl:block w-px bg-border/40" />
        <aside className="w-full xl:w-[32%]">
          <CategoryPreview
            category={previewCategory}
            onEdit={handleEdit}
            onToggleShowOnHome={handleToggleShowOnHome}
            onDelete={(category) => handleDelete(category.id)}
            isToggling={previewCategory ? updatingVisibilityId === previewCategory.id : false}
            isDeleting={previewCategory ? isDeletingId === previewCategory.id : false}
            parentName={previewParentName}
          />
        </aside>
      </div>
    </div>
  );
}
