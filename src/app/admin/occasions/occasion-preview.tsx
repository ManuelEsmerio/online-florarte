import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Occasion } from '@/lib/definitions';
import { CalendarDays, Home, Pencil, Sparkles, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OccasionPreviewProps {
  occasion: Occasion | null;
  onEdit: (occasion: Occasion) => void;
  onToggleShowOnHome: (occasion: Occasion) => void;
  onDelete: (occasion: Occasion) => void;
  isToggling: boolean;
  isDeleting: boolean;
}

const formatDate = (value?: Date | string | null) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
};

export function OccasionPreview({ occasion, onEdit, onToggleShowOnHome, onDelete, isToggling, isDeleting }: OccasionPreviewProps) {
  if (!occasion) {
    return (
      <div className="rounded-[30px] border border-border/60 bg-background/90 dark:bg-zinc-900/60 p-8 shadow-xl text-center text-muted-foreground">
        <p className="text-sm">Selecciona una ocasión en la tabla para ver los detalles.</p>
      </div>
    );
  }

  const infoRows = [
    { label: 'Slug', value: occasion.slug },
    { label: 'Estado', value: occasion.showOnHome ? 'En portada' : 'Solo catálogo' },
    { label: 'Actualización', value: formatDate(occasion.updatedAt) },
    { label: 'Creación', value: formatDate(occasion.createdAt) },
  ];

  return (
    <div className="rounded-[30px] border border-border/60 bg-background/95 dark:bg-zinc-900/60 p-6 shadow-xl space-y-6">
      <div className="relative h-48 w-full overflow-hidden rounded-3xl border border-border/40 bg-muted/40">
        {occasion.imageUrl ? (
          <Image
            src={occasion.imageUrl}
            alt={occasion.name}
            fill
            sizes="(max-width: 768px) 100vw, 320px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">Sin imagen</div>
        )}
        <Sparkles className="absolute top-4 right-4 h-6 w-6 text-primary drop-shadow" />
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.4em] text-muted-foreground">Ocasión</p>
          <h3 className="text-3xl font-black mt-1">{occasion.name}</h3>
          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
            <CalendarDays className="h-4 w-4" />
            {occasion.description?.slice(0, 60) || 'Sin descripción'}
          </p>
        </div>
        <Badge variant={occasion.showOnHome ? 'success' : 'secondary'} className="px-3 py-1 rounded-full text-[11px]">
          {occasion.showOnHome ? 'Visible en Home' : 'Oculta del Home'}
        </Badge>
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground mb-1">Descripción</p>
        <p className="text-sm leading-relaxed text-foreground/80">
          {occasion.description?.trim() || 'Sin descripción registrada.'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {infoRows.map((row) => (
          <div key={row.label} className="rounded-2xl border border-border/40 bg-background/60 px-4 py-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.25em]">{row.label}</span>
            <span className={cn('text-sm font-medium truncate', row.label === 'Estado' && occasion.showOnHome && 'text-success font-semibold')}>
              {row.value}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button className="w-full h-11 rounded-2xl" onClick={() => onEdit(occasion)}>
          <Pencil className="h-4 w-4 mr-2" />
          Editar
        </Button>
        <Button
          variant={occasion.showOnHome ? 'secondary' : 'outline'}
          className="w-full h-11 rounded-2xl"
          onClick={() => onToggleShowOnHome(occasion)}
          loading={isToggling}
        >
          <Home className="h-4 w-4 mr-2" />
          {occasion.showOnHome ? 'Ocultar de Home' : 'Mostrar en Home'}
        </Button>
      </div>

      <Button
        variant="ghost"
        className="w-full h-11 rounded-2xl text-destructive hover:text-destructive flex items-center justify-center gap-2"
        onClick={() => onDelete(occasion)}
        disabled={isDeleting}
      >
        <Trash2 className="h-4 w-4" />
        {isDeleting ? 'Eliminando…' : 'Eliminar ocasión'}
      </Button>
    </div>
  );
}

export function OccasionPreviewSkeleton() {
  return (
    <div className="rounded-[30px] border border-border/60 bg-background/90 dark:bg-zinc-900/60 p-6 shadow-xl space-y-6">
      <Skeleton className="h-48 w-full rounded-3xl" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="h-20 w-full rounded-2xl" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Skeleton className="h-11 w-full rounded-2xl" />
        <Skeleton className="h-11 w-full rounded-2xl" />
      </div>
      <Skeleton className="h-11 w-full rounded-2xl" />
    </div>
  );
}
