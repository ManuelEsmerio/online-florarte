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
import { allAds as mockAds } from '@/lib/data/ad-data'; // Importación directa
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

  const [sorting, setSorting] = useState<SortingState>([{ id: 'sort_order', desc: false }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  useEffect(() => {
    setIsLoading(true);
    setAnnouncements(mockAds);
    setIsLoading(false);
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
    await new Promise(r => setTimeout(r, 500)); // Simular delay
    setAnnouncements(prev => prev.filter(ad => ad.id !== id));
    toast({ title: '¡Anuncio Eliminado!', description: 'El anuncio se ha eliminado correctamente.', variant: 'success' });
    setIsDeletingId(null);
  };
  
  const handleToggleActive = async (ad: Announcement) => {
    setUpdatingStatusId(ad.id);
    await new Promise(r => setTimeout(r, 500)); // Simular delay
    setAnnouncements(prev => prev.map(currentAd => 
      currentAd.id === ad.id ? { ...currentAd, is_active: !currentAd.is_active } : currentAd
    ));
    toast({ title: 'Estado actualizado', description: `El anuncio "${ad.title}" ahora está ${!ad.is_active ? 'activo' : 'inactivo'}.` });
    setUpdatingStatusId(null);
  };

  const handleSave = async (data: any) => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 1000)); // Simular delay
    
    const isEditing = !!data.id;
    if (isEditing) {
      setAnnouncements(prev => prev.map(ad => ad.id === data.id ? { ...ad, ...data } : ad));
    } else {
      const newId = Math.max(...announcements.map(ad => ad.id), 0) + 1;
      const newAd: Announcement = { ...data, id: newId, sort_order: announcements.length };
      setAnnouncements(prev => [newAd, ...prev]);
    }

    toast({ title: isEditing ? '¡Anuncio Actualizado!' : '¡Anuncio Creado!', variant: 'success' });
    setIsFormOpen(false);
    setIsSaving(false);
  };

  const tableColumns = useMemo(
    () => columns({ onEdit: handleEdit, onDelete: handleDelete, onToggleActive: handleToggleActive, isDeletingId, updatingStatusId }),
    [isDeletingId, updatingStatusId]
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
