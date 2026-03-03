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

import { allProducts } from '@/lib/data/product-data';
import { allOrders } from '@/lib/data/order-data';
import { allUsers } from '@/lib/data/user-data';
import { allCoupons } from '@/lib/data/coupon-data';
import { productCategories } from '@/lib/data/categories-data';
import { allTags } from '@/lib/data/tag-data';
import { allOccasions } from '@/lib/data/occasion-data';
import { allShippingZones } from '@/lib/data/shipping-zones';

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

function escapeCSV(value: unknown): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

function toCSV(rows: Record<string, unknown>[]): string {
    if (rows.length === 0) return '';
    const headers = Object.keys(rows[0]);
    const lines = [
        headers.join(','),
        ...rows.map(row => headers.map(h => escapeCSV(row[h])).join(',')),
    ];
    return lines.join('\n');
}

function isInRange(dateStr: string | Date | undefined | null, from: Date | undefined, to: Date | undefined): boolean {
    if (!from) return true;
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const end = to ?? from;
    return d >= from && d <= end;
}

function getRows(dataType: string, dateRange: DateRange | undefined): Record<string, unknown>[] {
    const from = dateRange?.from;
    const to = dateRange?.to;

    switch (dataType) {
        case 'products':
            return allProducts.map(p => ({
                id: p.id,
                nombre: p.name,
                codigo: p.code,
                slug: p.slug,
                precio: p.price,
                precio_oferta: p.sale_price ?? '',
                stock: p.stock,
                estado: p.status,
                categoria: p.category?.name ?? '',
                creado_en: p.created_at ?? '',
            }));

        case 'orders':
            return allOrders
                .filter(o => isInRange(o.created_at, from, to))
                .map(o => ({
                    id: o.id,
                    cliente: o.customerName,
                    email: o.customerEmail,
                    estado: o.status,
                    subtotal: o.subtotal,
                    envio: o.shipping_cost,
                    total: o.total,
                    fecha_entrega: o.delivery_date ?? '',
                    creado_en: o.created_at,
                }));

        case 'users':
            return allUsers
                .filter(u => !u.is_deleted)
                .filter(u => isInRange((u as any).created_at, from, to))
                .map(u => ({
                    id: u.id,
                    nombre: u.name,
                    email: u.email,
                    telefono: u.phone ?? '',
                    rol: u.role,
                    puntos_fidelidad: u.loyalty_points ?? 0,
                    creado_en: (u as any).created_at ?? '',
                }));

        case 'coupons':
            return allCoupons
                .filter(c => isInRange(c.created_at, from, to))
                .map(c => ({
                    id: c.id,
                    codigo: c.code,
                    tipo_descuento: c.discount_type,
                    valor_descuento: c.discount_value,
                    min_compra: c.min_purchase_amount ?? '',
                    max_usos: c.max_uses ?? '',
                    usos: c.times_used,
                    activo: c.is_active ? 'sí' : 'no',
                    inicio: c.start_date ?? '',
                    fin: c.end_date ?? '',
                    creado_en: c.created_at ?? '',
                }));

        case 'categories':
            return productCategories.map(c => ({
                id: c.id,
                nombre: c.name,
                slug: c.slug,
                prefijo: c.prefix ?? '',
                descripcion: c.description ?? '',
                padre_id: c.parent_id ?? '',
                mostrar_en_inicio: c.show_on_home ? 'sí' : 'no',
            }));

        case 'tags':
            return allTags.map(t => ({
                id: t.id,
                nombre: t.name,
            }));

        case 'occasions':
            return allOccasions.map(o => ({
                id: o.id,
                nombre: o.name,
                slug: o.slug,
                descripcion: o.description ?? '',
                mostrar_en_inicio: o.show_on_home ? 'sí' : 'no',
            }));

        case 'shipping_zones':
            return allShippingZones.map((z: any) => ({
                id: z.id,
                codigo_postal: z.postal_code,
                localidad: z.locality,
                costo_envio: z.shipping_cost,
            }));

        default:
            return [];
    }
}

export default function ExportPage() {
    const { toast } = useToast();
    const [dataType, setDataType] = useState<string>('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = () => {
        if (!dataType) {
            toast({ title: 'Selección requerida', description: 'Por favor, elige qué datos quieres exportar.', variant: 'info' });
            return;
        }
        setIsExporting(true);
        try {
            const rows = getRows(dataType, dateRange);
            if (rows.length === 0) {
                toast({ title: 'Sin datos', description: 'No hay registros que coincidan con el filtro seleccionado.', variant: 'info' });
                return;
            }
            const csv = toCSV(rows);
            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `export_${dataType}_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
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
