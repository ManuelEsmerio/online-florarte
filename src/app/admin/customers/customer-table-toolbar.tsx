
// src/app/admin/customers/customer-table-toolbar.tsx
"use client"

import { Cross2Icon } from "@radix-ui/react-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table } from "@tanstack/react-table"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SlidersHorizontal } from "lucide-react"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}

const statusOptions = {
    active: "Activos",
    deleted: "Eliminados",
    all: "Todos"
}

const roleOptions: Record<string, string> = {
    admin: 'Administradores',
    customer: 'Clientes',
    delivery: 'Repartidores'
}

export function DataTableToolbar<TData>({
  table,
  searchTerm,
  setSearchTerm,
}: DataTableToolbarProps<TData>) {
  const isFiltered = searchTerm !== ''
  const statusFilter = table.getColumn("is_deleted")?.getFilterValue() as string ?? "active"
  const selectedRoles = (table.getColumn("role")?.getFilterValue() as string[]) ?? [];

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filtrar por nombre o email..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="h-8 w-full md:w-[250px]"
        />
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 px-3 bg-background border-none shadow-sm text-muted-foreground hover:text-primary hover:bg-primary/5 active:bg-primary/10 transition-all flex items-center gap-2 font-medium">
                    <SlidersHorizontal className="h-4 w-4" />
                    Estado
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filtrar por estado</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Object.entries(statusOptions).map(([key, value]) => (
                    <DropdownMenuCheckboxItem
                        key={key}
                        checked={statusFilter === key}
                        onCheckedChange={() => table.getColumn("is_deleted")?.setFilterValue(key)}
                    >
                        {value}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 px-3 bg-background border-none shadow-sm text-muted-foreground hover:text-primary hover:bg-primary/5 active:bg-primary/10 transition-all flex items-center gap-2 font-medium">
                    <SlidersHorizontal className="h-4 w-4" />
                    Rol
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filtrar por rol</DropdownMenuLabel>
                <DropdownMenuSeparator />
                 <DropdownMenuCheckboxItem
                    checked={selectedRoles.length === 0}
                    onCheckedChange={() => table.getColumn("role")?.setFilterValue([])}
                 >
                    Todos los roles
                 </DropdownMenuCheckboxItem>
                 <DropdownMenuSeparator />
                {Object.entries(roleOptions).map(([key, value]) => (
                    <DropdownMenuCheckboxItem
                        key={key}
                        checked={selectedRoles.includes(key)}
                        onCheckedChange={(checked) => {
                            const newSelection = checked
                                ? [...selectedRoles, key]
                                : selectedRoles.filter(role => role !== key);
                            table.getColumn("role")?.setFilterValue(newSelection.length > 0 ? newSelection : undefined);
                        }}
                    >
                        {value}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => setSearchTerm('')}
            className="h-8 px-2 lg:px-3"
          >
            Limpiar
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
