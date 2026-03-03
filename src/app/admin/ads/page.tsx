
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
import { AdPreview } from './ad-preview';
import type { Announcement } from '@/lib/definitions';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

const toAnnouncementApiPayload = (payload: any) => ({
  title: payload.title,
  description: payload.description ?? null,
  button_text: payload.button_text ?? payload.buttonText ?? null,
  button_link: payload.button_link ?? payload.buttonLink ?? null,
  is_active: payload.is_active ?? payload.isActive ?? true,
  start_at: payload.start_at ?? payload.startAt ?? null,
  end_at: payload.end_at ?? payload.endAt ?? null,
  sort_order: payload.sort_order ?? payload.sortOrder ?? 0,
});

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
      fd.append('announcementData', JSON.stringify(
        toAnnouncementApiPayload({
          ...ad,
          isActive: !ad.isActive,
        })
      ));
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
      fd.append('announcementData', JSON.stringify(toAnnouncementApiPayload(data)));
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

  const previewAd = selectedAd ?? announcements[0] ?? null;

  if (isLoading && announcements.length === 0) {
    return (
      <div className="flex-1 space-y-8 p-6 md:p-10 pt-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
          <h2 className="text-4xl font-bold font-headline tracking-tight text-slate-900 dark:text-white">Anuncios</h2>
          <Button disabled className="rounded-2xl h-11 px-6 font-bold shadow-lg shadow-primary/20"><PlusCircle className="mr-2 h-4 w-4" />Crear Anuncio</Button>
        </div>
        <div className="grid gap-8 xl:grid-cols-[minmax(0,0.68fr)_minmax(360px,1fr)] 2xl:grid-cols-[minmax(0,0.62fr)_minmax(460px,1fr)]">
          <div className="min-w-0 xl:max-w-4xl">
            <DataTableSkeleton columnCount={6} />
          </div>
          <div className="xl:sticky xl:top-24">
            <div className="rounded-[32px] border border-border/60 bg-gradient-to-b from-background/95 via-background/80 to-muted/30 p-6 shadow-2xl">
              <div className="flex flex-wrap items-center gap-3 pb-4">
                <Skeleton className="h-8 w-40 rounded-full" />
                <Skeleton className="ml-auto h-8 w-32 rounded-full" />
              </div>
              <div className="space-y-8">
                <div className="rounded-[32px] border border-border/40 bg-muted/10 p-5 shadow-inner space-y-4">
                  <Skeleton className="h-3 w-32 rounded-full" />
                  <Skeleton className="h-64 w-full rounded-[26px]" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="rounded-[28px] border border-border/40 bg-background/90 p-4">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="mt-3 h-6 w-32" />
                      <Skeleton className="mt-1 h-4 w-24" />
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  <Skeleton className="h-3 w-36" />
                  <div className="rounded-[36px] border border-border/50 bg-gradient-to-br from-primary/10 via-background to-background p-6 shadow-inner space-y-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-8 w-28 rounded-full" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {[1, 2, 3].map((item) => (
                        <div key={item} className="rounded-2xl border border-border/50 bg-background/80 p-3 space-y-2">
                          <Skeleton className="h-3 w-24" />
                          <Skeleton className="h-5 w-28" />
                        </div>
                      ))}
                    </div>
                    <Skeleton className="h-9 w-40 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
      <AdForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSave}
        ad={selectedAd}
        isSaving={isSaving}
      />
      <div className="grid gap-8 xl:grid-cols-[minmax(0,0.68fr)_minmax(360px,1fr)] 2xl:grid-cols-[minmax(0,0.62fr)_minmax(460px,1fr)]">
        <div className="min-w-0 xl:max-w-4xl">
          <DataTable
            table={table}
            columns={tableColumns}
            data={announcements}
            isLoading={isLoading}
            toolbar={
              <Input
                placeholder="Filtrar por título..."
                value={(table.getColumn('title')?.getFilterValue() as string) ?? ''}
                onChange={(event) => table.getColumn('title')?.setFilterValue(event.target.value)}
                className="h-10 rounded-xl w-full md:w-[300px] border-none bg-background shadow-sm"
              />
            }
          />
        </div>
        <div className="xl:sticky xl:top-24">
          <AdPreview ad={previewAd} onEdit={handleEdit} />
        </div>
      </div>
    </div>
  );
}
