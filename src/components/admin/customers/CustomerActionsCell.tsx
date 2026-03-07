'use client';

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Loader2, Eye, Pencil, Copy, Send, Trash2 } from 'lucide-react';
import { User } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { AdminConfirmDialog } from '@/components/admin/AdminConfirmDialog';

interface CustomerActionsCellProps {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (id: number) => void;
  onViewDetails: (user: User) => void;
  onSendCredentials: (user: User) => void;
  isSendingCredentialsFor: number | null;
  isDeletingId: number | null;
}

export function CustomerActionsCell({
  user,
  onEdit,
  onDelete,
  onViewDetails,
  onSendCredentials,
  isSendingCredentialsFor,
  isDeletingId,
}: CustomerActionsCellProps) {
  const { toast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const isSending = isSendingCredentialsFor === user.id;
  const isDeleting = isDeletingId === user.id;

  const itemClass = "group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-primary hover:text-primary-foreground focus:outline-none focus:bg-primary focus:text-primary-foreground";
  const iconClass = "h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary-foreground";

  return (
    <>
      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0 data-[state=open]:bg-primary/10 hover:bg-primary/10 hover:text-primary"
          >
            <span className="sr-only">Abrir menú</span>
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 rounded-2xl border border-border/50 bg-background/80 p-2 shadow-2xl backdrop-blur-lg">
          <DropdownMenuLabel className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Acciones</DropdownMenuLabel>

          <DropdownMenuItem onSelect={() => onViewDetails(user)} className={itemClass}>
            <Eye className={iconClass} />
            <span>Ver Detalle</span>
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={() => onEdit(user)} disabled={user.isDeleted} className={itemClass}>
            <Pencil className={iconClass} />
            <span>Editar</span>
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={() => {
              navigator.clipboard.writeText(user.email);
              toast({ title: '¡Correo copiado!' });
            }} className={itemClass}>
            <Copy className={iconClass} />
            <span>Copiar Email</span>
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={() => onSendCredentials(user)} disabled={user.isDeleted || isSending} className={itemClass}>
            {isSending ? (
              <Loader2 className={cn(iconClass, "animate-spin")} />
            ) : (
              <Send className={iconClass} />
            )}
            <span>{isSending ? 'Enviando...' : 'Enviar Credenciales'}</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-2 bg-border/50" />

          <DropdownMenuItem
            onSelect={(e) => { e.preventDefault(); setIsDeleteOpen(true); setIsMenuOpen(false); }}
            className={cn(itemClass, "!text-destructive hover:!bg-destructive hover:!text-destructive-foreground focus:!bg-destructive focus:!text-destructive-foreground")}
          >
            <Trash2 className="h-4 w-4 text-destructive transition-colors group-hover:text-destructive-foreground" />
            <span>Eliminar</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AdminConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="¿Desactivar usuario?"
        description="Esta acción marcará al usuario como eliminado. Podrás reactivar su cuenta más tarde."
        confirmText={isDeleting ? 'Desactivando...' : 'Sí, desactivar'}
        isLoading={isDeleting}
        onConfirm={() => {
          onDelete(user.id);
          setIsDeleteOpen(false);
        }}
      />
    </>
  );
}
