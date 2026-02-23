
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table/data-table';
import { useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel, RowSelectionState, PaginationState, SortingState } from '@tanstack/react-table';
import { DataTableSkeleton } from '@/components/ui/data-table/data-table-skeleton';
import { Occasion } from '@/lib/definitions';
import { columns } from './columns';
import { OccasionForm } from './occasion-form';
import { useProductContext } from '@/context/ProductContext';
import { allOccasions } from '@/lib/data/occasion-data';


export default function OccasionsPage() {
  const { toast } = useToast();
  const { occasions, fetchAppData, isLoading: isContextLoading } = useProductContext();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);
  const [updatingVisibilityId, setUpdatingVisibilityId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedOccasion, setSelectedOccasion] = useState<Occasion | null>(null);

  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  useEffect(() => {
    setIsLoading(isContextLoading);
  }, [isContextLoading]);


  const handleAdd = () => {
    setSelectedOccasion(null);
    setIsFormOpen(true);
  };

  const handleEdit = (occasion: Occasion) => {
    setSelectedOccasion(occasion);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    setIsDeletingId(id);
    const idx = allOccasions.findIndex(o => o.id === id);
    if (idx > -1) allOccasions.splice(idx, 1);
    toast({ title: '¡Ocasión Eliminada!', description: 'La ocasión se ha eliminado correctamente.', variant: 'success' });
    await fetchAppData();
    setIsDeletingId(null);
  };

  const handleSave = async (data: Omit<Occasion, 'id' | 'slug' | 'image_url'> & { slug?: string, image_url?: string }, imageFile: File | null, id?: number) => {
    setIsSaving(true);

    const isEditing = !!id;
    const imageUrl = imageFile
      ? URL.createObjectURL(imageFile)
      : (isEditing ? allOccasions.find(o => o.id === id)?.image_url ?? '' : '');

    if (isEditing) {
      const idx = allOccasions.findIndex(o => o.id === id);
      if (idx > -1) {
        allOccasions[idx] = {
          ...allOccasions[idx],
          name: data.name,
          slug: data.slug ?? allOccasions[idx].slug,
          description: data.description ?? allOccasions[idx].description,
          show_on_home: data.show_on_home ?? allOccasions[idx].show_on_home,
          image_url: imageUrl || allOccasions[idx].image_url,
        };
      }
    } else {
      const newId = Math.max(...allOccasions.map(o => o.id), 0) + 1;
      const slug = data.slug ?? (data.name as string).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      allOccasions.push({
        id: newId,
        name: data.name,
        slug,
        description: data.description ?? '',
        show_on_home: data.show_on_home ?? false,
        image_url: imageUrl,
      });
    }

    toast({ title: isEditing ? '¡Ocasión Actualizada!' : '¡Ocasión Creada!', description: 'La ocasión ha sido guardada.', variant: 'success' });
    setIsFormOpen(false);
    await fetchAppData();
    setIsSaving(false);
  };

  const handleToggleShowOnHome = useCallback(async (occasion: Occasion) => {
    setUpdatingVisibilityId(occasion.id);
    const newShowOnHome = !occasion.show_on_home;
    const idx = allOccasions.findIndex(o => o.id === occasion.id);
    if (idx > -1) allOccasions[idx] = { ...allOccasions[idx], show_on_home: newShowOnHome };
    toast({
      title: 'Visibilidad Actualizada',
      description: `La ocasión "${occasion.name}" ahora ${newShowOnHome ? 'se mostrará' : 'no se mostrará'} en la página de inicio.`,
      variant: 'success'
    });
    await fetchAppData();
    setUpdatingVisibilityId(null);
  }, [fetchAppData, toast]);

  const tableColumns = useMemo(() => columns({ onEdit: handleEdit, onDelete: handleDelete, onToggleShowOnHome: handleToggleShowOnHome, isDeletingId, updatingVisibilityId }), [handleEdit, handleDelete, isDeletingId, handleToggleShowOnHome, updatingVisibilityId]);

  const table = useReactTable({
    data: occasions,
    columns: tableColumns,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { pagination, sorting, rowSelection },
  });

  if (isLoading) {
    return (
      <div className="flex-1 space-y-8 p-6 md:p-10 pt-6">
        <div className="flex items-center justify-between">
            <h2 className="text-4xl font-bold font-headline tracking-tight text-slate-900 dark:text-white">Ocasiones Especiales</h2>
            <Button disabled className="rounded-2xl h-11 px-6 font-bold shadow-lg shadow-primary/20"><PlusCircle className="mr-2 h-4 w-4" />Crear Ocasión</Button>
        </div>
        <DataTableSkeleton columnCount={4} />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 pt-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
        <h2 className="text-4xl font-bold font-headline tracking-tight text-slate-900 dark:text-white">Ocasiones Especiales</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={handleAdd} className="rounded-2xl h-11 px-6 font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white transition-all transform hover:-translate-y-1">
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Ocasión
          </Button>
        </div>
      </div>
      <OccasionForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSave}
        occasion={selectedOccasion}
        isSaving={isSaving}
      />
      <DataTable table={table} columns={tableColumns} data={occasions} isLoading={isLoading} />
    </div>
  );
}
