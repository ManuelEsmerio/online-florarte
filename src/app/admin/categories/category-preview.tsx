import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { ProductCategory } from '@/lib/definitions';
import { Home, Layers, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryPreviewProps {
  category: ProductCategory | null;
  onEdit: (category: ProductCategory) => void;
  onToggleShowOnHome: (category: ProductCategory) => void;
  onDelete: (category: ProductCategory) => void;
  isToggling: boolean;
  isDeleting: boolean;
  parentName?: string;
}

const formatDate = (value?: Date | string | null) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
};

export function CategoryPreview({ category, onEdit, onToggleShowOnHome, onDelete, isToggling, isDeleting, parentName }: CategoryPreviewProps) {
  if (!category) {
    return (
      <div className="rounded-[30px] border border-border/60 bg-background/90 dark:bg-zinc-900/60 p-8 shadow-xl text-center text-muted-foreground">
        <p className="text-sm">Selecciona una categoría en la tabla para ver su resumen.</p>
      </div>
    );
  }

  const infoRows = [
    { label: 'Prefijo', value: category.prefix || '—' },
    { label: 'Slug', value: category.slug },
    { label: 'Estado', value: category.showOnHome ? 'Visible en Home' : 'Solo catálogo' },
    { label: 'Última actualización', value: formatDate(category.updatedAt) },
  ];

  return (
    <div className="rounded-[30px] border border-border/60 bg-background/95 dark:bg-zinc-900/60 p-6 shadow-xl space-y-6">
      <div className="relative h-48 w-full overflow-hidden rounded-3xl border border-border/40 bg-muted/40">
        {category.imageUrl ? (
          <Image
            src={category.imageUrl}
            alt={category.name}
            fill
            sizes="(max-width: 768px) 100vw, 320px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">Sin imagen</div>
        )}
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.4em] text-muted-foreground">Categoría</p>
          <h3 className="text-3xl font-black mt-1">{category.name}</h3>
          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
            <Layers className="h-4 w-4" />
            {category.parentId ? `Subcategoría de ${parentName || 'categoría principal'}` : 'Categoría principal'}
          </p>
        </div>
        <Badge variant={category.showOnHome ? 'success' : 'secondary'} className="px-3 py-1 rounded-full text-[11px]">
          {category.showOnHome ? 'En portada' : 'Oculta del Home'}
        </Badge>
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground mb-1">Descripción</p>
        <p className="text-sm leading-relaxed text-foreground/80">
          {category.description?.trim() || 'Sin descripción registrada.'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {infoRows.map((row) => (
          <div key={row.label} className="rounded-2xl border border-border/40 bg-background/60 px-4 py-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.25em]">{row.label}</span>
            <span className={cn('text-sm font-medium truncate', row.label === 'Estado' && category.showOnHome && 'text-success font-semibold')}>
              {row.value}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button className="w-full h-11 rounded-2xl" onClick={() => onEdit(category)}>
          <Pencil className="h-4 w-4 mr-2" />
          Editar
        </Button>
        <Button
          variant={category.showOnHome ? 'secondary' : 'outline'}
          className="w-full h-11 rounded-2xl"
          onClick={() => onToggleShowOnHome(category)}
          loading={isToggling}
        >
          <Home className="h-4 w-4 mr-2" />
          {category.showOnHome ? 'Ocultar de Home' : 'Mostrar en Home'}
        </Button>
      </div>

      <Button
        variant="ghost"
        className="w-full h-11 rounded-2xl text-destructive hover:text-destructive flex items-center justify-center gap-2"
        onClick={() => onDelete(category)}
        disabled={isDeleting}
      >
        <Trash2 className="h-4 w-4" />
        {isDeleting ? 'Eliminando…' : 'Eliminar categoría'}
      </Button>
    </div>
  );
}

export function CategoryPreviewSkeleton() {
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
