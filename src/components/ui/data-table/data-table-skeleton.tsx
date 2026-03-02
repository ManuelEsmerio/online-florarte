
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
    <div className={cn("w-full space-y-6 p-1", className)}>
      <div className="rounded-[24px] border border-border/50 bg-background dark:bg-zinc-900/50 shadow-xl overflow-hidden animate-fade-in-up">
        <div className="overflow-x-auto custom-scrollbar">
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
                <TableRow
                  key={i}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${i * 50}ms`, animationDuration: "0.5s" }}
                >
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
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-2">
        <Skeleton className="h-4 w-40" />
        <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-[76px] rounded-lg" />
          </div>
          <Skeleton className="h-4 w-32" />
          <div className="flex items-center space-x-2">
            <Skeleton className="hidden h-10 w-10 rounded-xl lg:block" />
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="hidden h-10 w-10 rounded-xl lg:block" />
          </div>
        </div>
      </div>
    </div>
  );
}
