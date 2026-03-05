
"use client"

import * as React from "react"
import {
  Table as TanstackTable,
  flexRender,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTablePagination } from "./data-table-pagination"
import { Skeleton } from "../skeleton"
import type { ColumnDef } from "@tanstack/react-table"
import { cn } from "@/lib/utils"

interface DataTableProps<TData> {
  table: TanstackTable<TData>;
  columns: ColumnDef<TData>[];
  data: TData[];
  toolbar?: React.ReactNode;
  isLoading?: boolean;
  className?: string;
  onRowClick?: (rowData: TData) => void;
  selectedRowId?: string | null;
}

export function DataTable<TData>({
  table,
  columns,
  toolbar,
  isLoading,
  className,
  onRowClick,
  selectedRowId,
}: DataTableProps<TData>) {
  return (
    <div className={cn("space-y-8", className)}>
      {toolbar && (
        <div className="animate-fade-in">
          {toolbar}
        </div>
      )}
      <div className="rounded-[24px] border border-border/50 bg-background dark:bg-card shadow-xl overflow-hidden animate-fade-in-up">
        <div className="overflow-x-auto custom-scrollbar">
        <Table>
          <TableHeader className="bg-transparent">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="h-14 px-6 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70 border-b border-border/40 whitespace-nowrap">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
               Array.from({ length: table.getState().pagination.pageSize }).map((_, i) => (
                  <TableRow key={i} className="border-b-border/50">
                      {columns.map((col, j) => (
                          <TableCell key={j} className="px-6 py-4">
                            <Skeleton className="h-5 w-full rounded-md" />
                          </TableCell>
                      ))}
                  </TableRow>
                ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row: any) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => onRowClick?.(row.original)}
                  className={cn(
                    "transition-colors border-b border-border/40 last:border-none",
                    onRowClick && "cursor-pointer",
                    selectedRowId && row.id === selectedRowId && "border-l-4 border-l-primary bg-primary/5 dark:bg-primary/[0.06]",
                    row.original && (row.original as any).isVariant
                      ? "bg-muted/10"
                      : "hover:bg-muted/30"
                  )}
                >
                  {row.getVisibleCells().map((cell: any) => (
                    <TableCell key={cell.id} className="px-6 py-4 align-middle">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-muted-foreground font-medium"
                >
                  No se encontraron resultados en esta colección.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </div>
       <DataTablePagination table={table} />
    </div>
  )
}
