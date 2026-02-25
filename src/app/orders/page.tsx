
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Header from '@/components/Header';
import { Footer } from '@/components/Footer';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  TableHead,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Order, OrderStatus } from '@/lib/definitions';
import { columns } from './columns';
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
import { SlidersHorizontal, Package, Search, Star, Eye, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { DataTablePagination } from '@/components/ui/data-table/data-table-pagination';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { DialogCell } from '@/components/orders/DialogCell';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Componente de carga adaptativo que muestra skeletons de tarjetas en móvil
 * y de tabla en escritorio.
 */
const OrdersSkeleton = ({ isMobile }: { isMobile: boolean }) => {
  if (isMobile) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="rounded-[2rem] border-none shadow-sm p-6 space-y-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-6 w-24" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="flex justify-between items-end">
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-28" />
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-12 flex-1 rounded-xl" />
              <Skeleton className="h-12 flex-1 rounded-xl" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden">
      <div className="space-y-4 p-6">
        <div className="flex gap-4 border-b pb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 items-center py-4 border-b last:border-0">
            {Array.from({ length: 5 }).map((_, j) => (
              <Skeleton key={j} className="h-6 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default function OrdersPage() {
  const { user, getOrders } = useAuth();
  const isMobile = useIsMobile();
  const router = useRouter();
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const fetchUserOrders = useCallback(async () => {
    if (!getOrders) return;
    setIsLoading(true);
    try {
      const data = await getOrders();
      setUserOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoading(false);
    }
  }, [getOrders]);

  // user?.id en lugar del objeto completo: fetchUserOrders solo se re-dispara
  // al cambiar la identidad del usuario (login/logout), no al actualizar perfil.
  const userId = user?.id;
  useEffect(() => {
    if (!userId) {
      router.push('/login?redirect=/orders');
      return;
    }
    fetchUserOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, router, fetchUserOrders]);
  
  const tableColumns = useMemo(() => columns({ onDataChange: fetchUserOrders }), [fetchUserOrders]);
  
  const table = useReactTable({
    data: userOrders,
    columns: tableColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const statusOptions: OrderStatus[] = ['pendiente', 'procesando', 'en_reparto', 'completado', 'cancelado'];
  const statusTranslations: { [key in OrderStatus]: string } = {
    'pendiente': 'Pendiente',
    'procesando': 'En Proceso',
    'en_reparto': 'En Camino',
    'completado': 'Completado',
    'cancelado': 'Cancelado',
  };

  const getStatusBadgeClass = (status: OrderStatus) => {
    switch (status) {
      case 'completado': return 'bg-green-100 text-green-600 border-none px-3 py-1 text-[10px] font-bold tracking-wider';
      case 'en_reparto': return 'bg-blue-100 text-blue-600 border-none px-3 py-1 text-[10px] font-bold tracking-wider';
      case 'cancelado': return 'bg-slate-100 text-slate-500 border-none px-3 py-1 text-[10px] font-bold tracking-wider';
      default: return 'bg-amber-100 text-amber-600 border-none px-3 py-1 text-[10px] font-bold tracking-wider';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-grow flex flex-col bg-secondary/40 pb-20">
        <div className="container mx-auto px-4 sm:px-6 py-8 md:py-12 max-w-5xl">
          <h1 className="text-2xl md:text-4xl font-bold font-headline mb-8 text-slate-900 dark:text-white">Mis Pedidos</h1>
          
          {/* Barra de Búsqueda y Filtros Premium */}
          <div className="flex items-center gap-3 mb-8">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Buscar por ID de pedido..."
                value={(table.getColumn("id")?.getFilterValue() as string) ?? ""}
                onChange={(event) => table.getColumn("id")?.setFilterValue(event.target.value)}
                className="h-14 rounded-2xl pl-12 pr-4 bg-background border-none shadow-sm focus-visible:ring-primary/20 transition-all text-sm font-medium"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-14 w-14 rounded-2xl bg-background border-none shadow-sm text-muted-foreground hover:text-primary hover:bg-primary/5 active:bg-primary/10 transition-all flex-shrink-0"
                >
                  <SlidersHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[220px] border-none shadow-2xl">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold px-3 py-3">Filtrar por estado</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-muted/50" />
                <DropdownMenuCheckboxItem
                  checked={!table.getColumn("status")?.getFilterValue()}
                  onCheckedChange={() => table.getColumn("status")?.setFilterValue(undefined)}
                  className="rounded-xl my-1 py-2 font-medium"
                >
                  Todos los pedidos
                </DropdownMenuCheckboxItem>
                {statusOptions.map(status => (
                  <DropdownMenuCheckboxItem
                    key={status}
                    className="capitalize rounded-xl my-1 py-2 font-medium"
                    checked={(table.getColumn("status")?.getFilterValue() as string[] | undefined)?.includes(status)}
                    onCheckedChange={(value) => {
                      const currentFilter = (table.getColumn("status")?.getFilterValue() as string[] | undefined) || [];
                      if (value) table.getColumn("status")?.setFilterValue([...currentFilter, status]);
                      else table.getColumn("status")?.setFilterValue(currentFilter.filter(s => s !== status));
                    }}
                  >
                    {statusTranslations[status]}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {isLoading ? (
            <OrdersSkeleton isMobile={isMobile} />
          ) : userOrders.length > 0 ? (
            <>
              {/* VISTA MÓVIL: TARJETAS */}
              <div className="grid grid-cols-1 gap-6 md:hidden">
                {table.getRowModel().rows.map((row) => {
                  const order = row.original;
                  return (
                    <Card key={order.id} className="rounded-[2rem] border-none shadow-sm bg-background overflow-hidden animate-fade-in-up">
                      <CardContent className="p-6 space-y-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pedido</p>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">ORD#{String(order.id).padStart(4, '0')}</h3>
                          </div>
                          <Badge className={cn("uppercase", getStatusBadgeClass(order.status))}>
                            {statusTranslations[order.status]}
                          </Badge>
                        </div>

                        <div className="flex justify-between items-end border-t border-muted/30 pt-4">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                              {order.status === 'cancelado' ? 'Fecha Programada' : 'Fecha de Entrega'}
                            </p>
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{formatDate(order.delivery_date)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total</p>
                            <p className="text-xl font-bold text-primary">{formatCurrency(order.total)}</p>
                          </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                          {order.status === 'completado' && (
                            <DialogCell 
                              row={order} 
                              onDataChange={fetchUserOrders}
                              trigger={
                                <Button variant="outline" className="flex-1 h-12 rounded-xl border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-300 font-bold text-sm gap-2 active:scale-95 transition-all">
                                  <Star className="w-4 h-4" />
                                  Opinar
                                </Button>
                              }
                            />
                          )}
                          <DialogCell 
                            row={order} 
                            onDataChange={fetchUserOrders}
                            trigger={
                              <Button className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm gap-2 active:scale-95 transition-all shadow-lg shadow-primary/20">
                                <Eye className="w-4 h-4" />
                                Ver Detalle
                              </Button>
                            }
                          />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* VISTA ESCRITORIO: TABLA */}
              <Card className="hidden md:block rounded-[2.5rem] border-none shadow-sm bg-background overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/30">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id} className="hover:bg-transparent border-b-border/50">
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id} className="h-14 px-6 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id} className="hover:bg-primary/5 transition-colors border-b-border/50 group">
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="px-6 py-5">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>

              {/* PAGINACIÓN PERSONALIZADA PARA MÓVIL */}
              <div className="mt-10 flex items-center justify-between gap-4 md:hidden">
                <Button 
                  variant="ghost" 
                  onClick={() => table.previousPage()} 
                  disabled={!table.getCanPreviousPage()}
                  className="rounded-2xl h-12 px-6 bg-background/50 border-none shadow-sm text-slate-500 font-bold text-xs gap-2 active:scale-95"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>
                
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  PÁG {table.getState().pagination.pageIndex + 1} DE {table.getPageCount()}
                </span>

                <Button 
                  variant="ghost" 
                  onClick={() => table.nextPage()} 
                  disabled={!table.getCanNextPage()}
                  className="rounded-2xl h-12 px-6 bg-background/50 border-none shadow-sm text-slate-500 font-bold text-xs gap-2 active:scale-95"
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* PAGINACIÓN ESCRITORIO */}
              <div className="hidden md:block mt-6">
                <DataTablePagination table={table} />
              </div>
            </>
          ) : (
            <div className="text-center py-32 px-4 bg-background rounded-[3rem] shadow-sm animate-fade-in">
              <div className="inline-flex p-8 bg-secondary/50 rounded-full mb-6">
                <Package className="h-16 w-16 text-muted-foreground/20" />
              </div>
              <h3 className="text-2xl font-bold font-headline mb-2 text-slate-900">No has realizado pedidos aún</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mb-10">
                Tus compras aparecerán aquí para que puedas darles seguimiento.
              </p>
              <Button asChild size="lg" className="h-14 px-10 rounded-2xl font-bold shadow-lg shadow-primary/20">
                <Link href="/products/all">Explorar productos</Link>
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
