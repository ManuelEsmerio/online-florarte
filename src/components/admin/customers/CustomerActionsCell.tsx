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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Loader2, Eye, Pencil, Copy, Send, Trash2 } from 'lucide-react';
import { User } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
  const isSending = isSendingCredentialsFor === user.id;
  const isDeleting = isDeletingId === user.id;

  const itemClass = "group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-primary hover:text-primary-foreground focus:outline-none focus:bg-primary focus:text-primary-foreground";
  const iconClass = "h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary-foreground";
  
  return (
    <AlertDialog>
      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0 data-[state=open]:bg-primary/10 hover:bg-primary/90 hover:text-white"
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
          
          <DropdownMenuItem onSelect={() => onEdit(user)} disabled={user.is_deleted} className={itemClass}>
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

          <DropdownMenuItem onSelect={() => onSendCredentials(user)} disabled={user.is_deleted || isSending} className={itemClass}>
            {isSending ? (
              <Loader2 className={cn(iconClass, "animate-spin")} />
            ) : (
              <Send className={iconClass} />
            )}
            <span>{isSending ? 'Enviando...' : 'Enviar Credenciales'}</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator className="my-2 bg-border/50" />
          
          <AlertDialogTrigger asChild>
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className={cn(itemClass, "!text-destructive hover:!bg-destructive hover:!text-destructive-foreground focus:!bg-destructive focus:!text-destructive-foreground")}
            >
              <Trash2 className="h-4 w-4 text-destructive transition-colors group-hover:text-destructive-foreground" />
              <span>Eliminar</span>
            </DropdownMenuItem>
          </AlertDialogTrigger>
          
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-headline text-2xl">¿Estás absolutamente seguro?</AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-relaxed text-muted-foreground">
            Esta acción marcará al usuario como eliminado. Podrás reactivar su cuenta más tarde.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="rounded-2xl h-12 border-none bg-muted font-bold text-foreground">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive hover:bg-destructive/90 rounded-2xl h-12 font-bold shadow-lg shadow-destructive/20 text-white"
            onClick={() => onDelete(user.id)}
            disabled={isDeleting}
          >
            {isDeleting ? "Eliminando..." : "Sí, desactivar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
