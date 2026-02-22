// src/app/admin/export/page.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileDown, Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

const exportOptions = [
  { value: 'products', label: 'Productos' },
  { value: 'orders', label: 'Pedidos' },
  { value: 'users', label: 'Usuarios' },
  { value: 'coupons', label: 'Cupones' },
  { value: 'categories', label: 'Categorías' },
  { value: 'tags', label: 'Etiquetas' },
  { value: 'occasions', label: 'Ocasiones' },
  { value: 'shipping_zones', label: 'Zonas de Envío' },
];

const DateRangePicker = ({ date, setDate, className }: { date: DateRange | undefined, setDate: (date: DateRange | undefined) => void, className?: string }) => {
    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
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
                            <span>Filtrar por fecha...</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
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
    );
};

export default function ExportPage() {
    const { apiFetch } = useAuth();
    const { toast } = useToast();
    const [dataType, setDataType] = useState<string>('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        if (!dataType) {
            toast({ title: 'Selección requerida', description: 'Por favor, elige qué datos quieres exportar.', variant: 'info' });
            return;
        }
        setIsExporting(true);
        try {
            const params = new URLSearchParams();
            params.append('dataType', dataType);
            if (dateRange?.from) params.append('from', dateRange.from.toISOString());
            if (dateRange?.to) params.append('to', dateRange.to.toISOString());

            const res = await apiFetch(`/api/admin/export?${params.toString()}`);

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'No se pudo generar el archivo.');
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `export_${dataType}_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            toast({ title: '¡Éxito!', description: 'La descarga de tu archivo ha comenzado.', variant: 'success' });
        } catch (error: any) {
            toast({ title: 'Error de exportación', description: error.message, variant: 'destructive' });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Exportar Datos</h2>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Generar Reporte en CSV</CardTitle>
                    <CardDescription>
                        Selecciona el tipo de datos y un rango de fechas (opcional) para generar y descargar un archivo CSV.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="max-w-md space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tipo de Dato a Exportar</label>
                            <Select onValueChange={setDataType} value={dataType}>
                                <SelectTrigger><SelectValue placeholder="Selecciona una opción..." /></SelectTrigger>
                                <SelectContent>
                                    {exportOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Rango de Fechas (Opcional)</label>
                            <DateRangePicker date={dateRange} setDate={setDateRange} />
                        </div>
                        <Button onClick={handleExport} loading={isExporting} className="w-full">
                            <FileDown className="mr-2 h-4 w-4" />
                            Exportar a CSV
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
