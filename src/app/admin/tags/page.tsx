
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table/data-table';
import { useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel, RowSelectionState, PaginationState, SortingState } from '@tanstack/react-table';
import { DataTableSkeleton } from '@/components/ui/data-table/data-table-skeleton';
import { Tag } from '@/lib/definitions';
import { columns } from './columns';
import { TagForm } from './tag-form';
import { useProductContext } from '@/context/ProductContext';
import { allTags } from '@/lib/data/tag-data';


export default function TagsPage() {
  const { toast } = useToast();
  const { tags, fetchAppData, isLoading: isContextLoading } = useProductContext();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);

  useEffect(() => {
    setIsLoading(isContextLoading);
  }, [isContextLoading]);


  const handleAdd = () => {
    setSelectedTag(null);
    setIsFormOpen(true);
  };

  const handleEdit = (tag: Tag) => {
    setSelectedTag(tag);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    setIsDeletingId(id);
    const idx = allTags.findIndex(t => t.id === id);
    if (idx > -1) allTags.splice(idx, 1);
    toast({ title: '¡Etiqueta Eliminada!', description: 'La etiqueta se ha eliminado correctamente.', variant: 'success' });
    await fetchAppData();
    setIsDeletingId(null);
  };

  const handleSave = async (data: Omit<Tag, 'id'>, id?: number) => {
    setIsSaving(true);
    const isEditing = !!id;

    if (isEditing) {
      const idx = allTags.findIndex(t => t.id === id);
      if (idx > -1) allTags[idx] = { ...allTags[idx], name: data.name };
    } else {
      const newId = Math.max(...allTags.map(t => t.id), 0) + 1;
      allTags.push({ id: newId, name: data.name });
    }

    toast({ title: isEditing ? '¡Etiqueta Actualizada!' : '¡Etiqueta Creada!', description: 'La etiqueta ha sido guardada.', variant: 'success' });
    setIsFormOpen(false);
    await fetchAppData();
    setIsSaving(false);
  };

  const tableColumns = useMemo(() => columns({ onEdit: handleEdit, onDelete: handleDelete, isDeletingId }), [handleEdit, handleDelete, isDeletingId]);

  const table = useReactTable({
    data: tags,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (isLoading) {
    return (
      <div className="flex-1 space-y-8 p-6 md:p-10 pt-6">
        <div className="flex items-center justify-between">
            <h2 className="text-4xl font-bold font-headline tracking-tight text-slate-900 dark:text-white">Etiquetas</h2>
            <Button disabled className="rounded-2xl h-11 px-6 font-bold shadow-lg shadow-primary/20"><PlusCircle className="mr-2 h-4 w-4" />Crear Etiqueta</Button>
        </div>
        <DataTableSkeleton columnCount={2} />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 pt-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
        <h2 className="text-4xl font-bold font-headline tracking-tight text-slate-900 dark:text-white">Etiquetas</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={handleAdd} className="rounded-2xl h-11 px-6 font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white transition-all transform hover:-translate-y-1">
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Etiqueta
          </Button>
        </div>
      </div>
      <TagForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSave}
        tag={selectedTag}
        isSaving={isSaving}
      />
      <DataTable table={table} columns={tableColumns} data={tags} isLoading={isLoading} />
    </div>
  );
}
