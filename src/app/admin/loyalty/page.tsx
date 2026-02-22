
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table/data-table';
import { useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel, RowSelectionState, PaginationState, SortingState } from '@tanstack/react-table';
import { DataTableSkeleton } from '@/components/ui/data-table/data-table-skeleton';
import { LoyaltyHistory } from '@/lib/definitions';
import { columns } from './columns';
import { useAuth } from '@/context/AuthContext';
import { handleApiResponse } from '@/utils/handleApiResponse';


export default function LoyaltyHistoryPage() {
  const { toast } = useToast();
  const { apiFetch } = useAuth();
  const [history, setHistory] = useState<LoyaltyHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fetchInitiated = useRef(false);

  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});


  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
        const res = await apiFetch('/api/admin/loyalty');
        const data = await handleApiResponse(res, []);
        setHistory(data);
    } catch(err: any) {
        toast({ title: 'Error', description: err.message, variant: 'destructive'});
    } finally {
        setIsLoading(false);
    }
  }, [apiFetch, toast]);

  useEffect(() => {
    // This check ensures we only fetch once on component mount
    if (!fetchInitiated.current) {
        fetchInitiated.current = true;
        fetchData();
    }
  }, [fetchData]);


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
        <DataTableSkeleton columnCount={5} />
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
