// src/app/admin/testimonials/columns.tsx
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown, Star, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { Testimonial } from '@/lib/definitions';
import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { TestimonialDetailModal } from '@/components/admin/testimonials/TestimonialDetailModal';

export type TestimonialStatus = 'pending' | 'approved' | 'rejected';


const getStatusVariant = (status: TestimonialStatus): 'success' | 'destructive' | 'secondary' => {
  switch (status) {
    case 'approved':
      return 'success';
    case 'rejected':
      return 'destructive';
    case 'pending':
      return 'secondary';
    default:
      return 'secondary';
  }
}

const statusIcons: { [key in TestimonialStatus]: React.ReactNode } = {
  approved: <CheckCircle className="mr-2 h-4 w-4" />,
  rejected: <XCircle className="mr-2 h-4 w-4" />,
  pending: <Clock className="mr-2 h-4 w-4" />,
};

type ColumnsProps = {
  onUpdateStatus: (id: number, status: TestimonialStatus) => void;
  onDelete: (id: number) => void;
};

export const columns = ({ onUpdateStatus, onDelete }: ColumnsProps): ColumnDef<Testimonial>[] => [
  {
    accessorKey: 'userName',
    header: ({ column }) => (
      <Button variant="ghost" className="hover:bg-primary/10 hover:text-primary" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Autor
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: 'rating',
    header: 'Calificación',
    cell: ({ row }) => {
      const rating = row.getValue('rating') as number;
      return (
        <div className="flex items-center">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`h-5 w-5 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: 'comment',
    header: 'Comentario',
    cell: ({ row }) => {
        const testimonial = row.original;
        return (
            <Dialog>
                <DialogTrigger asChild>
                    <p className="truncate max-w-sm cursor-pointer hover:underline">{testimonial.comment}</p>
                </DialogTrigger>
                <TestimonialDetailModal testimonial={testimonial} />
            </Dialog>
        );
    }
  },
  {
    accessorKey: 'orderId',
    header: 'Pedido Ref.',
    cell: ({ row }) => {
        const orderId = row.getValue('orderId');
        return orderId ? `ORD${String(orderId).padStart(4, '0')}` : 'N/A';
    }
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const status = row.getValue('status') as TestimonialStatus;
      return (
        <Badge variant={getStatusVariant(status)} className="capitalize">
          {statusIcons[status]}
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Fecha',
    cell: ({ row }) => format(new Date(row.getValue('createdAt')), 'dd MMM yyyy', { locale: es }),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const testimonial = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => onUpdateStatus(testimonial.id, 'approved')}
              disabled={testimonial.status === 'approved'}
            >
              Aprobar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onUpdateStatus(testimonial.id, 'rejected')}
              disabled={testimonial.status === 'rejected'}
            >
              Rechazar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem className="text-destructive focus:bg-destructive/90 focus:text-destructive-foreground" onSelect={(e) => e.preventDefault()}>
                  Eliminar
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción eliminará permanentemente el testimonio de {testimonial.userName}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => onDelete(testimonial.id)}>
                    Sí, eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
