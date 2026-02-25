
'use client';

import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table/data-table';
import { useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel, RowSelectionState, PaginationState, SortingState } from '@tanstack/react-table';
import { DataTableSkeleton } from '@/components/ui/data-table/data-table-skeleton';
import { ShippingZone } from '@/lib/definitions';
import { columns } from './columns';
import { ShippingZoneForm } from './shipping-zone-form';
import { allShippingZones } from '@/lib/data/shipping-zones';


export default function ShippingPage() {
  const { toast } = useToast();

  const [shippingZones, setShippingZones] = useState<ShippingZone[]>(() => [...allShippingZones]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<ShippingZone | null>(null);

  const [sorting, setSorting] = useState<SortingState>([{ id: 'postalCode', desc: false }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const handleAdd = () => {
    setSelectedZone(null);
    setIsFormOpen(true);
  };

  const handleEdit = (zone: ShippingZone) => {
    setSelectedZone(zone);
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    setIsDeletingId(id);
    setShippingZones(prev => prev.filter(z => z.id !== id));
    // Sincronizar fuente mock
    const idx = allShippingZones.findIndex(z => z.id === id);
    if (idx > -1) allShippingZones.splice(idx, 1);
    toast({ title: '¡Zona Eliminada!', description: 'La zona de envío ha sido eliminada.', variant: 'success' });
    setIsDeletingId(null);
  };

  const handleSave = async (data: Omit<ShippingZone, 'id'>, id?: number) => {
    setIsSaving(true);
    const isEditing = !!id;

    if (isEditing) {
      const updated: ShippingZone = { id: id!, ...data };
      setShippingZones(prev => prev.map(z => z.id === id ? updated : z));
      // Sincronizar fuente mock
      const idx = allShippingZones.findIndex(z => z.id === id);
      if (idx > -1) {
        allShippingZones[idx] = { id: id!, postal_code: data.postalCode, locality: data.locality, shipping_cost: data.shippingCost } as any;
      }
    } else {
      const newId = Math.max(...shippingZones.map(z => z.id), 0) + 1;
      const newZone: ShippingZone = { id: newId, ...data };
      setShippingZones(prev => [...prev, newZone]);
      allShippingZones.push({ id: newId, postal_code: data.postalCode, locality: data.locality, shipping_cost: data.shippingCost } as any);
    }

    toast({ title: isEditing ? '¡Zona Actualizada!' : '¡Zona Creada!', description: 'La zona de envío ha sido guardada.', variant: 'success' });
    setIsFormOpen(false);
    setIsSaving(false);
  };

  const tableColumns = useMemo(() => columns({ onEdit: handleEdit, onDelete: handleDelete, isDeletingId }), [handleEdit, handleDelete, isDeletingId]);

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
      <DataTable table={table} columns={tableColumns} data={shippingZones} isLoading={false} />
    </div>
  );
}
