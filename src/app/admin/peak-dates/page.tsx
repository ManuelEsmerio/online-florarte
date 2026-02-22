
// src/app/admin/peak-dates/page.tsx

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table/data-table';
import { useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel, RowSelectionState, PaginationState, SortingState } from '@tanstack/react-table';
import { DataTableSkeleton } from '@/components/ui/data-table/data-table-skeleton';
import { PeakDate } from '@/lib/definitions';
import { columns } from './columns';
import { PeakDateForm } from './peak-date-form';
import { useAuth } from '@/context/AuthContext';
import { handleApiResponse } from '@/utils/handleApiResponse';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn, parseToUTCDate } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';


const DateRangePicker = ({
    date,
    setDate,
    className
} : {
    date: DateRange | undefined,
    setDate: (date: DateRange | undefined) => void,
    className?: string
}) => {
    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                    "w-[280px] justify-start text-left font-bold h-10 rounded-xl border-none bg-background shadow-sm text-muted-foreground",
                    date && "text-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                    {date?.from ? (
                    date.to ? (
                        <>
                        {format(date.from, "LLL dd, y", { locale: es })} -{" "}
                        {format(date.to, "LLL dd, y", { locale: es })}
                        </>
                    ) : (
                        format(date.from, "LLL dd, y", { locale: es })
                    )
                    ) : (
                    <span>Filtrar por rango de fechas...</span>
                    )}
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-3xl border-none shadow-2xl" align="start">
                <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                    locale={es}
                />
                </PopoverContent>
            </Popover>
        </div>
    )
}

export default function PeakDatesPage() {
  const { toast } = useToast();
  const { apiFetch } = useAuth();
  const [allPeakDates, setAllPeakDates] = useState<PeakDate[]>([]);
  const [filteredPeakDates, setFilteredPeakDates] = useState<PeakDate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);
  const [updatingRestrictionId, setUpdatingRestrictionId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPeakDate, setSelectedPeakDate] = useState<PeakDate | null>(null);
  const fetchInitiated = useRef(false);

  const [sorting, setSorting] = useState<SortingState>([{ id: 'peak_date', desc: true }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
        const res = await apiFetch('/api/admin/peak-dates');
        const data = await handleApiResponse(res, []);
        setAllPeakDates(data);
    } catch(err: any) {
        toast({ title: 'Error', description: err.message, variant: 'destructive'});
    } finally {
        setIsLoading(false);
    }
  }, [apiFetch, toast]);

  useEffect(() => {
    if (!fetchInitiated.current) {
        fetchInitiated.current = true;
        fetchData();
    }
  }, [fetchData]);

  useEffect(() => {
    let filteredData = allPeakDates;
    if (dateRange?.from) {
        filteredData = filteredData.filter(peakDate => {
            const date = parseToUTCDate(peakDate.peak_date);
            if (!date) return false;
            const from = dateRange.from!;
            const to = dateRange.to ?? from;
            return date >= from && date <= to;
        });
    }
    setFilteredPeakDates(filteredData);
  }, [allPeakDates, dateRange]);


  const handleAdd = () => {
    setSelectedPeakDate(null);
    setIsFormOpen(true);
  };

  const handleEdit = (peakDate: PeakDate) => {
    setSelectedPeakDate(peakDate);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    setIsDeletingId(id);
     try {
      const res = await apiFetch(`/api/admin/peak-dates/${id}`, { method: 'DELETE' });
      await handleApiResponse(res);
      toast({ title: '¡Fecha Pico Eliminada!', description: 'El registro se ha eliminado correctamente.' });
      await fetchData();
    } catch (error: any) {
      toast({ title: 'Error al eliminar', description: error.message, variant: 'destructive' });
    } finally {
      setIsDeletingId(null);
    }
  };
  
  const handleSave = async (data: any, id?: number) => {
    setIsSaving(true);
    const isEditing = !!id;
    
    // Convert date object to YYYY-MM-DD string
    const finalData = {
        ...data,
        peak_date: format(data.peak_date, 'yyyy-MM-dd'),
    }

    const url = isEditing ? `/api/admin/peak-dates/${id}` : '/api/admin/peak-dates';
    const method = isEditing ? 'PUT' : 'POST';
    
    try {
        const res = await apiFetch(url, { 
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalData) 
        });
        await handleApiResponse(res);
        toast({ title: isEditing ? '¡Fecha Pico Actualizada!' : '¡Fecha Pico Creada!', description: 'El registro ha sido guardado.'});
        setIsFormOpen(false);
        await fetchData();
    } catch (error: any) {
        toast({ title: 'Error al guardar', description: error.message, variant: 'destructive' });
    } finally {
        setIsSaving(false);
    }
  };

  const handleToggleRestriction = useCallback(async (peakDate: PeakDate) => {
    setUpdatingRestrictionId(peakDate.id);
    const updatedData = { 
      ...peakDate,
      is_coupon_restricted: !peakDate.is_coupon_restricted 
    };
    try {
        const res = await apiFetch(`/api/admin/peak-dates/${peakDate.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });
        await handleApiResponse(res);
        toast({ title: '¡Actualizado!', description: `La restricción de cupones para ${peakDate.name} ha sido cambiada.`, variant: 'success' });
        await fetchData();
    } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
        setUpdatingRestrictionId(null);
    }
  }, [apiFetch, toast, fetchData]);

  const tableColumns = useMemo(
      () => columns({ onEdit: handleEdit, onDelete: handleDelete, onToggleRestriction: handleToggleRestriction, isDeletingId, updatingRestrictionId }), 
      [handleEdit, handleDelete, isDeletingId, updatingRestrictionId, handleToggleRestriction]
  );


  const table = useReactTable({
    data: filteredPeakDates,
    columns: tableColumns,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { pagination, sorting, rowSelection },
  });

  if (isLoading && allPeakDates.length === 0) {
    return (
      <div className="flex-1 space-y-8 p-6 md:p-10 pt-6">
        <div className="flex items-center justify-between">
            <h2 className="text-4xl font-bold font-headline tracking-tight text-slate-900 dark:text-white">Fechas Pico</h2>
            <Button disabled className="rounded-2xl h-11 px-6 font-bold shadow-lg shadow-primary/20"><PlusCircle className="mr-2 h-4 w-4" />Agregar Fecha Pico</Button>
        </div>
        <DataTableSkeleton columnCount={5} />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 pt-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
        <h2 className="text-4xl font-bold font-headline tracking-tight text-slate-900 dark:text-white">Fechas Pico</h2>
        <Button onClick={handleAdd} className="rounded-2xl h-11 px-6 font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white transition-all transform hover:-translate-y-1">
          <PlusCircle className="mr-2 h-4 w-4" />
          Agregar Fecha Pico
        </Button>
      </div>
      <PeakDateForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSave}
        peakDate={selectedPeakDate}
        allPeakDates={allPeakDates}
        isSaving={isSaving}
      />
      <DataTable 
        table={table} 
        columns={tableColumns} 
        data={filteredPeakDates} 
        isLoading={isLoading} 
        toolbar={<DateRangePicker date={dateRange} setDate={setDateRange} />}
      />
    </div>
  );
}
