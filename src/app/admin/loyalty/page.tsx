
'use client';

import { useState, useCallback, useEffect } from 'react';
import { DataTable } from '@/components/ui/data-table/data-table';
import { useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel, RowSelectionState, PaginationState, SortingState } from '@tanstack/react-table';
import { DataTableSkeleton } from '@/components/ui/data-table/data-table-skeleton';
import { LoyaltyHistory } from '@/lib/definitions';
import { columns } from './columns';
import { useToast } from '@/hooks/use-toast';


export default function LoyaltyHistoryPage() {
  const { toast } = useToast();
  const [history, setHistory] = useState<LoyaltyHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/loyalty');
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Error al cargar historial');
      setHistory(json.data ?? []);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const table = useReactTable({
    data: history,
    columns: columns,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { pagination, sorting, rowSelection },
  });

  if (isLoading && history.length === 0) {
    return (
      <div className="flex-1 space-y-8 p-6 md:p-10 pt-6">
        <h2 className="text-4xl font-bold font-headline tracking-tight text-slate-900 dark:text-white">Historial de Puntos</h2>
        <DataTableSkeleton columnCount={6} />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 pt-6">
      <h2 className="text-4xl font-bold font-headline tracking-tight text-slate-900 dark:text-white">Historial de Puntos</h2>
      <DataTable table={table} columns={columns} data={history} isLoading={isLoading} />
    </div>
  );
}
