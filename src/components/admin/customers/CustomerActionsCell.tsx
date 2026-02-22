// src/components/admin/customers/CustomerActionsCell.tsx
'use client';

import { MoreHorizontal, Loader2, Send, Eye, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
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
import type { User } from '@/lib/definitions';
import type { ColumnsProps } from '@/app/admin/customers/columns';

export const CustomerActionsCell = ({
  row,
  onEdit,
  onDelete,
  onViewDetails,
  onSendCredentials,
  isSendingCredentialsFor,
  isDeletingId,
}: { row: any } & ColumnsProps) => {
  const user = row.original as User;
  const { toast } = useToast();
  const isSending = isSendingCredentialsFor === user.id;
  const isDeleting = isDeletingId === user.id;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0" disabled={isDeleting}>
          <span className="sr-only">Abrir menú</span>
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => onViewDetails(user)}>
          <Eye className="mr-2 h-4 w-4" />
          Ver Detalle
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onEdit(user)} disabled={user.is_deleted}>
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            navigator.clipboard.writeText(user.email);
            toast({ title: '¡Correo copiado al portapapeles!' });
          }}
        >
          Copiar Email
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => onSendCredentials(user)}
          disabled={user.is_deleted || isSending}
        >
          {isSending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          {isSending ? 'Enviando...' : 'Enviar Credenciales'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem
              className="text-destructive focus:bg-destructive/90 focus:text-destructive-foreground"
              onSelect={(e) => e.preventDefault()}
              disabled={user.is_deleted}
            >
              Eliminar
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                ¿Estás seguro de que quieres eliminar este usuario?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. El usuario{' '}
                <span className="font-medium">{user.name}</span> será
                eliminado permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90"
                onClick={() => onDelete(user.id)}
              >
                Sí, eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
