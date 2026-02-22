// src/app/admin/ads/columns.tsx
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Announcement } from '@/lib/definitions';
import React from 'react';
import Image from 'next/image';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type ColumnsProps = {
  onEdit: (ad: Announcement) => void;
  onDelete: (id: number) => void;
  onToggleActive: (ad: Announcement) => void;
  isDeletingId: number | null;
  updatingStatusId: number | null;
};

const ActiveToggle = ({ ad, onToggle, isUpdating }: { ad: Announcement; onToggle: (ad: Announcement) => void; isUpdating: boolean; }) => {
  return (
    <div className="relative flex items-center justify-center">
        {isUpdating && <Loader2 className="absolute h-4 w-4 animate-spin" />}
        <Switch
            checked={ad.is_active}
            onCheckedChange={() => onToggle(ad)}
            disabled={isUpdating}
            className={isUpdating ? 'opacity-50' : ''}
            aria-label={`Activar/desactivar el anuncio ${ad.title}`}
        />
    </div>
  );
};

export const columns = ({ onEdit, onDelete, onToggleActive, isDeletingId, updatingStatusId }: ColumnsProps): ColumnDef<Announcement>[] => [
  {
    accessorKey: 'image_url',
    header: () => <ImageIcon className="h-4 w-4" />,
    cell: ({ row }) => {
      const imageUrl = row.original.image_url;
      const title = row.original.title;
      return (
        <Image
          src={imageUrl || '/placehold.webp'}
          alt={title}
          width={60}
          height={30}
          className="rounded-sm object-cover aspect-[2/1]"
        />
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: 'title',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Título
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: 'is_active',
    header: 'Activo',
    cell: ({ row }) => {
      const ad = row.original;
      return <ActiveToggle ad={ad} onToggle={onToggleActive} isUpdating={updatingStatusId === ad.id} />;
    },
  },
  {
    accessorKey: 'start_at',
    header: 'Vigencia',
    cell: ({ row }) => {
        const { start_at, end_at } = row.original;
        if (!start_at && !end_at) return <span className="text-muted-foreground">Siempre activo</span>;
        const start = start_at ? format(new Date(start_at), 'dd/MM/yy') : '...';
        const end = end_at ? format(new Date(end_at), 'dd/MM/yy') : '...';
        return <Badge variant="outline">{start} - {end}</Badge>;
    },
  },
  {
    accessorKey: 'sort_order',
    header: 'Orden',
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const ad = row.original;
      const isDeleting = isDeletingId === ad.id;

      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0" disabled={isDeleting}>
                <span className="sr-only">Abrir menú</span>
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => onEdit(ad)}>Editar</DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="text-destructive focus:bg-destructive/90 focus:text-destructive-foreground" onSelect={(e) => e.preventDefault()}>
                    Eliminar
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro de que quieres eliminar este anuncio?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. El anuncio "{ad.title}" será eliminado permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => onDelete(ad.id)}>
                      Sí, eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
