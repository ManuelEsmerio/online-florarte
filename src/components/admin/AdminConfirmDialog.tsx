'use client';

import { AlertTriangle, HelpCircle, Loader2, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type Variant = 'destructive' | 'warning' | 'info';

type VariantConfig = {
  Icon: typeof Trash2;
  iconBg: string;
  iconColor: string;
  titleClass: string;
  actionClass: string;
};

// ─── Variant map (only CSS-variable-based or opacity-based classes) ───────────
// All colors resolve from the active admin theme → automatically theme-aware.

const VARIANT_CONFIG: Record<Variant, VariantConfig> = {
  destructive: {
    Icon: Trash2,
    iconBg: 'bg-destructive/10',
    iconColor: 'text-destructive',
    titleClass: 'text-destructive',
    actionClass:
      'bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-md shadow-destructive/20',
  },
  warning: {
    Icon: AlertTriangle,
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-500',
    titleClass: 'text-amber-600 dark:text-amber-400',
    actionClass: 'bg-amber-500 hover:bg-amber-500/90 text-white shadow-md shadow-amber-500/20',
  },
  info: {
    Icon: HelpCircle,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    titleClass: '',
    actionClass:
      'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20',
  },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface AdminConfirmDialogProps {
  /**
   * El elemento que abre el diálogo al hacer clic.
   * Se envuelve automáticamente en AlertDialogTrigger asChild.
   * Si se controla externamente con `open`, puede omitirse.
   */
  trigger?: React.ReactNode;
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: Variant;
  onConfirm: () => void;
  /** Muestra un spinner en el botón de confirmación */
  isLoading?: boolean;
  /** Control externo del estado abierto/cerrado */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminConfirmDialog({
  trigger,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'destructive',
  onConfirm,
  isLoading = false,
  open,
  onOpenChange,
}: AdminConfirmDialogProps) {
  const { Icon, iconBg, iconColor, titleClass, actionClass } = VARIANT_CONFIG[variant];

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}

      <AlertDialogContent className="max-w-md rounded-2xl border border-border bg-background p-0 shadow-2xl overflow-hidden gap-0">
        {/* ── Sección superior: ícono + título + descripción ───────── */}
        <div className="flex flex-col items-center text-center px-8 pt-8 pb-6 border-b border-border bg-muted/30">
          <div
            className={cn(
              'flex h-14 w-14 items-center justify-center rounded-full mb-4',
              iconBg,
            )}
          >
            <Icon className={cn('h-7 w-7', iconColor)} />
          </div>

          <AlertDialogTitle className={cn('text-xl font-bold', titleClass)}>
            {title}
          </AlertDialogTitle>

          <AlertDialogDescription className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-[22rem]">
            {description}
          </AlertDialogDescription>
        </div>

        {/* ── Sección inferior: botones ─────────────────────────────── */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 px-6 py-5 sm:justify-end bg-background">
          <AlertDialogCancel className="h-11 rounded-xl border border-border bg-transparent text-foreground hover:bg-muted font-semibold mt-0">
            {cancelText}
          </AlertDialogCancel>

          <AlertDialogAction
            className={cn('h-11 rounded-xl font-bold', actionClass)}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
