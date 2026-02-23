
// src/app/admin/coupons/page.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { columns } from './columns';
import type { Coupon, User } from '@/lib/definitions';
import { CouponScope, DiscountType } from '@/lib/definitions';
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
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  VisibilityState,
  RowSelectionState,
  PaginationState,
} from '@tanstack/react-table';
import { DataTableSkeleton } from '@/components/ui/data-table/data-table-skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { CouponStatus } from '@/lib/definitions';
import { useProductContext } from '@/context/ProductContext';
import { allCoupons } from '@/lib/data/coupon-data';
import { allUsers } from '@/lib/data/user-data';
import { getCouponStatus } from '@/lib/business-logic/coupon-logic';


export default function CouponsPage() {
  const { toast } = useToast();
  const { products, categories } = useProductContext();

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

  const fetchData = useCallback(() => {
    setIsLoading(true);
    let filtered = [...allCoupons];

    if (filters.search) {
      const term = filters.search.toLowerCase();
      filtered = filtered.filter(c =>
        c.code.toLowerCase().includes(term) ||
        c.description.toLowerCase().includes(term)
      );
    }
    if (filters.status.length > 0) {
      filtered = filtered.filter(c => filters.status.includes(c.status));
    }

    const total = filtered.length;
    const paginated = filtered.slice(
      pagination.pageIndex * pagination.pageSize,
      (pagination.pageIndex + 1) * pagination.pageSize
    );

    setCoupons(paginated);
    setTotalRows(total);
    setIsLoading(false);
  }, [filters, pagination]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (isFormOpen) {
      const activeCustomers = allUsers.filter(u => !(u as any).is_deleted) as User[];
      setCustomers(activeCustomers);
    }
  }, [isFormOpen]);

  const handleDeleteCoupon = useCallback((id: number) => {
    setIsDeletingId(id);
    const idx = allCoupons.findIndex(c => c.id === id);
    if (idx > -1) allCoupons.splice(idx, 1);
    toast({ title: '¡Cupón Eliminado!', description: 'El cupón ha sido eliminado correctamente.', variant: 'success' });
    fetchData();
    setIsDeletingId(null);
  }, [toast, fetchData]);

  const handleEditCoupon = useCallback((coupon: Coupon) => {
    const fullCoupon = allCoupons.find(c => c.id === coupon.id) || coupon;
    setSelectedCoupon(fullCoupon);
    setTimeout(() => setIsFormOpen(true), 100);
  }, []);

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
    state: { pagination, sorting, rowSelection, columnVisibility },
  });

  const handleAddCoupon = () => {
    setSelectedCoupon(null);
    setTimeout(() => setIsFormOpen(true), 100);
  };

  const handleBulkDelete = () => {
    setIsDeleting(true);
    const selectedIds = table.getFilteredSelectedRowModel().rows.map(row => row.original.id);
    if (selectedIds.length === 0) { setIsDeleting(false); return; }

    selectedIds.forEach(id => {
      const idx = allCoupons.findIndex(c => c.id === id);
      if (idx > -1) allCoupons.splice(idx, 1);
    });

    toast({ title: '¡Cupones Eliminados!', description: `${selectedIds.length} cupones eliminados.`, variant: 'success' });
    table.resetRowSelection();
    fetchData();
    setIsDeleting(false);
  };

  const handleSaveCoupon = async (couponData: any, id?: number) => {
    setIsSaving(true);
    const isEditing = !!id;

    if (isEditing) {
      const idx = allCoupons.findIndex(c => c.id === id);
      if (idx > -1) {
        allCoupons[idx] = {
          ...allCoupons[idx],
          ...couponData,
          status: getCouponStatus({ ...allCoupons[idx], ...couponData }),
        };
      }
    } else {
      const newId = Math.max(...allCoupons.map(c => c.id), 0) + 1;
      const newCoupon: Coupon = {
        id: newId,
        code: couponData.code,
        description: couponData.description || '',
        discount_type: couponData.discount_type || DiscountType.PERCENTAGE,
        discount_value: couponData.discount_value || 0,
        valid_from: couponData.valid_from || new Date().toISOString(),
        valid_until: couponData.valid_until || null,
        scope: couponData.scope || CouponScope.GLOBAL,
        max_uses: couponData.max_uses || null,
        uses_count: 0,
        status: 'vigente',
        customerName: couponData.customerName || null,
      };
      newCoupon.status = getCouponStatus(newCoupon);
      allCoupons.push(newCoupon);
    }

    toast({
      title: isEditing ? '¡Cupón Actualizado!' : '¡Cupón Creado!',
      description: `El cupón ${couponData.code} ha sido guardado.`,
      variant: 'success'
    });
    setIsFormOpen(false);
    setSelectedCoupon(null);
    fetchData();
    setIsSaving(false);
  };

  const statusOptions: CouponStatus[] = ['vigente', 'vencido', 'utilizado'];
  const statusTranslations: { [key in CouponStatus]: string } = {
    'vigente': 'Vigente',
    'vencido': 'Vencido',
    'utilizado': 'Utilizado',
  };

  if (isLoading && coupons.length === 0) {
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
                    onChange={(event) => setFilters(prev => ({...prev, search: event.target.value }))}
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
