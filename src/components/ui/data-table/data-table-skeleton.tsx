
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface DataTableSkeletonProps {
  columnCount: number;
  rowCount?: number;
  className?: string;
}

export function DataTableSkeleton({
  columnCount,
  rowCount = 10,
  className,
}: DataTableSkeletonProps) {
  return (
    <div className={cn("w-full space-y-4 p-1", className)}>
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-8 w-[150px] lg:w-[250px]" />
        <Skeleton className="h-8 w-[70px]" />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {Array.from({ length: columnCount }).map((_, i) => (
                <TableHead key={i}>
                  <Skeleton className="h-5 w-full" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rowCount }).map((_, i) => (
              <TableRow key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 50}ms`, animationDuration: '0.5s' }}>
                {Array.from({ length: columnCount }).map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-28" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
          <div className="flex items-center space-x-2">
            <Skeleton className="hidden h-8 w-8 lg:block" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="hidden h-8 w-8 lg:block" />
          </div>
        </div>
      </div>
    </div>
  )
}
