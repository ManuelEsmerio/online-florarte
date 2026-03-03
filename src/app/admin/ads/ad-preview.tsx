'use client';

import { AdCard } from '@/components/AdCard';
import { ShippingDateSelector } from '@/components/ShippingDateSelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Announcement } from '@/lib/definitions';
import { CalendarDays, Link2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AdPreviewProps {
  ad: Announcement | null;
}

const formatDateLabel = (value?: Date | string | null) => {
  if (!value) return null;
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return null;
  return format(date, 'PPP', { locale: es });
};

export function AdPreview({ ad }: AdPreviewProps) {
  const startLabel = formatDateLabel(ad?.startAt) ?? 'Disponible inmediatamente';
  const endLabel = formatDateLabel(ad?.endAt) ?? 'Sin fecha de término';

  return (
    <Card className="rounded-[28px] border border-border/60 bg-gradient-to-b from-background to-muted/20 shadow-xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-headline">Vista previa</CardTitle>
        <CardDescription>Así se verá el banner y el módulo de fecha dentro del sitio.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {ad ? (
          <>
            <div className="rounded-3xl border border-border/50 overflow-hidden shadow-inner">
              <AdCard ad={{ ...ad, size: 'double' }} />
            </div>
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase font-semibold tracking-[0.4em] text-muted-foreground">Estado</p>
                  <p className="text-base font-semibold">{ad.isActive ? 'Activo' : 'Inactivo'}</p>
                </div>
                <Badge
                  variant={ad.isActive ? 'default' : 'secondary'}
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                >
                  {ad.isActive ? 'Publicado' : 'Oculto'}
                </Badge>
              </div>
              <div className="flex items-start gap-3">
                <CalendarDays className="h-4 w-4 text-primary mt-1" />
                <div>
                  <p className="text-[10px] uppercase font-semibold tracking-[0.3em] text-muted-foreground">Vigencia</p>
                  <p className="font-semibold">{startLabel}</p>
                  <p className="text-xs text-muted-foreground">Hasta {endLabel}</p>
                </div>
              </div>
              {ad.buttonLink && (
                <div className="flex items-start gap-3">
                  <Link2 className="h-4 w-4 text-primary mt-1" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-semibold tracking-[0.3em] text-muted-foreground">Botón</p>
                    <p className="font-semibold">{ad.buttonText || 'Sin texto asignado'}</p>
                    <p className="text-xs text-muted-foreground truncate">{ad.buttonLink}</p>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>Selecciona un anuncio en la tabla para previsualizarlo o crea uno nuevo.</p>
          </div>
        )}

        <Separator />

        <div className="space-y-3">
          <p className="text-[10px] uppercase font-semibold tracking-[0.4em] text-muted-foreground">Módulo de fecha</p>
          <div className="rounded-[2rem] border border-dashed border-border/60 bg-background/70 p-2">
            <ShippingDateSelector disableNavigation className="!px-0" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
