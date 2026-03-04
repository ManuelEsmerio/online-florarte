
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Header from '@/components/Header';
import { Footer } from '@/components/Footer';
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
import { SlidersHorizontal, Package, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { DialogCell } from '@/components/orders/DialogCell';
import { useIsMobile } from '@/hooks/use-mobile';
import Image from 'next/image';

/**
 * Componente de carga adaptativo que muestra skeletons de tarjetas en móvil
 * y de tabla en escritorio.
 */
const OrdersSkeleton = ({ isMobile }: { isMobile: boolean }) => {
  if (isMobile) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="rounded-2xl border border-border/60 shadow-sm p-5 space-y-5 bg-background">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>

            <div className="flex -space-x-2">
              {Array.from({ length: 3 }).map((__, j) => (
                <Skeleton key={j} className="h-11 w-11 rounded-lg ring-2 ring-background" />
              ))}
            </div>

            <div className="flex justify-between items-end">
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-7 w-28" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-1 w-full rounded-full" />
              <div className="flex justify-between">
                <Skeleton className="h-2 w-14" />
                <Skeleton className="h-2 w-12" />
                <Skeleton className="h-2 w-16" />
              </div>
            </div>

            <div className="flex justify-end">
              <Skeleton className="h-9 w-24 rounded-lg" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Card className="rounded-2xl border border-border/60 shadow-xl overflow-hidden bg-background">
      <div className="grid grid-cols-12 gap-4 px-6 lg:px-8 py-4 bg-muted/30 border-b border-border/60">
        <Skeleton className="h-3 w-20 col-span-2" />
        <Skeleton className="h-3 w-20 col-span-4" />
        <Skeleton className="h-3 w-16 col-span-2 justify-self-center" />
        <Skeleton className="h-3 w-14 col-span-2 justify-self-end" />
        <Skeleton className="h-3 w-14 col-span-2 justify-self-end" />
      </div>

      <div className="divide-y divide-border/60">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="px-6 lg:px-8 py-6 space-y-5">
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-2 space-y-2">
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>

              <div className="col-span-4 flex -space-x-2">
                <Skeleton className="h-12 w-12 rounded-lg ring-4 ring-background" />
                <Skeleton className="h-12 w-12 rounded-lg ring-4 ring-background" />
                <Skeleton className="h-12 w-12 rounded-lg ring-4 ring-background" />
              </div>

              <div className="col-span-2 flex justify-center">
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>

              <div className="col-span-2 flex justify-end">
                <Skeleton className="h-8 w-24" />
              </div>

              <div className="col-span-2 flex justify-end">
                <Skeleton className="h-8 w-20" />
              </div>
            </div>

            <div className="px-2 space-y-2">
              <Skeleton className="h-1 w-full rounded-full" />
              <div className="flex justify-between">
                <Skeleton className="h-2 w-14" />
                <Skeleton className="h-2 w-12" />
                <Skeleton className="h-2 w-16" />
              </div>
            </div>
          </div>
        ))}

        <div className="px-6 lg:px-8 py-4 bg-muted/30 border-t border-border/60 flex items-center justify-between">
          <Skeleton className="h-3 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        </div>
      </div>
    </Card>
  );
};

const getOrderProgressStep = (status: OrderStatus, isUnpaidOrder: boolean) => {
  if (isUnpaidOrder || status === 'CANCELLED') return 0;
  if (status === 'DELIVERED') return 3;
  if (status === 'SHIPPED') return 2;
  return 1;
};

const getOrderProgressWidth = (step: number) => {
  if (step >= 3) return '100%';
  if (step === 2) return '50%';
  if (step === 1) return '2%';
  return '0%';
};

const getOrderProgressColor = (status: OrderStatus, isUnpaidOrder: boolean) => {
  if (isUnpaidOrder || status === 'CANCELLED') return 'bg-muted-foreground/30';
  if (status === 'DELIVERED') return 'bg-emerald-500';
  if (status === 'SHIPPED') return 'bg-amber-500';
  return 'bg-primary';
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

  const statusOptions: OrderStatus[] = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  const statusTranslations: { [key in OrderStatus]: string } = {
    'PENDING': 'Pendiente',
    'PROCESSING': 'En Proceso',
    'SHIPPED': 'En Camino',
    'DELIVERED': 'Completado',
    'CANCELLED': 'Cancelado',
  };

  const getStatusBadgeClass = (status: OrderStatus, isUnpaidOrder: boolean) => {
    if (isUnpaidOrder) {
      return 'bg-red-100 text-red-700 border-none px-3 py-1 text-[10px] font-bold tracking-wider pointer-events-none hover:bg-red-100 hover:text-red-700';
    }

    switch (status) {
      case 'DELIVERED':
        return 'bg-green-100 text-green-600 border-none px-3 py-1 text-[10px] font-bold tracking-wider pointer-events-none hover:bg-green-100 hover:text-green-600';
      case 'SHIPPED':
        return 'bg-blue-100 text-blue-600 border-none px-3 py-1 text-[10px] font-bold tracking-wider pointer-events-none hover:bg-blue-100 hover:text-blue-600';
      case 'CANCELLED':
        return 'bg-slate-100 text-slate-500 border-none px-3 py-1 text-[10px] font-bold tracking-wider pointer-events-none hover:bg-slate-100 hover:text-slate-500';
      default:
        return 'bg-amber-100 text-amber-600 border-none px-3 py-1 text-[10px] font-bold tracking-wider pointer-events-none hover:bg-amber-100 hover:text-amber-600';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  const formatDate = (dateValue: Date | string) => {
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const pageRows = table.getRowModel().rows;
  const totalFilteredRows = table.getFilteredRowModel().rows.length;
  const startItem = totalFilteredRows === 0 ? 0 : pageIndex * pageSize + 1;
  const endItem = pageIndex * pageSize + pageRows.length;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-grow flex flex-col bg-secondary/20 pb-20">
        <div className="container mx-auto px-4 sm:px-6 py-8 md:py-12 max-w-6xl">
          <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold font-headline text-foreground mb-1">Mis Pedidos</h1>
              <p className="text-muted-foreground text-sm">Gestiona y rastrea tus compras recientes</p>
            </div>
          </header>
          
          <div className="flex items-center gap-3 mb-8">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Buscar por ID de pedido..."
                value={(table.getColumn("id")?.getFilterValue() as string) ?? ""}
                onChange={(event) => table.getColumn("id")?.setFilterValue(event.target.value)}
                className="h-12 md:h-13 rounded-xl pl-12 pr-4 bg-background border-none shadow-sm focus-visible:ring-primary/20 transition-all text-sm font-medium"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-12 w-12 rounded-xl bg-background border-none shadow-sm text-muted-foreground hover:text-primary hover:bg-primary/5 active:bg-primary/10 transition-all flex-shrink-0"
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
              <div className="grid grid-cols-1 gap-6 md:hidden">
                {pageRows.map((row) => {
                  const order = row.original;
                  const isUnpaidOrder = !(order as any).has_payment_transaction;
                  const progressStep = getOrderProgressStep(order.status, isUnpaidOrder);
                  const progressColor = getOrderProgressColor(order.status, isUnpaidOrder);
                  return (
                    <Card key={order.id} className={cn(
                      'rounded-2xl border border-border/60 shadow-sm bg-background overflow-hidden',
                      isUnpaidOrder && 'ring-1 ring-red-200/40'
                    )}>
                      <CardContent className="p-5 space-y-5">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-primary font-bold text-lg">#{String(order.id).padStart(4, '0')}</h3>
                            <p className="text-xs text-muted-foreground">{formatDate(order.deliveryDate)}</p>
                          </div>
                          <Badge className={cn('uppercase', getStatusBadgeClass(order.status, isUnpaidOrder))}>
                            {isUnpaidOrder ? 'Sin pago' : statusTranslations[order.status]}
                          </Badge>
                        </div>

                        <div className="flex items-center -space-x-2">
                          {(order.items || []).slice(0, 3).map((item, idx) => (
                            <div key={`${order.id}-${idx}`} className="relative h-11 w-11 rounded-lg overflow-hidden ring-2 ring-background bg-muted">
                              <Image src={item.imageSnap || '/placehold.webp'} alt={item.productNameSnap || 'Producto'} fill className="object-cover" />
                            </div>
                          ))}
                          {(order.items?.length || 0) > 3 && (
                            <div className="h-11 w-11 rounded-lg ring-2 ring-background bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                              +{(order.items?.length || 0) - 3}
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between items-end">
                          <div className="text-sm text-muted-foreground">Total</div>
                          <div className="text-xl font-bold text-foreground">{formatCurrency(order.total)}</div>
                        </div>

                        <div>
                          <div className="relative w-full h-1 bg-muted rounded-full">
                            <div className={cn('absolute top-0 left-0 h-full rounded-full transition-all duration-300', progressColor)} style={{ width: getOrderProgressWidth(progressStep) }} />
                            <div className="absolute -top-1 left-0 right-0 flex justify-between">
                              {[1, 2, 3].map((step) => (
                                <span
                                  key={step}
                                  className={cn(
                                    'h-2.5 w-2.5 rounded-full ring-2 ring-background transition-colors',
                                    progressStep >= step ? progressColor.replace('bg-', 'bg-') : 'bg-muted-foreground/30'
                                  )}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="flex justify-between mt-2 text-[10px] font-medium uppercase tracking-tight text-muted-foreground">
                            <span className={cn(progressStep >= 1 && 'text-primary font-bold')}>Preparado</span>
                            <span className={cn(progressStep >= 2 && 'text-primary font-bold')}>Enviado</span>
                            <span className={cn(progressStep >= 3 && 'text-primary font-bold')}>Entregado</span>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <DialogCell 
                            row={order} 
                            onDataChange={fetchUserOrders}
                            trigger={
                              <Button
                                variant="ghost"
                                className="group/button h-9 px-3 text-primary font-semibold text-sm rounded-xl border border-transparent gap-1 transition-all duration-200 hover:border-primary/40 hover:bg-primary/5 hover:shadow-[0_8px_25px_rgba(244,37,106,0.18)] dark:hover:shadow-[0_8px_25px_rgba(244,37,106,0.35)] focus-visible:ring-2 focus-visible:ring-primary/40"
                              >
                                Ver más
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                            }
                          />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Card className="hidden md:block rounded-2xl border border-border/60 shadow-xl bg-background overflow-hidden">
                <div className="grid grid-cols-12 gap-4 px-6 lg:px-8 py-4 bg-muted/30 border-b border-border/60 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  <div className="col-span-2">ID & Fecha</div>
                  <div className="col-span-4">Productos</div>
                  <div className="col-span-2 text-center">Estado</div>
                  <div className="col-span-2 text-right">Total</div>
                  <div className="col-span-2 text-right">Acción</div>
                </div>

                <div className="divide-y divide-border/60">
                  {pageRows.map((row) => {
                    const order = row.original;
                    const isUnpaidOrder = !(order as any).has_payment_transaction;
                    const progressStep = getOrderProgressStep(order.status, isUnpaidOrder);
                    const progressColor = getOrderProgressColor(order.status, isUnpaidOrder);

                    return (
                      <div
                        key={order.id}
                        className={cn(
                          'group relative px-6 lg:px-8 py-6 transition-all duration-300 bg-background border-l-4 border-transparent hover:border-primary/50 dark:hover:border-white/40 hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent dark:hover:from-white/10 dark:hover:to-transparent hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)] dark:hover:shadow-[0_18px_40px_rgba(0,0,0,0.6)]',
                          isUnpaidOrder && 'opacity-85'
                        )}
                      >
                        <div className="grid grid-cols-12 gap-4 items-center">
                          <div className="col-span-2">
                            <span className="block text-primary font-bold text-2xl mb-0.5">#{String(order.id).padStart(4, '0')}</span>
                            <span className="text-xs text-muted-foreground">{formatDate(order.deliveryDate)}</span>
                          </div>

                          <div className="col-span-4 flex -space-x-2">
                            {(order.items || []).slice(0, 3).map((item, idx) => (
                              <div key={`${order.id}-desktop-${idx}`} className="relative inline-block h-12 w-12 rounded-lg ring-4 ring-background overflow-hidden bg-muted">
                                <Image src={item.imageSnap || '/placehold.webp'} alt={item.productNameSnap || 'Producto'} fill className="object-cover" />
                              </div>
                            ))}
                            {(order.items?.length || 0) > 3 && (
                              <div className="inline-flex h-12 w-12 rounded-lg ring-4 ring-background bg-muted items-center justify-center text-[10px] font-bold text-muted-foreground">
                                +{(order.items?.length || 0) - 3}
                              </div>
                            )}
                          </div>

                          <div className="col-span-2 flex justify-center">
                            <Badge className={cn('uppercase', getStatusBadgeClass(order.status, isUnpaidOrder))}>
                              {isUnpaidOrder ? 'Sin pago' : statusTranslations[order.status]}
                            </Badge>
                          </div>

                          <div className="col-span-2 text-right">
                            <span className="text-2xl font-bold text-foreground">{formatCurrency(order.total)}</span>
                          </div>

                          <div className="col-span-2 flex justify-end">
                            <DialogCell
                              row={order}
                              onDataChange={fetchUserOrders}
                              trigger={
                                <Button
                                  variant="ghost"
                                  className="group/button text-primary font-semibold text-sm rounded-xl px-3 py-2 border border-transparent gap-1 transition-all duration-200 hover:border-primary/40 hover:bg-primary/5 hover:shadow-[0_12px_30px_rgba(244,37,106,0.15)] dark:hover:shadow-[0_12px_30px_rgba(244,37,106,0.35)] focus-visible:ring-2 focus-visible:ring-primary/40"
                                >
                                  Ver más
                                  <ChevronRight className="w-4 h-4" />
                                </Button>
                              }
                            />
                          </div>
                        </div>

                        <div className="mt-5 px-2">
                          <div className="relative w-full h-1 bg-muted rounded-full">
                            <div className={cn('absolute top-0 left-0 h-full rounded-full transition-all duration-300', progressColor)} style={{ width: getOrderProgressWidth(progressStep) }} />
                            <div className="absolute -top-1 left-0 right-0 flex justify-between">
                              {[1, 2, 3].map((step) => (
                                <span
                                  key={step}
                                  className={cn(
                                    'h-2.5 w-2.5 rounded-full ring-4 ring-background',
                                    progressStep >= step
                                      ? progressColor.includes('emerald')
                                        ? 'bg-emerald-500'
                                        : progressColor.includes('amber')
                                          ? 'bg-amber-500'
                                          : progressColor.includes('primary')
                                            ? 'bg-primary'
                                            : 'bg-muted-foreground/40'
                                      : 'bg-muted-foreground/30'
                                  )}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="flex justify-between mt-2 text-[10px] font-medium uppercase tracking-tight text-muted-foreground">
                            <span className={cn(progressStep >= 1 && (progressColor.includes('emerald') ? 'text-emerald-500' : progressColor.includes('amber') ? 'text-amber-500' : progressColor.includes('primary') ? 'text-primary' : ''), progressStep >= 1 && 'font-bold')}>Preparado</span>
                            <span className={cn(progressStep >= 2 && (progressColor.includes('emerald') ? 'text-emerald-500' : progressColor.includes('amber') ? 'text-amber-500' : progressColor.includes('primary') ? 'text-primary' : ''), progressStep >= 2 && 'font-bold')}>Enviado</span>
                            <span className={cn(progressStep >= 3 && (progressColor.includes('emerald') ? 'text-emerald-500' : progressColor.includes('amber') ? 'text-amber-500' : progressColor.includes('primary') ? 'text-primary' : ''), progressStep >= 3 && 'font-bold')}>Entregado</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="px-6 lg:px-8 py-4 bg-muted/30 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Mostrando {startItem}-{endItem} de {totalFilteredRows} pedidos</span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                      className="h-8 px-3 rounded-lg border border-border/70 hover:bg-background"
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                      className="h-8 px-3 rounded-lg border border-border/70 hover:bg-background"
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              </Card>

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
