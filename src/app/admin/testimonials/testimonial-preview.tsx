import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Testimonial } from "@/lib/definitions";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle, Clock, Quote, Star, Trash2, XCircle } from "lucide-react";
import { ReactNode } from "react";

const statusMeta: Record<StatusKey, { label: string; badgeClass: string; icon: ReactNode }> = {
  approved: {
    label: "Aprobado",
    badgeClass: "bg-emerald-100 text-emerald-700",
    icon: <CheckCircle className="h-4 w-4" />,
  },
  pending: {
    label: "Pendiente",
    badgeClass: "bg-amber-100 text-amber-800",
    icon: <Clock className="h-4 w-4" />,
  },
  rejected: {
    label: "Rechazado",
    badgeClass: "bg-rose-100 text-rose-700",
    icon: <XCircle className="h-4 w-4" />,
  },
};

type StatusKey = "approved" | "pending" | "rejected";

interface TestimonialPreviewProps {
  testimonial: Testimonial | null;
  onUpdateStatus?: (id: number, status: StatusKey) => void;
  onDelete?: (id: number) => void;
}

export function TestimonialPreview({ testimonial, onUpdateStatus, onDelete }: TestimonialPreviewProps) {
  if (!testimonial) {
    return (
      <div className="rounded-[30px] border border-border/50 bg-background/80 dark:bg-zinc-900/50 p-8 text-center text-muted-foreground shadow-xl">
        <p className="text-sm">Selecciona un testimonio en la tabla para ver los detalles y ejecutar acciones rápidas.</p>
      </div>
    );
  }

  const statusKey = (testimonial.status?.toString().toLowerCase() as StatusKey) ?? "pending";
  const status = statusMeta[statusKey] ?? statusMeta.pending;
  const formattedDate = format(new Date(testimonial.createdAt), "dd 'de' MMMM yyyy", { locale: es });
  const relativeDate = formatDistanceToNow(new Date(testimonial.createdAt), { addSuffix: true, locale: es });
  const orderLabel = testimonial.orderId ? `ORD${String(testimonial.orderId).padStart(4, "0")}` : "N/A";

  const initials = testimonial.userName
    .split(" ")
    .slice(0, 2)
    .map((name) => name.charAt(0).toUpperCase())
    .join("") || "US";

  const handleApprove = () => testimonial && onUpdateStatus?.(testimonial.id, "approved");
  const handleReject = () => testimonial && onUpdateStatus?.(testimonial.id, "rejected");
  const handleDelete = () => testimonial && onDelete?.(testimonial.id);

  return (
    <div className="rounded-[30px] border border-border/50 bg-background/80 dark:bg-zinc-900/50 p-6 shadow-xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 border border-border/40">
            <AvatarImage src={testimonial.userProfilePic ?? undefined} alt={testimonial.userName} />
            <AvatarFallback className="font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{orderLabel}</p>
            <h3 className="text-xl font-bold tracking-tight">{testimonial.userName}</h3>
            <p className="text-xs text-muted-foreground">{formattedDate} · {relativeDate}</p>
          </div>
        </div>
        <Badge className={cn("flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold", status.badgeClass)}>
          {status.icon}
          {status.label}
        </Badge>
      </div>

      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={cn(
              "h-5 w-5",
              index < testimonial.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"
            )}
          />
        ))}
      </div>

      <div className="relative rounded-2xl border border-border/40 bg-muted/30 p-5">
        <Quote className="absolute -top-3 -left-2 h-6 w-6 text-primary/40" />
        <p className="text-sm leading-relaxed text-muted-foreground">{testimonial.comment}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="rounded-2xl border border-border/40 bg-background/60 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Estado actual</p>
          <p className="mt-2 text-base font-semibold capitalize">{status.label}</p>
        </div>
        <div className="rounded-2xl border border-border/40 bg-background/60 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Referencias</p>
          <p className="mt-2 text-base font-semibold">{orderLabel}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          className="h-11 w-full rounded-2xl font-semibold"
          onClick={handleApprove}
          disabled={statusKey === "approved"}
        >
          Aprobar testimonio
        </Button>
        <Button
          variant="secondary"
          className="h-11 w-full rounded-2xl font-semibold"
          onClick={handleReject}
          disabled={statusKey === "rejected"}
        >
          Marcar como rechazado
        </Button>
      </div>

      <Button
        variant="ghost"
        className="w-full h-11 rounded-2xl font-semibold text-destructive hover:text-destructive"
        onClick={handleDelete}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Eliminar testimonio
      </Button>
    </div>
  );
}

export function TestimonialPreviewSkeleton() {
  return (
    <div className="rounded-[30px] border border-border/50 bg-background/80 dark:bg-zinc-900/50 p-6 shadow-xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-24 w-full rounded-2xl" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Skeleton className="h-11 w-full rounded-2xl" />
        <Skeleton className="h-11 w-full rounded-2xl" />
      </div>
      <Skeleton className="h-11 w-full rounded-2xl" />
    </div>
  );
}
