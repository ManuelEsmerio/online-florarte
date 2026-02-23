
// src/app/admin/ads/page.tsx
'use client';

import { useState, useCallback, useMemo } from 'react';
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
import { columns } from './columns';
import { AdForm } from './ad-form';
import type { Announcement } from '@/lib/definitions';
import { Input } from '@/components/ui/input';
import { announcementsData } from '@/lib/data/announcement-data';

export default function AdsPage() {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => [...announcementsData]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<Announcement | null>(null);

  const [sorting, setSorting] = useState<SortingState>([{ id: 'sort_order', desc: false }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const handleAdd = () => {
    setSelectedAd(null);
    setIsFormOpen(true);
  };

  const handleEdit = (announcement: Announcement) => {
    setSelectedAd(announcement);
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    setIsDeletingId(id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    const idx = announcementsData.findIndex(a => a.id === id);
    if (idx > -1) announcementsData.splice(idx, 1);
    toast({ title: '¡Anuncio Eliminado!', description: 'El anuncio se ha eliminado correctamente.', variant: 'success' });
    setIsDeletingId(null);
  };

  const handleToggleActive = (ad: Announcement) => {
    setUpdatingStatusId(ad.id);
    const updated = { ...ad, is_active: !ad.is_active };
    setAnnouncements(prev => prev.map(a => a.id === ad.id ? updated : a));
    const idx = announcementsData.findIndex(a => a.id === ad.id);
    if (idx > -1) announcementsData[idx] = updated;
    toast({ title: 'Estado actualizado', description: `El anuncio "${ad.title}" ahora está ${updated.is_active ? 'activo' : 'inactivo'}.` });
    setUpdatingStatusId(null);
  };

  const handleSave = async (data: any, images: { desktop?: File, mobile?: File }) => {
    setIsSaving(true);
    const isEditing = !!data.id;

    // Para imágenes, generar URL de objeto temporal si hay archivos
    const imageUrl = images.desktop
      ? URL.createObjectURL(images.desktop)
      : data.image_url || '';
    const imageMobileUrl = images.mobile
      ? URL.createObjectURL(images.mobile)
      : data.image_mobile_url || null;

    if (isEditing) {
      const updated: Announcement = {
        ...data,
        image_url: imageUrl,
        image_mobile_url: imageMobileUrl,
        updated_at: new Date().toISOString(),
      };
      setAnnouncements(prev => prev.map(a => a.id === data.id ? updated : a));
      const idx = announcementsData.findIndex(a => a.id === data.id);
      if (idx > -1) announcementsData[idx] = updated;
    } else {
      const newId = Math.max(...announcements.map(a => a.id), 0) + 1;
      const newAd: Announcement = {
        id: newId,
        title: data.title,
        description: data.description || null,
        button_text: data.button_text || null,
        button_link: data.button_link || null,
        image_url: imageUrl,
        image_mobile_url: imageMobileUrl,
        is_active: data.is_active ?? true,
        start_at: data.start_at || null,
        end_at: data.end_at || null,
        sort_order: data.sort_order ?? (announcements.length + 1),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setAnnouncements(prev => [...prev, newAd]);
      announcementsData.push(newAd);
    }

    toast({ title: isEditing ? '¡Anuncio Actualizado!' : '¡Anuncio Creado!', variant: 'success' });
    setIsFormOpen(false);
    setIsSaving(false);
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
        isLoading={false}
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
