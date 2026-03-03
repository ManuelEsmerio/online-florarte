
'use client';

import { useState, useCallback, useMemo, useEffect, useRef, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Upload, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table/data-table';
import { useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel, RowSelectionState, PaginationState, SortingState } from '@tanstack/react-table';
import { DataTableSkeleton } from '@/components/ui/data-table/data-table-skeleton';
import { ShippingZone } from '@/lib/definitions';
import { columns } from './columns';
import { ShippingZoneForm } from './shipping-zone-form';
import { ShippingZonePreview, ShippingZonePreviewSkeleton } from './shipping-zone-preview';

const normalizeField = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export default function ShippingPage() {
  const { toast } = useToast();

  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);
  const [isTogglingId, setIsTogglingId] = useState<number | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<ShippingZone | null>(null);
  const [previewZone, setPreviewZone] = useState<ShippingZone | null>(null);
  const [focusedRowId, setFocusedRowId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  }, [toast]);

  useEffect(() => {
    loadZones();
  }, [loadZones]);

  useEffect(() => {
    if (shippingZones.length === 0) {
      setPreviewZone(null);
      setFocusedRowId(null);
      return;
    }
    setPreviewZone((prev) => {
      if (!prev) return shippingZones[0];
      const match = shippingZones.find((zone) => zone.id === prev.id);
      return match ?? shippingZones[0];
    });
  }, [shippingZones]);

  useEffect(() => {
    if (!previewZone) return;
    const rowId = `zone-${previewZone.id}`;
    if (focusedRowId !== rowId) {
      setFocusedRowId(rowId);
    }
  }, [previewZone, focusedRowId]);

  const handleAdd = () => {
    setSelectedZone(null);
    setIsFormOpen(true);
  };

  const handleEdit = useCallback((zone: ShippingZone) => {
    setSelectedZone(zone);
    setIsFormOpen(true);
  }, []);

  const handleRowPreview = useCallback((zone: ShippingZone) => {
    setPreviewZone(zone);
    setFocusedRowId(`zone-${zone.id}`);
  }, []);

  const handleDelete = useCallback(async (id: number) => {
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
  }, [loadZones, toast]);

  const handleToggleActive = useCallback(async (zone: ShippingZone) => {
    setIsTogglingId(zone.id);
    try {
      const res = await fetch(`/api/admin/shipping/${zone.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !zone.isActive }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'No se pudo actualizar la zona');
      toast({ title: 'Zona actualizada', description: `La zona ahora está ${zone.isActive ? 'inactiva' : 'activa'}.`, variant: 'success' });
      await loadZones();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsTogglingId(null);
    }
  }, [loadZones, toast]);

  const handleSave = useCallback(async (data: Omit<ShippingZone, 'id' | 'createdAt' | 'updatedAt'>, id?: number) => {
    setIsSaving(true);
    const isEditing = Boolean(id);
    try {
      const payload = {
        postalCode: data.postalCode,
        locality: data.locality,
        shippingCost: Number(data.shippingCost),
        isActive: data.isActive ?? true,
        settlementType: normalizeField(data.settlementType),
        municipality: normalizeField(data.municipality),
        state: normalizeField(data.state),
        stateCode: normalizeField(data.stateCode),
        municipalityCode: normalizeField(data.municipalityCode),
        postalOfficeCode: normalizeField(data.postalOfficeCode),
        zone: normalizeField(data.zone),
      };

      const url = isEditing ? `/api/admin/shipping/${id}` : '/api/admin/shipping';
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
  }, [loadZones, toast]);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const res = await fetch('/api/admin/shipping/export');
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message || 'No se pudo generar el archivo.');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `shipping_zones_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  }, [toast]);

  const handleImport = useCallback(async (file: File) => {
    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/shipping/import', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'No se pudo importar el archivo.');
      toast({ title: 'Importación completada', description: json.message ?? 'Se reemplazaron las zonas de envío.', variant: 'success' });
      await loadZones();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [loadZones, toast]);

  const tableColumns = useMemo(() => columns({ onEdit: handleEdit, onDelete: handleDelete, isDeletingId }), [handleDelete, handleEdit, isDeletingId]);

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
    getRowId: (row) => `zone-${row.id}`,
  });

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImport(file);
    }
  };

  const actionButtons = (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        className="rounded-2xl h-11 px-5 font-semibold"
        onClick={handleExport}
        loading={isExporting}
      >
        <Download className="h-4 w-4 mr-2" />
        Exportar CSV
      </Button>
      <Button
        variant="secondary"
        className="rounded-2xl h-11 px-5 font-semibold"
        onClick={() => fileInputRef.current?.click()}
        loading={isImporting}
      >
        <Upload className="h-4 w-4 mr-2" />
        Importar CSV
      </Button>
      <Button onClick={handleAdd} className="rounded-2xl h-11 px-6 font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white transition-all transform hover:-translate-y-1">
        <PlusCircle className="mr-2 h-4 w-4" />
        Agregar Zona
      </Button>
    </div>
  );

  if (isLoading && shippingZones.length === 0) {
    return (
      <div className="flex-1 space-y-8 p-6 md:p-10 pt-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
          <h2 className="text-4xl font-bold font-headline tracking-tight text-slate-900 dark:text-white">Zonas de Envío</h2>
          {actionButtons}
        </div>
        <div className="flex flex-col xl:flex-row gap-6 min-h-[calc(100vh-230px)]">
          <div className="flex-1 min-w-0"><DataTableSkeleton columnCount={7} className="h-full" /></div>
          <div className="hidden xl:block w-px bg-border/40" />
          <aside className="w-full xl:w-[32%]"><ShippingZonePreviewSkeleton /></aside>
        </div>
        <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileInputChange} />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 pt-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
        <h2 className="text-4xl font-bold font-headline tracking-tight text-slate-900 dark:text-white">Zonas de Envío</h2>
        {actionButtons}
      </div>

      <ShippingZoneForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSave}
        zone={selectedZone}
        isSaving={isSaving}
      />

      <div className="flex flex-col xl:flex-row gap-6 min-h-[calc(100vh-230px)]">
        <div className="flex-1 min-w-0">
          <DataTable
            table={table}
            columns={tableColumns}
            data={shippingZones}
            isLoading={isLoading}
            onRowClick={handleRowPreview}
            selectedRowId={focusedRowId}
            className="h-full"
          />
        </div>
        <div className="hidden xl:block w-px bg-border/40" />
        <aside className="w-full xl:w-[32%]">
          <ShippingZonePreview
            zone={previewZone}
            onEdit={handleEdit}
            onToggleActive={handleToggleActive}
            onDelete={(zone) => handleDelete(zone.id)}
            isToggling={isTogglingId === (previewZone?.id ?? null)}
            isDeleting={isDeletingId === (previewZone?.id ?? null)}
          />
        </aside>
      </div>

      <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileInputChange} />
    </div>
  );
}
