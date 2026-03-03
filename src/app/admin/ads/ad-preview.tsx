'use client';

import { AdCard } from '@/components/AdCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Announcement } from '@/lib/definitions';
import { CalendarDays, Link2, Sparkles, PenSquare, Type, AlignLeft, Hash } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AdPreviewProps {
  ad: Announcement | null;
  onEdit?: (ad: Announcement) => void;
}

const formatDateLabel = (value?: Date | string | null) => {
  if (!value) return null;
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return null;
  return format(date, 'PPP', { locale: es });
};

export function AdPreview({ ad, onEdit }: AdPreviewProps) {
  const startLabel = formatDateLabel(ad?.startAt) ?? 'Disponible inmediatamente';
  const endLabel = formatDateLabel(ad?.endAt) ?? 'Sin fecha de término';
  const buttonLabel = ad?.buttonText ?? (ad as any)?.button_text ?? 'Sin texto asignado';
  const buttonHref = ad?.buttonLink ?? (ad as any)?.button_link ?? '';
  const statusBadge = ad?.isActive ? { label: 'Publicado', tone: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' } : { label: 'Oculto', tone: 'bg-rose-500/15 text-rose-500' };
  const detailCards = [
    { label: 'Título del banner', value: ad?.title ?? 'Sin título', icon: Type },
    { label: 'Descripción', value: ad?.description ?? 'Sin descripción asignada', icon: AlignLeft },
    { label: 'Texto del botón', value: buttonLabel, icon: Link2 },
    { label: 'Enlace del botón', value: buttonHref || 'Sin enlace asignado', icon: Link2, isLink: !!buttonHref },
    { label: 'Inicio', value: startLabel, icon: CalendarDays },
    { label: 'Fin', value: endLabel, icon: CalendarDays },
    { label: 'Orden de prioridad', value: typeof ad?.sortOrder === 'number' ? `#${ad?.sortOrder}` : 'No definido', icon: Hash },
  ];

  return (
    <Card className="rounded-[32px] border border-border/60 bg-gradient-to-b from-background/95 via-background/80 to-muted/30 shadow-2xl backdrop-blur supports-[backdrop-filter]:backdrop-blur">
      <CardHeader className="space-y-1 pb-4 border-b border-border/60">
        <div className="flex flex-wrap items-center gap-3">
          <CardTitle className="flex items-center gap-2 text-2xl font-headline">
            <Sparkles className="h-5 w-5 text-primary" />
            Vista previa
          </CardTitle>
          {ad && onEdit && (
            <Button
              size="sm"
              variant="secondary"
              className="ml-auto rounded-full border border-border/60 bg-background/80 text-xs font-semibold shadow-sm"
              onClick={() => onEdit(ad)}
            >
              <PenSquare className="mr-2 h-4 w-4" />
              Editar anuncio
            </Button>
          )}
        </div>
        <CardDescription className="text-sm">Revisa cómo se integrará el banner en escritorio y valida la información clave antes de publicarlo.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {ad ? (
          <>
            <div className="rounded-[32px] border border-border/40 bg-muted/10 p-5 shadow-inner">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase font-semibold tracking-[0.35em] text-muted-foreground">Vista escritorio</p>
                <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] font-semibold tracking-wide">Hero Banner</Badge>
              </div>
              <div className="relative mt-4 h-64 rounded-[26px] border border-border/40 overflow-hidden bg-background">
                <AdCard ad={{ ...ad, size: 'double' }} className="rounded-[26px]" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[28px] border border-border/40 bg-background/90 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-semibold tracking-[0.35em] text-muted-foreground">Estado</p>
                    <p className="text-lg font-semibold">{ad.isActive ? 'Activo' : 'Inactivo'}</p>
                  </div>
                  <Badge className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge.tone}`}>
                    {statusBadge.label}
                  </Badge>
                </div>
              </div>
              <div className="rounded-[28px] border border-border/40 bg-background/90 p-4">
                <div className="flex items-start gap-3">
                  <CalendarDays className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-[10px] uppercase font-semibold tracking-[0.35em] text-muted-foreground">Vigencia</p>
                    <p className="font-semibold">{startLabel}</p>
                    <p className="text-xs text-muted-foreground">Hasta {endLabel}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] uppercase font-semibold tracking-[0.35em] text-muted-foreground">Campos del anuncio</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {detailCards.map((detail) => (
                  <div key={detail.label} className="rounded-[28px] border border-border/40 bg-background/95 p-4">
                    <div className="flex items-start gap-3">
                      <detail.icon className="h-5 w-5 text-primary mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase font-semibold tracking-[0.35em] text-muted-foreground">{detail.label}</p>
                        <p className="text-sm font-semibold text-foreground break-words">
                          {detail.isLink && buttonHref ? (
                            <a href={buttonHref} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">
                              {detail.value}
                            </a>
                          ) : detail.value}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>Selecciona un anuncio en la tabla para previsualizarlo o crea uno nuevo para ver cómo lucirá.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
