
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
import { OccasionPreview, OccasionPreviewSkeleton } from './occasion-preview';


export default function OccasionsPage() {
  const { toast } = useToast();
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);
  const [updatingVisibilityId, setUpdatingVisibilityId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedOccasion, setSelectedOccasion] = useState<Occasion | null>(null);
  const [previewOccasion, setPreviewOccasion] = useState<Occasion | null>(null);
  const [focusedRowId, setFocusedRowId] = useState<string | null>(null);

  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const loadOccasions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/occasions');
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Error al cargar ocasiones');
      setOccasions(json.data ?? []);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadOccasions();
  }, [loadOccasions]);

  useEffect(() => {
    if (!occasions.length) {
      setPreviewOccasion(null);
      setFocusedRowId(null);
      return;
    }

    setPreviewOccasion((prev) => {
      if (!prev) return occasions[0];
      const match = occasions.find((occasion) => occasion.id === prev.id);
      return match ?? occasions[0];
    });
  }, [occasions]);

  useEffect(() => {
    if (!previewOccasion) return;
    const rowId = `occasion-${previewOccasion.id}`;
    if (focusedRowId !== rowId) {
      setFocusedRowId(rowId);
    }
  }, [previewOccasion, focusedRowId]);

  const handleAdd = () => {
    setSelectedOccasion(null);
    setIsFormOpen(true);
  };

  const handleEdit = useCallback((occasion: Occasion) => {
    setSelectedOccasion(occasion);
    setIsFormOpen(true);
  }, []);

  const handleRowPreview = useCallback((occasion: Occasion) => {
    setPreviewOccasion(occasion);
    setFocusedRowId(`occasion-${occasion.id}`);
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    setIsDeletingId(id);
    try {
      const res = await fetch(`/api/admin/occasions/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Error al eliminar');
      toast({ title: '¡Ocasión Eliminada!', description: 'La ocasión se ha eliminado correctamente.', variant: 'success' });
      await loadOccasions();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsDeletingId(null);
    }
  }, [loadOccasions, toast]);

  const handleSave = async (data: any, imageFile: File | null, id?: number) => {
    setIsSaving(true);
    const isEditing = !!id;
    try {
      const fd = new FormData();
      fd.append('occasionData', JSON.stringify({
        name: data.name,
        description: data.description ?? '',
        showOnHome: (data as any).show_on_home ?? data.showOnHome ?? false,
      }));
      if (imageFile) fd.append('image', imageFile);

      const url = isEditing ? `/api/admin/occasions/${id}` : '/api/admin/occasions';
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Error al guardar');
      toast({ title: isEditing ? '¡Ocasión Actualizada!' : '¡Ocasión Creada!', description: 'La ocasión ha sido guardada.', variant: 'success' });
      setIsFormOpen(false);
      await loadOccasions();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleShowOnHome = useCallback(async (occasion: Occasion) => {
    setUpdatingVisibilityId(occasion.id);
    try {
      const fd = new FormData();
      fd.append('occasionData', JSON.stringify({ showOnHome: !occasion.showOnHome }));
      const res = await fetch(`/api/admin/occasions/${occasion.id}`, { method: 'PUT', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Error al actualizar');
      toast({
        title: 'Visibilidad Actualizada',
        description: `La ocasión "${occasion.name}" ahora ${!occasion.showOnHome ? 'se mostrará' : 'no se mostrará'} en la página de inicio.`,
        variant: 'success'
      });
      await loadOccasions();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setUpdatingVisibilityId(null);
    }
  }, [loadOccasions, toast]);

  const tableColumns = useMemo(() => columns({ onEdit: handleEdit, onDelete: handleDelete, onToggleShowOnHome: handleToggleShowOnHome, isDeletingId, updatingVisibilityId }), [handleEdit, handleDelete, handleToggleShowOnHome, isDeletingId, updatingVisibilityId]);

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
    getRowId: (row) => `occasion-${row.id}`,
  });

  if (isLoading) {
    return (
      <div className="flex-1 space-y-8 p-6 md:p-10 pt-6">
        <div className="flex items-center justify-between">
            <h2 className="text-4xl font-bold font-headline tracking-tight text-slate-900 dark:text-white">Ocasiones Especiales</h2>
            <Button disabled className="rounded-2xl h-11 px-6 font-bold shadow-lg shadow-primary/20"><PlusCircle className="mr-2 h-4 w-4" />Crear Ocasión</Button>
        </div>
        <div className="flex flex-col xl:flex-row gap-6 min-h-[calc(100vh-230px)]">
          <div className="flex-1 min-w-0"><DataTableSkeleton columnCount={6} className="h-full" /></div>
          <div className="hidden xl:block w-px bg-border/40" />
          <aside className="w-full xl:w-[32%]"><OccasionPreviewSkeleton /></aside>
        </div>
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
      <div className="flex flex-col xl:flex-row gap-6 min-h-[calc(100vh-230px)]">
        <div className="flex-1 min-w-0">
          <DataTable
            table={table}
            columns={tableColumns}
            data={occasions}
            isLoading={isLoading}
            onRowClick={handleRowPreview}
            selectedRowId={focusedRowId}
            className="h-full"
          />
        </div>
        <div className="hidden xl:block w-px bg-border/40" />
        <aside className="w-full xl:w-[32%]">
          <OccasionPreview
            occasion={previewOccasion}
            onEdit={handleEdit}
            onToggleShowOnHome={handleToggleShowOnHome}
            onDelete={(occasion) => handleDelete(occasion.id)}
            isToggling={previewOccasion ? updatingVisibilityId === previewOccasion.id : false}
            isDeleting={previewOccasion ? isDeletingId === previewOccasion.id : false}
          />
        </aside>
      </div>
    </div>
  );
}
