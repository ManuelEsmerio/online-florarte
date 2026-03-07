
'use client';

import { columns } from './columns';
import type { User } from '@/lib/definitions';
import { DataTable } from '@/components/ui/data-table/data-table';
import { useCallback, useMemo, useReducer } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  Updater,
} from '@tanstack/react-table';
import { DataTableToolbar } from './customer-table-toolbar';
import { DataTableSkeleton } from '@/components/ui/data-table/data-table-skeleton';
import { AdminConfirmDialog } from '@/components/admin/AdminConfirmDialog';
import { CustomerDetailModal } from './customer-detail-modal';

type State = {
  isFormOpen: boolean;
  selectedUser: User | null;
  isSaving: boolean;
  isDeleting: boolean;
  isDeletingId: number | null;
  isSendingCredentialsFor: number | null;
  isDetailModalOpen: boolean;
  sorting: SortingState;
  rowSelection: RowSelectionState;
  columnVisibility: VisibilityState;
  columnFilters: ColumnFiltersState;
  searchTerm: string;
};

const initialState: State = {
  isFormOpen: false,
  selectedUser: null,
  isSaving: false,
  isDeleting: false,
  isDeletingId: null,
  isSendingCredentialsFor: null,
  isDetailModalOpen: false,
  sorting: [{ id: 'name', desc: false }],
  rowSelection: {},
  columnVisibility: {},
  columnFilters: [{ id: 'isDeleted', value: 'active' }],
  searchTerm: '',
};

type Action = { type: 'SET_STATE'; payload: Partial<State> };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_STATE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

const applyUpdater = <T,>(updater: Updater<T>, previous: T): T =>
  typeof updater === 'function' ? (updater as (prev: T) => T)(previous) : updater;

export default function CustomersPage() {
  const { toast } = useToast();

  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    isFormOpen,
    selectedUser,
    isSaving,
    isDeleting,
    isDeletingId,
    isSendingCredentialsFor,
    isDetailModalOpen,
    sorting,
    rowSelection,
    columnVisibility,
    columnFilters,
    searchTerm,
  } = state;

  const setState = useCallback((partial: Partial<State>) => {
    dispatch({ type: 'SET_STATE', payload: partial });
  }, []);

  const {
    data: users = [],
    isPending,
    isFetching,
    isError,
    error: queryError,
    refetch,
  } = useQuery<User[], Error>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await fetch('/api/admin/users?status=all&limit=9999');
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Error al cargar usuarios');
      return (json.data?.users ?? json.data ?? []) as User[];
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  // Handle query error (onError was removed in TanStack Query v5)
  if (isError && queryError) {
    toast({ title: 'Error', description: queryError.message, variant: 'destructive' });
  }

  const handleAddUser = useCallback(() => {
    setState({ selectedUser: null, isFormOpen: true });
  }, [setState]);

  const handleEditUser = useCallback((user: User) => {
    setState({ selectedUser: user, isFormOpen: true });
  }, [setState]);

  const handleViewDetails = useCallback((user: User) => {
    setState({ selectedUser: user, isDetailModalOpen: true });
  }, [setState]);

  const handleDeleteUser = useCallback(async (id: number) => {
    setState({ isDeletingId: id });
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Error al eliminar usuario');
      toast({ title: '¡Usuario Eliminado!', description: 'El usuario ha sido desactivado del sistema.', variant: 'success' });
      await refetch();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setState({ isDeletingId: null });
    }
  }, [refetch, setState, toast]);

  const handleSendCredentials = useCallback(async (user: User) => {
    setState({ isSendingCredentialsFor: user.id });
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
      title: '¡Enlace Enviado!',
      description: `Se ha enviado un correo para restablecer la contraseña a ${user.email}.`,
      variant: 'success'
    });
    setState({ isSendingCredentialsFor: null });
  }, [setState, toast]);

  const tableColumns = useMemo(() => columns({
    onEdit: handleEditUser,
    onDelete: handleDeleteUser,
    onViewDetails: handleViewDetails,
    onSendCredentials: handleSendCredentials,
    isSendingCredentialsFor,
    isDeletingId,
  }), [handleDeleteUser, handleEditUser, handleSendCredentials, handleViewDetails, isDeletingId, isSendingCredentialsFor]);

  const table = useReactTable({
    data: users,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: (updater) => setState({ sorting: applyUpdater(updater, sorting) }),
    onColumnFiltersChange: (updater) => setState({ columnFilters: applyUpdater(updater, columnFilters) }),
    onRowSelectionChange: (updater) => setState({ rowSelection: applyUpdater(updater, rowSelection) }),
    onColumnVisibilityChange: (updater) => setState({ columnVisibility: applyUpdater(updater, columnVisibility) }),
    enableRowSelection: (row) => !row.original.isDeleted,
    state: {
      sorting,
      rowSelection,
      columnFilters,
      columnVisibility,
      globalFilter: searchTerm,
    },
    onGlobalFilterChange: (value) => setState({ searchTerm: applyUpdater(value, searchTerm) }),
  });

  const handleBulkDelete = async () => {
    setState({ isDeleting: true });
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
      await refetch();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setState({ isDeleting: false });
    }
  };

  const handleSaveUser = useCallback(async (formData: any) => {
    setState({ isSaving: true });
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

      setState({ isFormOpen: false, selectedUser: null });
      await refetch();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setState({ isSaving: false });
    }
  }, [refetch, selectedUser, setState, toast]);

  if (isPending && users.length === 0) {
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
        onOpenChange={(open) => setState({ isFormOpen: open })}
        onSave={handleSaveUser}
        user={selectedUser}
        isSaving={isSaving}
      />
      {selectedUser && (
        <CustomerDetailModal
            isOpen={isDetailModalOpen}
            onOpenChange={(open) => setState({ isDetailModalOpen: open })}
            user={selectedUser}
        />
      )}

      <DataTable
        table={table}
        columns={tableColumns}
        data={users}
        isLoading={isPending || isFetching}
        toolbar={
          <div className="flex items-center justify-between">
            <DataTableToolbar
                table={table}
                searchTerm={searchTerm}
              setSearchTerm={(value) => setState({ searchTerm: value })}
            />
            {table.getFilteredSelectedRowModel().rows.length > 0 && (
              <AdminConfirmDialog
                trigger={
                  <Button variant="destructive" size="sm" className="h-8 rounded-xl px-4 font-bold shadow-lg shadow-destructive/10 bg-destructive hover:bg-destructive/90 transition-all transform hover:-translate-y-0.5 ml-2">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar ({table.getFilteredSelectedRowModel().rows.length})
                  </Button>
                }
                title="¿Desactivar usuarios seleccionados?"
                description={
                  <>
                    Esta acción desactivará a{' '}
                    <span className="font-semibold">
                      {table.getFilteredSelectedRowModel().rows.length} usuario{table.getFilteredSelectedRowModel().rows.length !== 1 ? 's' : ''}
                    </span>{' '}
                    del sistema. Podrán ser reactivados después.
                  </>
                }
                confirmText={isDeleting ? 'Desactivando...' : 'Sí, desactivar'}
                isLoading={isDeleting}
                onConfirm={handleBulkDelete}
              />
            )}
          </div>
        }
      />
    </div>
  );
}
