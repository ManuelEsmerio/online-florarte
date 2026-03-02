import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Coupon, CouponScope, CouponStatus } from "@/lib/definitions";
import { cn } from "@/lib/utils";
import { CalendarDays, Gift, Layers, Send, UsersRound } from "lucide-react";
import { ReactNode } from "react";

const dateFormatter = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" });
const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 2,
});

const statusStyles: Record<CouponStatus, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  USED: "bg-blue-100 text-blue-700",
  EXPIRED: "bg-rose-100 text-rose-700",
  PAUSED: "bg-amber-100 text-amber-700",
};

const scopeCopy: Record<CouponScope, { label: string; description: string; icon: ReactNode }> = {
  GLOBAL: {
    label: "Alcance global",
    description: "Disponible para cualquier cliente y producto",
    icon: <Layers className="h-4 w-4" />,
  },
  USERS: {
    label: "Clientes seleccionados",
    description: "Solo puede ser canjeado por clientes específicos",
    icon: <UsersRound className="h-4 w-4" />,
  },
  CATEGORIES: {
    label: "Categorías específicas",
    description: "Aplica únicamente a las categorías asignadas",
    icon: <Layers className="h-4 w-4" />,
  },
  PRODUCTS: {
    label: "Productos específicos",
    description: "Restringido a productos concretos",
    icon: <Gift className="h-4 w-4" />,
  },
  SPECIFIC: {
    label: "Reglas personalizadas",
    description: "Sujeto a combinaciones avanzadas",
    icon: <Gift className="h-4 w-4" />,
  },
};

interface CouponPreviewProps {
  coupon: Coupon | null;
  onEdit?: (coupon: Coupon) => void;
  onSend?: (coupon: Coupon) => void;
  isSending?: boolean;
}

export function CouponPreview({ coupon, onEdit, onSend, isSending }: CouponPreviewProps) {
  if (!coupon) {
    return (
      <div className="rounded-[30px] border border-border/50 bg-background/80 dark:bg-zinc-900/50 p-8 text-center text-muted-foreground shadow-xl">
        <p className="text-sm">Selecciona un cupón en la tabla para ver los detalles y acciones rápidas.</p>
      </div>
    );
  }

  const discountLabel = coupon.discountType === "PERCENTAGE"
    ? `${coupon.discountValue}%`
    : currencyFormatter.format(coupon.discountValue);

  const usageLabel = coupon.maxUses
    ? `${coupon.usesCount}/${coupon.maxUses} usos`
    : `${coupon.usesCount} usos registrados`;

  const usagePercent = coupon.maxUses
    ? Math.min(100, Math.round((coupon.usesCount / coupon.maxUses) * 100))
    : null;

  const scopeInfo = scopeCopy[coupon.scope];

  const detailSections = [
    { label: "Clientes", items: coupon.details?.users },
    { label: "Categorías", items: coupon.details?.categories },
    { label: "Productos", items: coupon.details?.products },
  ].filter(section => section.items && section.items.length);

  return (
    <div className="rounded-[30px] border border-border/50 bg-background/80 dark:bg-zinc-900/50 p-6 shadow-xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase font-bold tracking-[0.3em] text-muted-foreground">Código</p>
          <h3 className="text-3xl font-black tracking-tight mt-1">{coupon.code}</h3>
        </div>
        <Badge className={cn("text-[11px] font-semibold tracking-wide px-3 py-1 rounded-full", statusStyles[coupon.status])}>
          {coupon.status === "ACTIVE" && "Vigente"}
          {coupon.status === "EXPIRED" && "Vencido"}
          {coupon.status === "USED" && "Utilizado"}
          {coupon.status === "PAUSED" && "Pausado"}
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">
        {coupon.description || "Este cupón aún no tiene descripción."}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-primary">
            <Gift className="h-4 w-4" />
            Descuento
          </div>
          <p className="text-2xl font-black mt-1">{discountLabel}</p>
          <p className="text-xs text-muted-foreground mt-1">Tipo: {coupon.discountType === "PERCENTAGE" ? "Porcentaje" : "Monto fijo"}</p>
        </div>
        <div className="p-4 rounded-2xl bg-muted/40 border border-border/50">
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            Vigencia
          </div>
          <p className="text-sm font-semibold mt-1">Desde {dateFormatter.format(new Date(coupon.validFrom))}</p>
          <p className="text-xs text-muted-foreground">Hasta {coupon.validUntil ? dateFormatter.format(new Date(coupon.validUntil)) : "sin fecha de término"}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span>{usageLabel}</span>
          {usagePercent !== null && <span>{usagePercent}%</span>}
        </div>
        <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all"
            style={{ width: usagePercent !== null ? `${usagePercent}%` : "100%" }}
          />
        </div>
      </div>

      <div className="p-4 rounded-2xl border border-border/50 bg-muted/30 flex items-start gap-3">
        <div className="mt-1 text-primary">
          {scopeInfo.icon}
        </div>
        <div>
          <p className="text-[11px] uppercase font-bold tracking-[0.3em] text-muted-foreground">Alcance</p>
          <h4 className="text-base font-semibold">{scopeInfo.label}</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{scopeInfo.description}</p>
        </div>
      </div>

      {detailSections.length > 0 && (
        <div className="space-y-4">
          {detailSections.map(section => (
            <div key={section.label}>
              <p className="text-[11px] uppercase font-bold tracking-[0.3em] text-muted-foreground mb-2">
                {section.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {section.items?.map((item) => (
                  <span
                    key={item.id}
                    className="px-3 py-1 rounded-full bg-background border border-border/40 text-xs font-semibold"
                  >
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pt-1">
        <Button
          className="h-11 w-full rounded-2xl font-semibold shadow-lg shadow-primary/20"
          onClick={() => onEdit?.(coupon)}
        >
          Editar cupón
        </Button>
        {onSend && (
          <Button
            variant="secondary"
            className="h-11 w-full rounded-2xl font-semibold"
            onClick={() => onSend(coupon)}
            disabled={isSending}
          >
            {isSending ? "Enviando..." : (
              <span className="flex items-center justify-center gap-2">
                <Send className="h-4 w-4" />
                Enviar
              </span>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

export function CouponPreviewSkeleton() {
  return (
    <div className="rounded-[30px] border border-border/50 bg-background/80 dark:bg-zinc-900/50 p-6 shadow-xl space-y-6">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-5 w-3/4" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <Skeleton className="h-2 w-full" />
      <Skeleton className="h-24 w-full" />
      <div className="flex gap-3">
        <Skeleton className="h-11 w-full rounded-2xl" />
        <Skeleton className="h-11 w-full rounded-2xl" />
      </div>
    </div>
  );
}
