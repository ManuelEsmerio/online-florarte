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
import { allTags as mockTags } from '@/lib/data/tag-data'; // Importación directa

export default function TagsPage() {
  const { toast } = useToast();
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  
  useEffect(() => {
    setIsLoading(true);
    setTags(mockTags);
    setIsLoading(false);
  }, []);

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
    await new Promise(r => setTimeout(r, 500)); // Simular delay
    setTags(prev => prev.filter(t => t.id !== id));
    toast({ title: '¡Etiqueta Eliminada!', description: 'La etiqueta se ha eliminado correctamente.', variant: 'success' });
    setIsDeletingId(null);
  };
  
  const handleSave = async (data: Omit<Tag, 'id'>, id?: number) => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 1000)); // Simular delay
    const isEditing = !!id;
    
    if (isEditing) {
      setTags(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
    } else {
      const newId = Math.max(...tags.map(t => t.id), 0) + 1;
      const newTag: Tag = { ...data, id: newId, product_count: 0 };
      setTags(prev => [newTag, ...prev]);
    }

    toast({ title: isEditing ? '¡Etiqueta Actualizada!' : '¡Etiqueta Creada!', description: 'La etiqueta ha sido guardada.', variant: 'success'});
    setIsFormOpen(false);
    setIsSaving(false);
  };

  const tableColumns = useMemo(() => columns({ onEdit: handleEdit, onDelete: handleDelete, isDeletingId }), [isDeletingId]);

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
        <DataTableSkeleton columnCount={3} />
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
