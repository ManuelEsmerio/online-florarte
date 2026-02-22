
// src/app/admin/ads/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table/data-table';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  PaginationState,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import { DataTableSkeleton } from '@/components/ui/data-table/data-table-skeleton';
import { columns } from './columns';
import { AdForm } from './ad-form';
import type { Announcement } from '@/lib/definitions';
import { useAuth } from '@/context/AuthContext';
import { handleApiResponse } from '@/utils/handleApiResponse';
import { Input } from '@/components/ui/input';

export default function AdsPage() {
  const { toast } = useToast();
  const { apiFetch } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<Announcement | null>(null);

  const [sorting, setSorting] = useState<SortingState>([{ id: 'sort_order', desc: false }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/admin/announcements');
      const data = await handleApiResponse(res, []);
      setAnnouncements(data);
    } catch (error: any) {
      toast({ title: 'Error al cargar anuncios', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [apiFetch, toast]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleAdd = () => {
    setSelectedAd(null);
    setIsFormOpen(true);
  };

  const handleEdit = (announcement: Announcement) => {
    setSelectedAd(announcement);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    setIsDeletingId(id);
    try {
      await handleApiResponse(await apiFetch(`/api/admin/announcements/${id}`, { method: 'DELETE' }));
      toast({ title: '¡Anuncio Eliminado!', description: 'El anuncio se ha eliminado correctamente.', variant: 'success' });
      await fetchAnnouncements();
    } catch (error: any) {
      toast({ title: 'Error al eliminar', description: error.message, variant: 'destructive' });
    } finally {
      setIsDeletingId(null);
    }
  };
  
  const handleToggleActive = async (ad: Announcement) => {
    setUpdatingStatusId(ad.id);
    const updatedAdData = { ...ad, is_active: !ad.is_active };
    try {
      const formData = new FormData();
      formData.append('announcementData', JSON.stringify(updatedAdData));
      
      const res = await apiFetch(`/api/admin/announcements/${ad.id}`, {
        method: 'POST', // Usar POST para FormData con PUT
        body: formData,
      });

      await handleApiResponse(res);
      toast({ title: 'Estado actualizado', description: `El anuncio "${ad.title}" ahora está ${updatedAdData.is_active ? 'activo' : 'inactivo'}.` });
      await fetchAnnouncements();
    } catch (error: any) {
      toast({ title: 'Error al actualizar', description: error.message, variant: 'destructive' });
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleSave = async (data: any, images: { desktop?: File, mobile?: File }) => {
    setIsSaving(true);
    const formData = new FormData();
    formData.append('announcementData', JSON.stringify(data));
    if (images.desktop) formData.append('image_desktop', images.desktop);
    if (images.mobile) formData.append('image_mobile', images.mobile);
    
    const isEditing = !!data.id;
    const url = isEditing ? `/api/admin/announcements/${data.id}` : '/api/admin/announcements';
    const method = 'POST';

    try {
      const res = await apiFetch(url, { method, body: formData });
      await handleApiResponse(res);
      toast({ title: isEditing ? '¡Anuncio Actualizado!' : '¡Anuncio Creado!', variant: 'success' });
      setIsFormOpen(false);
      await fetchAnnouncements();
    } catch (error: any) {
      toast({ title: 'Error al guardar', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const tableColumns = useMemo(
    () => columns({ onEdit: handleEdit, onDelete: handleDelete, onToggleActive: handleToggleActive, isDeletingId, updatingStatusId }),
    [isDeletingId, updatingStatusId, handleEdit, handleDelete, handleToggleActive]
  );

  const table = useReactTable({
    data: announcements,
    columns: tableColumns,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { pagination, sorting, columnFilters },
  });

  if (isLoading) {
    return (
      <div className="flex-1 space-y-8 p-6 md:p-10 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-4xl font-bold font-headline tracking-tight text-slate-900 dark:text-white">Anuncios</h2>
          <Button disabled className="rounded-2xl h-11 px-6 font-bold shadow-lg shadow-primary/20"><PlusCircle className="mr-2 h-4 w-4" />Crear Anuncio</Button>
        </div>
        <DataTableSkeleton columnCount={7} />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 pt-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
        <h2 className="text-4xl font-bold font-headline tracking-tight text-slate-900 dark:text-white">Anuncios</h2>
        <Button onClick={handleAdd} className="rounded-2xl h-11 px-6 font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white transition-all transform hover:-translate-y-1">
          <PlusCircle className="mr-2 h-4 w-4" />
          Crear Anuncio
        </Button>
      </div>
      <AdForm isOpen={isFormOpen} onOpenChange={setIsFormOpen} onSave={handleSave} ad={selectedAd} isSaving={isSaving} />
      <DataTable 
        table={table} 
        columns={tableColumns} 
        data={announcements} 
        isLoading={isLoading} 
        toolbar={
             <Input
                placeholder="Filtrar por título..."
                value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
                onChange={(event) => table.getColumn("title")?.setFilterValue(event.target.value)}
                className="h-10 rounded-xl w-full md:w-[300px] border-none bg-background shadow-sm"
            />
        }
      />
    </div>
  );
}
