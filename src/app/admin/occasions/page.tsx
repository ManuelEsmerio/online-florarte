
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
import { useAuth } from '@/context/AuthContext';
import { handleApiResponse } from '@/utils/handleApiResponse';
import { useProductContext } from '@/context/ProductContext';


export default function OccasionsPage() {
  const { toast } = useToast();
  const { apiFetch } = useAuth();
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
     try {
      const res = await apiFetch(`/api/admin/occasions/${id}`, { method: 'DELETE' });
      await handleApiResponse(res);
      toast({ title: '¡Ocasión Eliminada!', description: 'La ocasión se ha eliminado correctamente.', variant: 'success' });
      await fetchAppData();
    } catch (error: any) {
      toast({ title: 'Error al eliminar', description: error.message, variant: 'destructive' });
    } finally {
      setIsDeletingId(null);
    }
  };
  
  const handleSave = async (data: Omit<Occasion, 'id' | 'slug' | 'image_url'> & {slug?:string, image_url?: string}, imageFile: File | null, id?: number) => {
    setIsSaving(true);
    
    const formData = new FormData();
    formData.append('occasionData', JSON.stringify(data));
    if (imageFile) {
        formData.append('image', imageFile);
    }
    
    const isEditing = !!id;
    const url = isEditing ? `/api/admin/occasions/${id}` : '/api/admin/occasions';
    const method = isEditing ? 'PUT' : 'POST';
    
    try {
        const res = await apiFetch(url, { 
            method,
            body: formData 
        });
        await handleApiResponse(res);
        toast({ title: isEditing ? '¡Ocasión Actualizada!' : '¡Ocasión Creada!', description: 'La ocasión ha sido guardada.', variant: 'success'});
        setIsFormOpen(false);
        await fetchAppData();
    } catch (error: any) {
        toast({ title: 'Error al guardar', description: error.message, variant: 'destructive' });
    } finally {
        setIsSaving(false);
    }
  };

  const handleToggleShowOnHome = useCallback(async (occasion: Occasion) => {
    setUpdatingVisibilityId(occasion.id);
    const updatedData = { ...occasion, show_on_home: !occasion.show_on_home };
    
    const formData = new FormData();
    formData.append('occasionData', JSON.stringify(updatedData));

    try {
      const res = await apiFetch(`/api/admin/occasions/${occasion.id}`, {
        method: 'PUT',
        body: formData,
      });
      await handleApiResponse(res);
      toast({
        title: 'Visibilidad Actualizada',
        description: `La ocasión "${occasion.name}" ahora ${updatedData.show_on_home ? 'se mostrará' : 'no se mostrará'} en la página de inicio.`,
        variant: 'success'
      });
      await fetchAppData();
    } catch (error: any) {
      toast({ title: 'Error al actualizar', description: error.message, variant: 'destructive' });
    } finally {
      setUpdatingVisibilityId(null);
    }
  }, [apiFetch, fetchAppData, toast]);

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
