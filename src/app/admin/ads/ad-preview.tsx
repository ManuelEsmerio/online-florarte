'use client';

import { AdCard } from '@/components/AdCard';
import { ShippingDateSelector } from '@/components/ShippingDateSelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Announcement } from '@/lib/definitions';
import { CalendarDays, Link2, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';

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
  const mobileImageSrc = ad
    ? ad.imageMobileUrl
        ?? (ad as any)?.image_mobile_url
        ?? ad.imageUrl
        ?? (ad as any)?.image_url
        ?? null
    : null;

  const buttonLabel = ad?.buttonText ?? (ad as any)?.button_text ?? 'Sin texto asignado';
  const buttonHref = ad?.buttonLink ?? (ad as any)?.button_link ?? ''; 
  const statusBadge = ad?.isActive ? { label: 'Publicado', tone: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' } : { label: 'Oculto', tone: 'bg-rose-500/15 text-rose-500' };

  return (
    <Card className="rounded-[32px] border border-border/60 bg-gradient-to-b from-background/95 via-background/80 to-muted/30 shadow-2xl backdrop-blur supports-[backdrop-filter]:backdrop-blur">
      <CardHeader className="space-y-1 pb-4 border-b border-border/60">
        <CardTitle className="flex items-center gap-2 text-2xl font-headline">
          <Sparkles className="h-5 w-5 text-primary" />
          Vista previa
        </CardTitle>
        <CardDescription className="text-sm">Revisa el banner en escritorio y móvil antes de publicarlo.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {ad ? (
          <>
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
              <div className="rounded-[32px] border border-border/40 bg-muted/10 p-4 shadow-inner">
                <p className="text-[10px] uppercase font-semibold tracking-[0.35em] text-muted-foreground mb-3">Vista escritorio</p>
                <div className="relative h-64 rounded-[26px] border border-border/40 overflow-hidden bg-background">
                  <AdCard ad={{ ...ad, size: 'double' }} className="rounded-[26px]" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-[32px] border border-border/40 bg-muted/10 p-4 text-center shadow-inner">
                  <p className="text-[10px] uppercase font-semibold tracking-[0.35em] text-muted-foreground mb-3">Vista móvil</p>
                  <div className="relative mx-auto w-36 aspect-[9/16] rounded-[26px] border border-border/40 bg-background shadow-lg overflow-hidden">
                    {mobileImageSrc ? (
                      <Image src={mobileImageSrc} alt="Vista móvil" fill className="object-cover" sizes="144px" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground px-4">
                        Sin imagen móvil asignada
                      </div>
                    )}
                  </div>
                  <p className="mt-3 text-[11px] text-muted-foreground">Mostramos la versión móvil si está configurada.</p>
                </div>
                <div className="rounded-[32px] border border-border/40 bg-background/80 p-4 shadow-inner">
                  <p className="text-[10px] uppercase font-semibold tracking-[0.35em] text-muted-foreground">Estado</p>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-lg font-semibold">{ad.isActive ? 'Activo' : 'Inactivo'}</p>
                    <Badge className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge.tone}`}>
                      {statusBadge.label}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[28px] border border-border/40 bg-background/80 p-4">
                <div className="flex items-start gap-3">
                  <CalendarDays className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-[10px] uppercase font-semibold tracking-[0.35em] text-muted-foreground">Vigencia</p>
                    <p className="font-semibold">{startLabel}</p>
                    <p className="text-xs text-muted-foreground">Hasta {endLabel}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-[28px] border border-border/40 bg-background/80 p-4">
                <div className="flex items-start gap-3">
                  <Link2 className="h-5 w-5 text-primary mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-semibold tracking-[0.35em] text-muted-foreground">Botón</p>
                    <p className="font-semibold">{buttonLabel}</p>
                    <p className="text-xs text-muted-foreground truncate">{buttonHref || 'Sin enlace asignado'}</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>Selecciona un anuncio en la tabla para previsualizarlo o crea uno nuevo para ver cómo lucirá.</p>
          </div>
        )}

        <Separator className="bg-border/60" />

        <div className="space-y-3">
          <p className="text-[10px] uppercase font-semibold tracking-[0.4em] text-muted-foreground">Módulo de fecha</p>
          <div className="rounded-[2rem] border border-dashed border-border/60 bg-background/80 p-2">
            <ShippingDateSelector disableNavigation className="!px-0" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
