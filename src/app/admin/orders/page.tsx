'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { columns } from './columns';
import type { AdminOrderDetailsDTO, AdminOrderListDTO, OrderStatus } from '@/lib/definitions';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
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
import { useAuth } from '@/context/AuthContext';
import { OrderDetailsDialog } from '../../../components/admin/orders/OrderDetailsDialog';

const EMPTY_DRIVERS: any[] = [];

const normalizeAdminStatus = (value: unknown): OrderStatus => {
  const raw = String(value ?? 'PENDING')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[^A-Z_]/g, '');

  const map: Record<string, OrderStatus> = {
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    SHIPPED: 'SHIPPED',
    DELIVERED: 'DELIVERED',
    CANCELLED: 'CANCELLED',
    PENDIENTE: 'PENDING',
    PROCESANDO: 'PROCESSING',
    ENPROCESO: 'PROCESSING',
    ENREPARTO: 'SHIPPED',
    ENCAMINO: 'SHIPPED',
    COMPLETADO: 'DELIVERED',
    CANCELADO: 'CANCELLED',
  };

  return map[raw] ?? 'PENDING';
};

const mapAdminOrderDetails = (payload: any, fallbackItems?: any[]): AdminOrderDetailsDTO => {
  const status = normalizeAdminStatus(payload.status ?? payload.orderStatus);
  const rawItems = Array.isArray(payload.items) && payload.items.length > 0
    ? payload.items
    : Array.isArray(payload.orderItems) && payload.orderItems.length > 0
      ? payload.orderItems
      : Array.isArray(fallbackItems)
        ? fallbackItems
        : [];
  const items = rawItems.map((item: any) => ({
    productId: Number(item.productId ?? item.product_id ?? 0),
    quantity: Number(item.quantity ?? 0),
    unitPrice: Number(item.unitPrice ?? item.unit_price ?? item.price ?? 0),
    productNameSnap: item.productNameSnap ?? item.product_name ?? 'Producto',
    variantNameSnap: item.variantNameSnap ?? item.variant_name ?? null,
    imageSnap:
      item.imageSnap ??
      item.image ??
      item.product?.mainImage ??
      item.product?.main_image ??
      '',
    customPhotoUrl: item.customPhotoUrl ?? item.custom_photo_url ?? null,
  }));

  return {
    id: Number(payload.id),
    userId: payload.userId ?? payload.user_id ?? null,
    isGuest: Boolean(payload.isGuest ?? payload.is_guest ?? false),
    guestName: payload.guestName ?? payload.guest_name ?? null,
    guestEmail: payload.guestEmail ?? payload.guest_email ?? null,
    guestPhone: payload.guestPhone ?? payload.guest_phone ?? null,
    deliveryDriverId: payload.deliveryDriverId ?? payload.delivery_driver_id ?? null,
    status,
    subtotal: Number(payload.subtotal ?? 0),
    couponDiscount: Number(payload.couponDiscount ?? payload.coupon_discount ?? 0),
    shippingCost: Number(payload.shippingCost ?? payload.shipping_cost ?? 0),
    total: Number(payload.total ?? 0),
    deliveryDate: String(payload.deliveryDate ?? payload.delivery_date ?? ''),
    deliveryTimeSlot: String(payload.deliveryTimeSlot ?? payload.delivery_time_slot ?? ''),
    deliveryNotes: payload.deliveryNotes ?? payload.delivery_notes ?? '',
    createdAt: String(payload.createdAt ?? payload.created_at ?? ''),
    updatedAt: payload.updatedAt ? String(payload.updatedAt) : (payload.updated_at ? String(payload.updated_at) : undefined),
    customerName:
      payload.customerName ??
      payload.customer_name ??
      payload.user?.name ??
      payload.guestName ??
      payload.guest_name ??
      'Cliente invitado',
    customerEmail:
      payload.customerEmail ??
      payload.customer_email ??
      payload.user?.email ??
      payload.guestEmail ??
      payload.guest_email ??
      '',
    customerPhone:
      payload.customerPhone ??
      payload.customer_phone ??
      payload.user?.phone ??
      payload.guestPhone ??
      payload.guest_phone ??
      null,
    recipientName: payload.recipientName ?? payload.recipient_name ?? null,
    recipientPhone: payload.recipientPhone ?? payload.recipient_phone ?? null,
    shippingAddress: payload.shippingAddress ?? payload.shipping_address_snapshot ?? payload.shipping_address ?? '',
    deliveryDriverName: payload.deliveryDriverName ?? payload.delivery_driver_name ?? payload.deliveryDriver?.name ?? null,
    paymentGateway: payload.paymentGateway ?? payload.payment_gateway ?? null,
    paymentStatus: payload.paymentStatus ?? payload.payment_status ?? null,
    hasPaymentTransaction: Boolean(payload.hasPaymentTransaction ?? payload.has_payment_transaction ?? false),
    items,
    couponId: payload.couponId ?? payload.coupon_id ?? null,
    couponCodeSnap: payload.couponCodeSnap ?? payload.coupon_code ?? payload.coupon_code_snap ?? null,
    couponType: payload.couponType ?? payload.coupon_type ?? null,
    couponValue: payload.couponValue ?? payload.coupon_value ?? null,
    dedication: payload.dedication ?? null,
    isAnonymous: Boolean(payload.isAnonymous ?? payload.is_anonymous ?? false),
    signature: payload.signature ?? null,
  };
};

export default function OrdersPage() {
  const { apiFetch } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<AdminOrderListDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const apiFetchRef = useRef(apiFetch);
  const toastRef = useRef(toast);
  const ordersRef = useRef<AdminOrderListDTO[]>([]);
  
  const [sorting, setSorting] = useState<SortingState>([{ id: 'id', desc: true }]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [isSendingUpdateFor, setIsSendingUpdateFor] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderDetailsDTO | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

const fetchOrders = useCallback(async () => {
  setIsLoading(true);

  try {
    const response = await apiFetchRef.current('/api/admin/orders?limit=200');
    const result = await response.json();

    if (!response.ok || !result?.success) {
      throw new Error(result?.message || 'No se pudieron cargar los pedidos');
    }

    const fetched = (result.data?.orders ?? []).map((order: any) =>
      mapAdminOrderDetails(order, Array.isArray(order.items) ? order.items : order.orderItems),
    ) as AdminOrderListDTO[];
    setOrders(fetched);
    ordersRef.current = fetched;
  } catch (error: any) {
    toastRef.current({
      title: 'Error al cargar pedidos',
      description: error?.message || 'Ocurrió un problema al obtener los pedidos.',
      variant: 'destructive',
    });
    setOrders([]);
  } finally {
    setIsLoading(false);
  }
}, []); // ✅ SIN DEPENDENCIAS
  
  const columnFilters = useMemo(() => {
     return statusFilter.length > 0 ? [{ id: 'status', value: statusFilter }] : [];
  }, [statusFilter]);

  const deliveryDrivers = useMemo(() => {
      return [];
  }, []);

  const handleUpdateStatus = useCallback(
    async (orderId: number, newStatus: OrderStatus, payload: any) => {
      try {
        const response = await apiFetchRef.current(`/api/admin/orders/${orderId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: newStatus,
            deliveryDriverId: payload?.deliveryDriverId,
            deliveryNotes: payload?.deliveryNotes,
          }),
        });

        const result = await response.json();

        if (!response.ok || !result?.success) {
          throw new Error(result?.message);
        }

        toastRef.current({
          title: '¡Estado actualizado!',
          description: `Pedido actualizado correctamente.`,
          variant: 'success',
        });

        // ✅ update local ONLY
        setOrders(prev => {
          const next = prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
          ordersRef.current = next;
          return next;
        });
        setSelectedOrder(prev => prev?.id === orderId ? { ...prev, status: newStatus } : prev);

      } catch (error: any) {
        toastRef.current({
          title: 'Error al actualizar estado',
          description: error?.message,
          variant: 'destructive',
        });
      }
    },
    [] // 🚨 SIN DEPENDENCIAS
  );

  const handleCancelOrder = useCallback(
    (orderId: number) => {
      handleUpdateStatus(orderId, 'CANCELLED', {});
    },
    [handleUpdateStatus]
  );

  const handleSendUpdate = useCallback(async (order: AdminOrderListDTO) => {
    setIsSendingUpdateFor(order.id);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toastRef.current({ title: 'Correo enviado (Simulación)', description: `Actualización enviada a ${order.customerEmail || 'cliente'}`, variant: 'success' });
    setIsSendingUpdateFor(null);
  }, []);

  const handleViewDetails = useCallback(async (orderId: number) => {
    const cached = ordersRef.current.find(o => o.id === orderId) ?? null;

    if (cached) {
      setSelectedOrder(mapAdminOrderDetails(cached));
      setIsDetailsOpen(true);
    }

    try {
      const response = await apiFetchRef.current(`/api/admin/orders/${orderId}`);
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'No se pudo cargar el pedido');
      }

      const detailed = mapAdminOrderDetails(
        result.data ?? {},
        Array.isArray(result.data?.items)
          ? result.data.items
          : Array.isArray(result.data?.orderItems)
            ? result.data.orderItems
            : undefined,
      );

      setSelectedOrder(detailed);
      setIsDetailsOpen(true);
    } catch (error: any) {
      console.error('[ADMIN_ORDER_DETAILS_FETCH_ERROR]', error);
      toastRef.current({
        title: 'Error al obtener el pedido',
        description: error?.message || 'Intenta de nuevo en unos segundos.',
        variant: 'destructive',
      });

      if (!cached) {
        setIsDetailsOpen(false);
      }
    }
  }, []);
  
  const tableColumns = useMemo(() => columns({ 
    onUpdateStatus: handleUpdateStatus, 
    onCancelOrder: handleCancelOrder, 
    onViewDetails: handleViewDetails,
    deliveryDrivers: EMPTY_DRIVERS,
    onSendUpdate: handleSendUpdate,
    isSendingUpdateFor,
  }), [handleUpdateStatus, handleCancelOrder, handleViewDetails, handleSendUpdate, isSendingUpdateFor]);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => { apiFetchRef.current = apiFetch }, [apiFetch]);
  useEffect(() => { toastRef.current = toast }, [toast]);

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

  const statusOptions: OrderStatus[] = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  const statusTranslations: { [key in OrderStatus]: string } = {
    'PENDING': 'Pendiente',
    'PROCESSING': 'En Proceso',
    'SHIPPED': 'En Reparto',
    'DELIVERED': 'Completado',
    'CANCELLED': 'Cancelado',
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

      <OrderDetailsDialog
        order={selectedOrder}
        isOpen={isDetailsOpen}
        onOpenChange={(open: boolean) => {
          setIsDetailsOpen(open);
          if (!open) setSelectedOrder(null);
        }}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
}
