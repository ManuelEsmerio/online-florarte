
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
import { useProductContext } from '@/context/ProductContext';


export default function TestimonialsPage() {
  const { toast } = useToast();
  const { testimonials, fetchAppData, isLoading: isContextLoading } = useProductContext();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(isContextLoading);
  }, [isContextLoading]);
  
  const handleUpdateStatus = useCallback(async (id: number, status: TestimonialStatus) => {
        toast({ title: '¡Estado Actualizado! (Simulación)', description: `El testimonio ha sido ${status === 'approved' ? 'aprobado' : 'rechazado'}.`});
        await fetchAppData();
  }, [fetchAppData, toast]);
  
  const handleDelete = useCallback(async (id: number) => {
         toast({ title: '¡Eliminado! (Simulación)', description: 'El testimonio ha sido eliminado.'});
         await fetchAppData();
  }, [fetchAppData, toast]);


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
