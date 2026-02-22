
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
}

export function DataTable<TData>({
  table,
  columns,
  toolbar,
  isLoading,
  className
}: DataTableProps<TData>) {
  return (
    <div className={cn("space-y-6", className)}>
      {toolbar && (
        <div className="animate-fade-in">
          {toolbar}
        </div>
      )}
      <div className="rounded-[2.5rem] border border-border/50 bg-background dark:bg-zinc-900/50 shadow-xl overflow-hidden animate-fade-in-up">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-white/5">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="h-14 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
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
                  className="hover:bg-primary/5 transition-colors border-b-border/50 last:border-none"
                >
                  {row.getVisibleCells().map((cell: any) => (
                    <TableCell key={cell.id} className="px-6 py-4">
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
       <DataTablePagination table={table} />
    </div>
  )
}
