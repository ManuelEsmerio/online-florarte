
// src/app/admin/coupons/page.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { columns } from './columns';
import type { Coupon, User, ProductCategory, Product } from '@/lib/definitions';
import { CouponForm } from './coupon-form';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { SlidersHorizontal, PlusCircle, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table/data-table';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  RowSelectionState,
  PaginationState,
} from '@tanstack/react-table';
import { useAuth } from '@/context/AuthContext';
import { DataTableSkeleton } from '@/components/ui/data-table/data-table-skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { CouponStatus } from '@/lib/definitions';
import { handleApiResponse } from '@/utils/handleApiResponse';
import { useProductContext } from '@/context/ProductContext';


export default function CouponsPage() {
  const { toast } = useToast();
  const { apiFetch } = useAuth();
  const { products, categories, fetchAppData } = useProductContext();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [isSendingCouponId, setIsSendingCouponId] = useState<number | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);

  const [sorting, setSorting] = useState<SortingState>([{ id: 'id', desc: true }]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  const [totalRows, setTotalRows] = useState(0);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const [filters, setFilters] = useState<{ search: string; status: string[] }>({ search: '', status: [] });

  const handleSendCoupon = useCallback(async (coupon: Coupon) => {
    setIsSendingCouponId(coupon.id);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({ title: '¡Éxito! (Simulación)', description: `Correo de cupón enviado.`, variant: 'success' });
    setIsSendingCouponId(null);
  }, [toast]);
  
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
        const params = new URLSearchParams();
        params.append('search', filters.search);
        params.append('status', filters.status.join(','));
        params.append('page', (pagination.pageIndex + 1).toString());
        params.append('limit', pagination.pageSize.toString());
        params.append('withDetails', 'true');
        
        const res = await apiFetch(`/api/admin/coupons?${params.toString()}`);
        const data = await handleApiResponse(res, { coupons: [], total: 0 });
        
        setCoupons(data.coupons);
        setTotalRows(data.total);

    } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  }, [apiFetch, toast, filters, pagination]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const fetchCustomers = useCallback(async () => {
     try {
        const res = await apiFetch('/api/admin/users?status=active');
        const data = await handleApiResponse(res, []);
        setCustomers(data);
     } catch (error: any) {
        toast({ title: 'Error', description: 'No se pudieron cargar los clientes.', variant: 'destructive' });
     }
  }, [apiFetch, toast]);

  useEffect(() => {
    if (isFormOpen) {
        fetchCustomers();
    }
  }, [isFormOpen, fetchCustomers]);

  const handleDeleteCoupon = useCallback(async (id: number) => {
    setIsDeletingId(id);
    try {
        const res = await apiFetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
        await handleApiResponse(res);
        toast({ title: '¡Cupón Eliminado!', description: 'El cupón ha sido eliminado correctamente.', variant: 'success' });
        await fetchData(); 
    } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive'});
    } finally {
        setIsDeletingId(null);
    }
  }, [apiFetch, toast, fetchData]);

  const handleEditCoupon = useCallback(async (coupon: Coupon) => {
    try {
      const res = await apiFetch(`/api/admin/coupons/${coupon.id}`);
      const fullCoupon = await handleApiResponse(res);
      setSelectedCoupon(fullCoupon);
      setTimeout(() => setIsFormOpen(true), 100);
    } catch (error: any) {
      toast({ title: 'Error', description: 'No se pudieron cargar los detalles del cupón.', variant: 'destructive' });
    }
  }, [apiFetch, toast]);

  const tableColumns = useMemo(() => columns({
    onEdit: handleEditCoupon,
    onDelete: handleDeleteCoupon,
    onSendCoupon: handleSendCoupon,
    isSendingCouponId,
    isDeletingId,
  }), [handleSendCoupon, isSendingCouponId, handleDeleteCoupon, isDeletingId, handleEditCoupon]);

  const table = useReactTable({
    data: coupons,
    columns: tableColumns,
    pageCount: Math.ceil(totalRows / pagination.pageSize),
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    state: {
      pagination,
      sorting,
      rowSelection,
      columnVisibility,
    },
  });

  const handleAddCoupon = () => {
    setSelectedCoupon(null);
    setTimeout(() => setIsFormOpen(true), 100);
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedIds = selectedRows.map(row => row.original.id);
    
    if (selectedIds.length === 0) {
      setIsDeleting(false);
      return;
    }
    
    try {
        const res = await apiFetch('/api/admin/coupons', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: selectedIds }),
        });
        const data = await handleApiResponse(res);
        toast({ title: '¡Cupones Eliminados!', description: data.message, variant: 'success' });
        table.resetRowSelection();
        await fetchData();
    } catch (error: any) {
         toast({ title: 'Error en la eliminación masiva', description: error.message, variant: 'destructive' });
    } finally {
        setIsDeleting(false);
    }
  };

  const handleSaveCoupon = async (couponData: any, id?: number) => {
    setIsSaving(true);
    const isEditing = !!id;
    const url = isEditing ? `/api/admin/coupons/${id}` : '/api/admin/coupons';
    const method = isEditing ? 'PUT' : 'POST';

    try {
        const res = await apiFetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(couponData),
        });
        await handleApiResponse(res);
        toast({
          title: isEditing ? '¡Cupón Actualizado!' : '¡Cupón Creado!',
          description: `El cupón ${couponData.code} ha sido guardado.`,
          variant: 'success'
        });
        setIsFormOpen(false);
        setSelectedCoupon(null);
        await fetchData();
    } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive'});
    } finally {
        setIsSaving(false);
    }
  };

  const statusOptions: CouponStatus[] = ['vigente', 'vencido', 'utilizado'];
  const statusTranslations: { [key in CouponStatus]: string } = {
    'vigente': 'Vigente',
    'vencido': 'Vencido',
    'utilizado': 'Utilizado',
  }

  if(isLoading && coupons.length === 0) {
    return (
       <div className="flex-1 space-y-8 p-6 md:p-10 pt-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
            <h2 className="text-4xl font-bold font-headline tracking-tight text-slate-900 dark:text-white">Cupones</h2>
            <div className="flex items-center space-x-2">
                <Button disabled className="rounded-2xl h-11 px-6 font-bold shadow-lg shadow-primary/20"><PlusCircle className="mr-2 h-4 w-4" />Crear Cupón</Button>
            </div>
        </div>
        <DataTableSkeleton columnCount={9} />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 pt-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
        <h2 className="text-4xl font-bold font-headline tracking-tight text-slate-900 dark:text-white">Cupones</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={handleAddCoupon} className="rounded-2xl h-11 px-6 font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white transition-all transform hover:-translate-y-1">
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Cupón
          </Button>
        </div>
      </div>
      <CouponForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSaveCoupon}
        coupon={selectedCoupon}
        isSaving={isSaving}
        customers={customers}
        products={products}
        categories={categories}
      />
      
      <DataTable 
        table={table} 
        columns={tableColumns} 
        data={coupons} 
        isLoading={isLoading} 
        toolbar={
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col md:flex-row flex-1 items-center space-y-2 md:space-y-0 md:space-x-2 w-full">
                <Input
                    placeholder="Filtrar por código, descripción..."
                    value={filters.search}
                    onChange={(event) =>
                        setFilters(prev => ({...prev, search: event.target.value }))
                    }
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
                    <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-3 py-2">Filtrar por estado</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-muted/50" />
                    <DropdownMenuCheckboxItem
                        checked={filters.status.length === 0}
                        onCheckedChange={() => setFilters(prev => ({...prev, status: []}))}
                        className="rounded-xl my-1"
                    >
                        Ver todos
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator className="bg-muted/50" />
                    {statusOptions.map(status => (
                       <DropdownMenuCheckboxItem
                          key={status}
                          className="capitalize rounded-xl my-1"
                          checked={filters.status.includes(status)}
                          onCheckedChange={(checked) => {
                              setFilters(prev => ({
                                  ...prev,
                                  status: checked 
                                    ? [...prev.status, status]
                                    : prev.status.filter(s => s !== status)
                              }))
                          }}
                        >
                          {statusTranslations[status]}
                        </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                 {table.getFilteredSelectedRowModel().rows.length > 0 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="h-10 rounded-xl px-4 font-bold shadow-lg shadow-destructive/10 bg-destructive hover:bg-destructive/90 transition-all transform hover:-translate-y-0.5 ml-2">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar ({table.getFilteredSelectedRowModel().rows.length})
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="font-headline text-2xl">¿Estás seguro?</AlertDialogTitle>
                          <AlertDialogDescription className="text-sm leading-relaxed">
                            Esta acción eliminará permanentemente {table.getFilteredSelectedRowModel().rows.length} cupones.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-2">
                          <AlertDialogCancel className="rounded-2xl h-12 border-none bg-muted/50 font-bold">Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90 rounded-2xl h-12 font-bold shadow-lg shadow-destructive/20"
                            onClick={handleBulkDelete}
                            disabled={isDeleting}
                          >
                            {isDeleting ? "Eliminando..." : "Sí, eliminar"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
            </div>
          </div>
        }
      />
    </div>
  );
}
