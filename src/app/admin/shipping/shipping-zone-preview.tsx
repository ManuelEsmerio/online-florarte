import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { ShippingZone } from '@/lib/definitions';
import { cn } from '@/lib/utils';
import { MapPin, Navigation, Shield, Trash2 } from 'lucide-react';

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 2,
});

interface ShippingZonePreviewProps {
  zone: ShippingZone | null;
  onEdit: (zone: ShippingZone) => void;
  onToggleActive: (zone: ShippingZone) => void;
  onDelete: (zone: ShippingZone) => void;
  isToggling: boolean;
  isDeleting: boolean;
}

export function ShippingZonePreview({ zone, onEdit, onToggleActive, onDelete, isToggling, isDeleting }: ShippingZonePreviewProps) {
  if (!zone) {
    return (
      <div className="rounded-[30px] border border-border/50 bg-background/80 dark:bg-zinc-900/50 p-8 text-center text-muted-foreground shadow-xl">
        <p className="text-sm">Selecciona un registro en la tabla para ver un resumen detallado de la zona.</p>
      </div>
    );
  }

  const infoRows = [
    { label: 'Municipio', value: zone.municipality ?? '—' },
    { label: 'Estado', value: zone.state ?? '—' },
    { label: 'Zona logística', value: zone.zone ?? '—' },
    { label: 'Tipo de asentamiento', value: zone.settlementType ?? '—' },
  ];

  const codeRows = [
    { label: 'CP', value: zone.postalCode },
    { label: 'Clave estado', value: zone.stateCode ?? '—' },
    { label: 'Clave municipio', value: zone.municipalityCode ?? '—' },
    { label: 'Clave oficina', value: zone.postalOfficeCode ?? '—' },
  ];

  return (
    <div className="rounded-[30px] border border-border/60 bg-background/90 dark:bg-zinc-900/50 p-6 shadow-xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.4em] text-muted-foreground">Localidad</p>
          <h3 className="text-3xl font-black mt-1">{zone.locality}</h3>
          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
            <MapPin className="h-4 w-4" />
            {zone.municipality ?? '—'}, {zone.state ?? '—'}
          </p>
        </div>
        <Badge variant={zone.isActive ? 'success' : 'secondary'} className="px-3 py-1 rounded-full text-[11px]">
          {zone.isActive ? 'Activa' : 'Inactiva'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border/40 bg-primary/5 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Costo</p>
          <p className="text-2xl font-black mt-1">{currencyFormatter.format(zone.shippingCost)}</p>
        </div>
        <div className="rounded-2xl border border-border/40 bg-muted/40 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Última actualización</p>
          <p className="text-sm font-semibold mt-1">{new Date(zone.updatedAt).toLocaleString('es-MX')}</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Contexto</p>
        <div className="grid grid-cols-1 gap-2">
          {infoRows.map((row) => (
            <div key={row.label} className="rounded-2xl border border-border/40 bg-background/60 px-4 py-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.25em]">{row.label}</span>
              <span className="text-sm font-medium">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Códigos</p>
        <div className="grid grid-cols-2 gap-2">
          {codeRows.map((row) => (
            <div key={row.label} className="rounded-2xl border border-border/40 bg-muted/20 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">{row.label}</p>
              <p className="text-sm font-bold font-mono mt-1">{row.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button className="w-full h-11 rounded-2xl" onClick={() => onEdit(zone)}>
          <Navigation className="h-4 w-4 mr-2" />
          Editar zona
        </Button>
        <Button
          variant="secondary"
          className="w-full h-11 rounded-2xl"
          onClick={() => onToggleActive(zone)}
          loading={isToggling}
        >
          <Shield className="h-4 w-4 mr-2" />
          {zone.isActive ? 'Desactivar' : 'Activar'}
        </Button>
      </div>

      <Button
        variant="ghost"
        className={cn('w-full h-11 rounded-2xl text-destructive hover:text-destructive flex items-center justify-center gap-2', {
          'opacity-60 cursor-not-allowed': isDeleting,
        })}
        onClick={() => onDelete(zone)}
        disabled={isDeleting}
      >
        <Trash2 className="h-4 w-4" />
        {isDeleting ? 'Eliminando...' : 'Eliminar zona'}
      </Button>
    </div>
  );
}

export function ShippingZonePreviewSkeleton() {
  return (
    <div className="rounded-[30px] border border-border/50 bg-background/80 dark:bg-zinc-900/50 p-6 shadow-xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Skeleton className="h-11 w-full rounded-2xl" />
        <Skeleton className="h-11 w-full rounded-2xl" />
      </div>
      <Skeleton className="h-11 w-full rounded-2xl" />
    </div>
  );
}
