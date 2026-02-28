// src/app/admin/customers/columns.tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import type { User } from '@/lib/definitions';
import { CustomerActionsCell } from "@/components/admin/customers/CustomerActionsCell";

export type ColumnsProps = {
  onEdit: (user: User) => void;
  onDelete: (id: number) => void;
  onViewDetails: (user: User) => void;
  onSendCredentials: (user: User) => void;
  isSendingCredentialsFor: number | null;
  isDeletingId: number | null;
}

export const columns = ({ onEdit, onDelete, onViewDetails, onSendCredentials, isSendingCredentialsFor, isDeletingId }: ColumnsProps): ColumnDef<User>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        disabled={row.original.isDeleted}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-primary/90 hover:text-white"
        >
          Nombre
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "phone",
    header: "Teléfono",
    cell: ({ row }) => row.getValue("phone") || 'N/A'
  },
  {
    accessorKey: "loyaltyPoints",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="hover:bg-primary/90 hover:text-white"
      >
        Puntos
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
        const points = row.getValue("loyaltyPoints") as number;
        return (
            <div className="flex items-center justify-center font-semibold">
                {points}
            </div>
        )
    }
  },
  {
    accessorKey: "role",
    header: "Rol",
     cell: ({ row }) => {
      const role = row.getValue("role") as string
      return <span className="capitalize">{role}</span>
    },
     filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "isDeleted",
    header: "Estado",
    cell: ({ row }) => {
      const isDeleted = row.getValue("isDeleted") as boolean;
      return (
        <Badge variant={isDeleted ? "destructive" : "success"}>
          {isDeleted ? "Eliminado" : "Activo"}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
        const isDeleted = row.getValue(id) as boolean;
        if (value === 'all') return true;
        if (value === 'deleted') return isDeleted;
        return !isDeleted;
    }
  },
  {
    id: "actions",
    cell: ({ row }) => <CustomerActionsCell 
        user={row.original} 
        onEdit={onEdit} 
        onDelete={onDelete} 
        onViewDetails={onViewDetails}
        onSendCredentials={onSendCredentials} 
        isSendingCredentialsFor={isSendingCredentialsFor} 
        isDeletingId={isDeletingId}
    />,
  },
]
