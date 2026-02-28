
"use client"

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon,
} from "@radix-ui/react-icons"
import { Table } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DataTablePaginationProps<TData> {
  table: Table<TData>
}

export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {

  const paginationBtnClass =
    "h-10 w-10 p-0 rounded-xl bg-background border border-border/50 " +
    "hover:bg-primary/10 hover:border-primary/50 hover:text-primary " +
    "focus:bg-primary/10 focus:border-primary/50 focus:text-primary " +
    "disabled:opacity-40 disabled:pointer-events-none " +
    "transition-colors";

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-2 py-2 animate-fade-in">
      <div className="flex-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        {table.getFilteredSelectedRowModel().rows.length} de{" "}
        {table.getFilteredRowModel().rows.length} fila(s) seleccionadas.
      </div>
      <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
        <div className="flex items-center space-x-2">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Filas por página</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
          >
            <SelectTrigger className="h-10 w-[76px] rounded-lg bg-background border-border/50">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top" className="rounded-xl">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`} className="text-xs">
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-center min-w-[118px] text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Página {table.getState().pagination.pageIndex + 1} de{" "}{table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className={paginationBtnClass + " hidden lg:flex"}
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Ir a la primera página</span>
            <DoubleArrowLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className={paginationBtnClass}
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Anterior</span>
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className={paginationBtnClass}
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Siguiente</span>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className={paginationBtnClass + " hidden lg:flex"}
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Última página</span>
            <DoubleArrowRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
