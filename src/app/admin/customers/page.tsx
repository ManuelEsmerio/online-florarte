
'use client';

import { columns } from './columns';
import type { User } from '@/lib/definitions';
import { DataTable } from '@/components/ui/data-table/data-table';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { CustomerForm } from './customer-form';
import { useToast } from '@/hooks/use-toast';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  RowSelectionState,
} from '@tanstack/react-table';
import { DataTableToolbar } from './customer-table-toolbar';
import { DataTableSkeleton } from '@/components/ui/data-table/data-table-skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CustomerDetailModal } from './customer-detail-modal';

export default function CustomersPage() {
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);
  const [isSendingCredentialsFor, setIsSendingCredentialsFor] = useState<number | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
    { id: 'isDeleted', value: 'active' }
  ]);
  const [searchTerm, setSearchTerm] = useState('');

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/users?status=all');
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Error al cargar usuarios');
      setUsers(json.data ?? []);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddUser = () => {
    setSelectedUser(null);
    setTimeout(() => setIsFormOpen(true), 100);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setIsDetailModalOpen(true);
  };

  const handleDeleteUser = async (id: number) => {
    setIsDeletingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Error al eliminar usuario');
      toast({ title: '¡Usuario Eliminado!', description: 'El usuario ha sido desactivado del sistema.', variant: 'success' });
      await loadUsers();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleSendCredentials = async (user: User) => {
    setIsSendingCredentialsFor(user.id);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
      title: '¡Enlace Enviado!',
      description: `Se ha enviado un correo para restablecer la contraseña a ${user.email}.`,
      variant: 'success'
    });
    setIsSendingCredentialsFor(null);
  };

  const tableColumns = useMemo(() => columns({
    onEdit: handleEditUser,
    onDelete: handleDeleteUser,
    onViewDetails: handleViewDetails,
    onSendCredentials: handleSendCredentials,
    isSendingCredentialsFor,
    isDeletingId,
  }), [isSendingCredentialsFor, isDeletingId]);

  const table = useReactTable({
    data: users,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    enableRowSelection: (row) => !row.original.isDeleted,
    state: {
      sorting,
      rowSelection,
      columnFilters,
      columnVisibility,
      globalFilter: searchTerm,
    },
    onGlobalFilterChange: setSearchTerm,
  });

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    const selectedIds = table.getFilteredSelectedRowModel().rows.map(row => row.original.id);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: selectedIds }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Error al eliminar usuarios');
      toast({ title: '¡Usuarios Eliminados!', description: 'Los usuarios seleccionados han sido desactivados.', variant: 'success' });
      table.resetRowSelection();
      await loadUsers();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveUser = async (formData: any) => {
    setIsSaving(true);
    try {
      const isEditing = !!selectedUser;
      const payload: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone ? `${formData.phoneCountryCode}${formData.phone}` : null,
        role: (formData.role as string).toUpperCase(),
      };
      if (formData.password) payload.password = formData.password;

      const url = isEditing ? `/api/admin/users/${selectedUser!.id}` : '/api/admin/users';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Error al guardar usuario');

      toast({
        title: isEditing ? '¡Usuario Actualizado!' : '¡Usuario Creado!',
        description: `El usuario ${formData.name} ha sido guardado exitosamente.`,
        variant: 'success'
      });

      setIsFormOpen(false);
      setSelectedUser(null);
      await loadUsers();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && users.length === 0) {
    return (
      <div className="flex-1 space-y-8 p-6 md:p-10 pt-6">
        <div className="flex items-center justify-between space-y-2">
            <h2 className="text-4xl font-bold font-headline tracking-tight text-slate-900 dark:text-white">Usuarios</h2>
            <div className="flex items-center space-x-2">
                <Button disabled className="rounded-2xl h-11 px-6 font-bold shadow-lg shadow-primary/20"><PlusCircle className="mr-2 h-4 w-4" />Crear Usuario</Button>
            </div>
        </div>
        <DataTableSkeleton columnCount={5} />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 pt-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
        <h2 className="text-4xl font-bold font-headline tracking-tight text-slate-900 dark:text-white">Usuarios</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={handleAddUser} className="rounded-2xl h-11 px-6 font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white transition-all transform hover:-translate-y-1">
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Usuario
          </Button>
        </div>
      </div>
      <CustomerForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSaveUser}
        user={selectedUser}
        isSaving={isSaving}
      />
      {selectedUser && (
        <CustomerDetailModal
            isOpen={isDetailModalOpen}
            onOpenChange={setIsDetailModalOpen}
            user={selectedUser}
        />
      )}

      <DataTable
        table={table}
        columns={tableColumns}
        data={users}
        isLoading={isLoading}
        toolbar={
          <div className="flex items-center justify-between">
            <DataTableToolbar
                table={table}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
            />
            {table.getFilteredSelectedRowModel().rows.length > 0 && (
              <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="h-8 rounded-xl px-4 font-bold shadow-lg shadow-destructive/10 bg-destructive hover:bg-destructive/90 transition-all transform hover:-translate-y-0.5 ml-2">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar ({table.getFilteredSelectedRowModel().rows.length})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-headline text-2xl">¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription className="text-sm leading-relaxed text-muted-foreground">
                        Esta acción desactivará a {table.getFilteredSelectedRowModel().rows.length} usuarios del sistema. Podrán ser reactivados después.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                      <AlertDialogCancel className="rounded-2xl h-12 border-none bg-muted font-bold text-foreground">Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive hover:bg-destructive/90 rounded-2xl h-12 font-bold shadow-lg shadow-destructive/20 text-white"
                        onClick={handleBulkDelete}
                        disabled={isDeleting}
                      >
                        {isDeleting ? "Eliminando..." : "Sí, desactivar"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            )}
          </div>
        }
      />
    </div>
  );
}
