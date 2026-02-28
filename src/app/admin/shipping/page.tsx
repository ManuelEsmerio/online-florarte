
'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table/data-table';
import { useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel, RowSelectionState, PaginationState, SortingState } from '@tanstack/react-table';
import { DataTableSkeleton } from '@/components/ui/data-table/data-table-skeleton';
import { ShippingZone } from '@/lib/definitions';
import { columns } from './columns';
import { ShippingZoneForm } from './shipping-zone-form';


export default function ShippingPage() {
  const { toast } = useToast();

  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<ShippingZone | null>(null);

  const [sorting, setSorting] = useState<SortingState>([{ id: 'postalCode', desc: false }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const loadZones = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/shipping');
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Error al cargar zonas de envío');
      setShippingZones(json.data ?? []);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadZones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = () => {
    setSelectedZone(null);
    setIsFormOpen(true);
  };

  const handleEdit = (zone: ShippingZone) => {
    setSelectedZone(zone);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    setIsDeletingId(id);
    try {
      const res = await fetch(`/api/admin/shipping/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Error al eliminar');
      toast({ title: '¡Zona Eliminada!', description: 'La zona de envío ha sido eliminada.', variant: 'success' });
      await loadZones();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleSave = async (data: Omit<ShippingZone, 'id'>, id?: number) => {
    setIsSaving(true);
    const isEditing = !!id;
    try {
      const url = isEditing ? `/api/admin/shipping/${id}` : '/api/admin/shipping';
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postalCode: data.postalCode,
          locality: data.locality,
          shippingCost: data.shippingCost,
          isActive: data.isActive ?? true,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Error al guardar');
      toast({ title: isEditing ? '¡Zona Actualizada!' : '¡Zona Creada!', description: 'La zona de envío ha sido guardada.', variant: 'success' });
      setIsFormOpen(false);
      await loadZones();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const tableColumns = useMemo(() => columns({ onEdit: handleEdit, onDelete: handleDelete, isDeletingId }), [isDeletingId]);

  const table = useReactTable({
    data: shippingZones,
    columns: tableColumns,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { pagination, sorting, rowSelection },
  });

  if (isLoading && shippingZones.length === 0) {
    return (
      <div className="flex-1 space-y-8 p-6 md:p-10 pt-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
          <h2 className="text-4xl font-bold font-headline tracking-tight text-slate-900 dark:text-white">Zonas de Envío</h2>
          <Button disabled className="rounded-2xl h-11 px-6 font-bold shadow-lg shadow-primary/20"><PlusCircle className="mr-2 h-4 w-4" />Agregar Zona</Button>
        </div>
        <DataTableSkeleton columnCount={4} />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 pt-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
        <h2 className="text-4xl font-bold font-headline tracking-tight text-slate-900 dark:text-white">Zonas de Envío</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={handleAdd} className="rounded-2xl h-11 px-6 font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white transition-all transform hover:-translate-y-1">
            <PlusCircle className="mr-2 h-4 w-4" />
            Agregar Zona
          </Button>
        </div>
      </div>
      <ShippingZoneForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSave}
        zone={selectedZone}
        isSaving={isSaving}
      />
      <DataTable table={table} columns={tableColumns} data={shippingZones} isLoading={isLoading} />
    </div>
  );
}
