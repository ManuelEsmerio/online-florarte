
'use client';

import { useState, useMemo } from 'react';
import { DataTable } from '@/components/ui/data-table/data-table';
import { useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel, RowSelectionState, PaginationState, SortingState } from '@tanstack/react-table';
import { LoyaltyHistory } from '@/lib/definitions';
import { columns } from './columns';
import { loyaltyHistoryData } from '@/lib/data/loyalty-history-data';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';


export default function LoyaltyHistoryPage() {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const history: LoyaltyHistory[] = useMemo(() =>
    loyaltyHistoryData.map(row => ({
      id: row.id,
      userName: row.user_name,
      userEmail: row.user_email,
      orderId: row.order_id,
      points: row.points,
      transactionType: row.transaction_type,
      createdAt: format(new Date(row.created_at), "dd MMM yyyy, HH:mm'h'", { locale: es }),
    })),
    []
  );

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

  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 pt-6">
      <h2 className="text-4xl font-bold font-headline tracking-tight text-slate-900 dark:text-white">Historial de Puntos</h2>
      <DataTable table={table} columns={columns} data={history} isLoading={false} />
    </div>
  );
}
