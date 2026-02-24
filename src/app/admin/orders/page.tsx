'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { columns } from './columns';
import { Order, OrderStatus } from '@/lib/definitions';
import type { User as DeliveryUser } from '@/lib/definitions';
import { 
  useReactTable, 
  getCoreRowModel, 
  getFilteredRowModel, 
  getPaginationRowModel, 
  getSortedRowModel, 
  flexRender,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  PaginationState,
} from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuCheckboxItem, 
  DropdownMenuContent, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { SlidersHorizontal } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table/data-table';
import { useToast } from '@/hooks/use-toast';
import { DataTableSkeleton } from '@/components/ui/data-table/data-table-skeleton';
import { useProductContext } from '@/context/ProductContext';
import { useAuth } from '@/context/AuthContext';

export default function OrdersPage() {
  const { orders, isLoading, fetchAppData } = useProductContext();
  const { allUsers } = useAuth(); // Repartidores se filtran de aquí en un caso real
  const { toast } = useToast();
  
  const [sorting, setSorting] = useState<SortingState>([{ id: 'id', desc: true }]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [isSendingUpdateFor, setIsSendingUpdateFor] = useState<number | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  
  const columnFilters = useMemo(() => {
     return statusFilter.length > 0 ? [{ id: 'status', value: statusFilter }] : [];
  }, [statusFilter]);

  // Simulación de repartidores (filtrados de la lista de usuarios con rol 'delivery')
  const deliveryDrivers = useMemo(() => {
      // En el prototipo, buscamos los usuarios que tengan rol de repartidor
      return []; // Por ahora vacío si no hay datos de repartidores en AuthContext
  }, []);

  const handleUpdateStatus = useCallback(async (orderId: number, newStatus: OrderStatus, payload: any) => {
    // Simulación de actualización local
    toast({
        title: '¡Estado Actualizado!',
        description: `El pedido ORD${String(orderId).padStart(4, '0')} ha cambiado a ${newStatus}.`,
        variant: 'success'
    });
    // En un prototipo real, actualizaríamos el estado global o el archivo local
  }, [toast]);

  const handleCancelOrder = useCallback(async (orderId: number) => {
    await handleUpdateStatus(orderId, 'cancelado', {});
  }, [handleUpdateStatus]);

  const handleSendUpdate = useCallback(async (order: Order) => {
    setIsSendingUpdateFor(order.id);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({ title: 'Correo enviado (Simulación)', description: `Actualización enviada a ${order.customerEmail}`, variant: 'success' });
    setIsSendingUpdateFor(null);
  }, [toast]);
  
  const tableColumns = useMemo(() => columns({ 
    onUpdateStatus: handleUpdateStatus, 
    onCancelOrder: handleCancelOrder, 
    deliveryDrivers: [] as any, // Mock
    onSendUpdate: handleSendUpdate,
    isSendingUpdateFor,
  }), [handleUpdateStatus, handleCancelOrder, handleSendUpdate, isSendingUpdateFor]);

  const table = useReactTable({
    data: orders,
    columns: tableColumns,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
      globalFilter: searchTerm,
      pagination
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setSearchTerm,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const statusOptions: OrderStatus[] = ['pendiente', 'procesando', 'enviado', 'completado', 'cancelado'];
  const statusTranslations: { [key in OrderStatus]: string } = {
    'pendiente': 'Pendiente',
    'procesando': 'En Proceso',
    'enviado': 'Enviado',
    'completado': 'Completado',
    'cancelado': 'Cancelado',
  }

  if (isLoading && orders.length === 0) {
    return (
      <div className="flex-1 space-y-8 p-6 md:p-10 pt-6">
        <h2 className="text-4xl font-bold font-headline tracking-tight text-slate-900 dark:text-white">Pedidos</h2>
        <DataTableSkeleton columnCount={7} />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 pt-6">
      <h2 className="text-4xl font-bold font-headline tracking-tight text-slate-900 dark:text-white">Pedidos</h2>
      
      <DataTable 
        table={table} 
        columns={tableColumns} 
        data={orders} 
        isLoading={isLoading}
        toolbar={
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col md:flex-row flex-1 items-center space-y-2 md:space-y-0 md:space-x-2 w-full">
                <Input
                    placeholder="Filtrar por ID, cliente, email..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="h-10 rounded-xl w-full md:w-[300px] border-none bg-background shadow-sm"
                />
                 <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-10 w-full md:w-auto px-4 bg-background border-none shadow-sm text-muted-foreground hover:text-primary hover:bg-primary/5 active:bg-primary/10 transition-all flex items-center gap-2 font-bold rounded-xl">
                      <SlidersHorizontal className="h-4 w-4" />
                      Estado
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-2xl p-2 border-none shadow-2xl">
                    <DropdownMenuLabel className="text-[10px] uppercase tracking-widest font-bold px-3 py-2">Filtrar por estado</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-muted/50" />
                    <DropdownMenuCheckboxItem
                        checked={statusFilter.length === 0}
                        onCheckedChange={() => setStatusFilter([])}
                        className="rounded-xl my-1"
                    >
                        Ver todos
                    </DropdownMenuCheckboxItem>
                     <DropdownMenuSeparator className="bg-muted/50" />
                    {statusOptions.map(status => (
                       <DropdownMenuCheckboxItem
                          key={status}
                          className="capitalize rounded-xl my-1"
                          checked={statusFilter.includes(status)}
                          onCheckedChange={(checked) => {
                              setStatusFilter(prev => 
                                checked 
                                    ? [...prev, status]
                                    : prev.filter(s => s !== status)
                              )
                          }}
                        >
                          {statusTranslations[status]}
                        </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
            </div>
          </div>
        }
      />
    </div>
  );
}
