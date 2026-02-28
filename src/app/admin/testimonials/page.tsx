
// src/app/admin/testimonials/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table/data-table';
import { useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel, getFilteredRowModel } from '@tanstack/react-table';
import { DataTableSkeleton } from '@/components/ui/data-table/data-table-skeleton';
import { columns } from './columns';
import type { Testimonial } from '@/lib/definitions';
import type { TestimonialStatus } from './columns';


export default function TestimonialsPage() {
  const { toast } = useToast();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTestimonials = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/testimonials');
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Error al cargar testimonios');
      setTestimonials(json.data ?? []);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTestimonials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdateStatus = useCallback(async (id: number, status: TestimonialStatus) => {
    try {
      const res = await fetch(`/api/admin/testimonials/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: status.toUpperCase() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Error al actualizar');
      toast({ title: '¡Estado Actualizado!', description: `El testimonio ha sido ${status === 'approved' ? 'aprobado' : 'rechazado'}.` });
      await loadTestimonials();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  }, [loadTestimonials, toast]);

  const handleDelete = useCallback(async (id: number) => {
    try {
      const res = await fetch(`/api/admin/testimonials/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Error al eliminar');
      toast({ title: '¡Eliminado!', description: 'El testimonio ha sido eliminado.' });
      await loadTestimonials();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  }, [loadTestimonials, toast]);

  const tableColumns = useMemo(() => columns({ onUpdateStatus: handleUpdateStatus, onDelete: handleDelete }), [handleUpdateStatus, handleDelete]);

  const table = useReactTable({
    data: testimonials,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (isLoading) {
    return (
      <div className="flex-1 space-y-8 p-6 md:p-10 pt-6">
        <h2 className="text-4xl font-bold font-headline tracking-tight text-slate-900 dark:text-white">Gestión de Testimonios</h2>
        <DataTableSkeleton columnCount={7} />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 pt-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
        <h2 className="text-4xl font-bold font-headline tracking-tight text-slate-900 dark:text-white">Gestión de Testimonios</h2>
      </div>
      <DataTable table={table} columns={tableColumns} data={testimonials} isLoading={isLoading} />
    </div>
  );
}
