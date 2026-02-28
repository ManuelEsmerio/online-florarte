
// src/app/admin/ads/page.tsx
'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';

export default function AdsPage() {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<Announcement | null>(null);

  const [sorting, setSorting] = useState<SortingState>([{ id: 'sortOrder', desc: false }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const loadAds = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/announcements');
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Error al cargar anuncios');
      setAnnouncements(json.data ?? []);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const res = await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Error al eliminar');
      toast({ title: '¡Anuncio Eliminado!', description: 'El anuncio se ha eliminado correctamente.', variant: 'success' });
      await loadAds();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleToggleActive = useCallback(async (ad: Announcement) => {
    setUpdatingStatusId(ad.id);
    try {
      const fd = new FormData();
      fd.append('announcementData', JSON.stringify({
        title: ad.title,
        description: ad.description,
        buttonText: ad.buttonText,
        buttonLink: ad.buttonLink,
        isActive: !ad.isActive,
        startAt: ad.startAt,
        endAt: ad.endAt,
        sortOrder: ad.sortOrder,
      }));
      const res = await fetch(`/api/admin/announcements/${ad.id}`, { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Error al actualizar');
      toast({ title: 'Estado actualizado', description: `El anuncio "${ad.title}" ahora está ${!ad.isActive ? 'activo' : 'inactivo'}.` });
      await loadAds();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setUpdatingStatusId(null);
    }
  }, [loadAds, toast]);

  const handleSave = async (data: any, images: { desktop?: File, mobile?: File }) => {
    setIsSaving(true);
    const isEditing = !!data.id;
    try {
      const fd = new FormData();
      fd.append('announcementData', JSON.stringify({
        title: data.title,
        description: data.description ?? null,
        buttonText: data.button_text ?? data.buttonText ?? null,
        buttonLink: data.button_link ?? data.buttonLink ?? null,
        isActive: data.is_active ?? data.isActive ?? true,
        startAt: data.start_at ?? data.startAt ?? null,
        endAt: data.end_at ?? data.endAt ?? null,
        sortOrder: data.sort_order ?? data.sortOrder ?? null,
      }));
      if (images.desktop) fd.append('image_desktop', images.desktop);
      if (images.mobile) fd.append('image_mobile', images.mobile);

      const url = isEditing ? `/api/admin/announcements/${data.id}` : '/api/admin/announcements';
      // Update uses POST (FormData with PUT not compatible in Next.js App Router)
      const method = isEditing ? 'POST' : 'POST';
      const res = await fetch(url, { method, body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Error al guardar');
      toast({ title: isEditing ? '¡Anuncio Actualizado!' : '¡Anuncio Creado!', variant: 'success' });
      setIsFormOpen(false);
      await loadAds();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const tableColumns = useMemo(
    () => columns({ onEdit: handleEdit, onDelete: handleDelete, onToggleActive: handleToggleActive, isDeletingId, updatingStatusId }),
    [isDeletingId, updatingStatusId, handleToggleActive]
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

  if (isLoading && announcements.length === 0) {
    return (
      <div className="flex-1 space-y-8 p-6 md:p-10 pt-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
          <h2 className="text-4xl font-bold font-headline tracking-tight text-slate-900 dark:text-white">Anuncios</h2>
          <Button disabled className="rounded-2xl h-11 px-6 font-bold shadow-lg shadow-primary/20"><PlusCircle className="mr-2 h-4 w-4" />Crear Anuncio</Button>
        </div>
        <DataTableSkeleton columnCount={6} />
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
