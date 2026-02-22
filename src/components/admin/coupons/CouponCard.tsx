'use client';

import { Coupon } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Copy, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface CouponCardProps {
  coupon: Coupon;
  onEdit: (coupon: Coupon) => void;
  onDelete: (id: number) => void;
}

const statusStyles: { [key in Coupon['status']]: string } = {
  vigente: 'bg-primary/20 text-primary border-primary/30',
  vencido: 'bg-slate-700/30 text-slate-400 border-slate-600',
  utilizado: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
  programado: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
};

const statusText: { [key in Coupon['status']]: string } = {
    vigente: 'Vigente',
    vencido: 'Vencido',
    utilizado: 'Utilizado',
    programado: 'Programado'
}

export function CouponCard({ coupon, onEdit, onDelete }: CouponCardProps) {
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(coupon.code);
    toast({ title: '¡Código copiado!', description: `El código ${coupon.code} ha sido copiado.` });
  };

  const isInactive = coupon.status === 'vencido' || coupon.status === 'utilizado';

  const getDisplayDate = () => {
    if (coupon.status === 'programado' && coupon.valid_from) {
        return { label: 'Inicia', date: coupon.valid_from };
    }
    if (coupon.valid_until) {
        return { label: 'Expira', date: coupon.valid_until };
    }
    return { label: 'Válido', date: null };
  }

  const displayDate = getDisplayDate();

  return (
    <div className={cn(
      "ticket-cutout glass-card rounded-xl overflow-hidden flex h-44 group transition-all",
      isInactive && "opacity-70 grayscale hover:grayscale-0 hover:opacity-100"
    )}>
      <div className={cn(
        "w-1/3 flex flex-col items-center justify-center border-r border-dashed",
        isInactive ? "bg-slate-800/50 border-slate-700" : "bg-primary/10 border-primary/30"
      )}>
        <span className={cn("text-2xl font-black", isInactive ? "text-slate-400" : "text-primary")}>
          {coupon.discount_type === 'percentage' ? `${coupon.value}%` : `$${coupon.value}`}
        </span>
        <span className={cn("text-xs font-bold uppercase tracking-widest", isInactive ? "text-slate-500" : "text-primary/70")}>
          {coupon.discount_type === 'percentage' ? 'OFF' : 'DTO'}
        </span>
      </div>
      <div className="w-2/3 p-4 md:p-5 flex flex-col justify-between relative">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 uppercase font-bold tracking-tighter mb-1">Código</span>
            <div className="flex items-center gap-2">
              <span className={cn("font-serif text-xl md:text-2xl tracking-wide", isInactive ? "text-slate-400" : "text-slate-100")}>{coupon.code}</span>
              <Button
                variant="ghost"
                size="icon"
                disabled={isInactive}
                onClick={handleCopy}
                className={cn(
                  "h-7 w-7 text-slate-500 hover:text-white hover:bg-primary/30",
                  isInactive && "opacity-40 cursor-not-allowed hover:text-slate-500"
                )}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" 
               disabled={isInactive}
              className={cn(
                "h-8 w-8 text-slate-500 hover:bg-primary/30 hover:text-white",
                isInactive && "opacity-40 cursor-not-allowed hover:text-slate-500"
              )}>
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-charcoal/80 backdrop-blur-sm border-primary/20">
              <DropdownMenuItem onSelect={() => onEdit(coupon)} className="cursor-pointer">
                <Edit className="mr-2 h-4 w-4" />
                <span>Editar</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onDelete(coupon.id)} className="text-destructive focus:text-destructive cursor-pointer">
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Eliminar</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex justify-between items-end">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold">
                {displayDate.label}
            </span>
            <span className={cn("text-xs font-medium", isInactive ? "text-slate-500 line-through" : "text-slate-300")}>
                {displayDate.date ? format(new Date(displayDate.date), 'dd MMM, yyyy', { locale: es }) : 'Permanentemente'}
            </span>
          </div>
          <span className={cn("text-[10px] font-bold uppercase px-3 py-1 rounded-full border", statusStyles[coupon.status])}>
            {statusText[coupon.status]}
          </span>
        </div>
      </div>
    </div>
  );
}
