
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
      <div className="flex flex-col xl:flex-row gap-4 xl:gap-6 min-h-[calc(100vh-230px)]">
        {/* Tabla (lado izquierdo) */}
        <div className="flex-1 min-w-0">
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
          </div>
          <div className="flex items-center justify-between gap-4 mt-4">
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
        {/* Panel derecho (preview) */}
        <div className="hidden xl:block w-px bg-border/40" />
        <aside className="w-full xl:w-[35%] space-y-4 overflow-y-auto custom-scrollbar">
          <div className="rounded-2xl border border-border/50 bg-background dark:bg-zinc-900/50 overflow-hidden">
            <div className="relative group">
              <Skeleton className="w-full h-56 object-cover" />
              <div className="absolute bottom-4 left-4 right-4">
                <Skeleton className="h-7 w-2/3 mb-2" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            </div>
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
              </div>
              <div>
                <Skeleton className="h-4 w-1/2 mb-1" />
                <Skeleton className="h-5 w-full" />
              </div>
              <div className="pt-4 border-t border-border/40 flex justify-between items-end gap-4">
                <div>
                  <Skeleton className="h-4 w-16 mb-1" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <div className="text-right">
                  <Skeleton className="h-4 w-16 mb-1" />
                  <Skeleton className="h-7 w-24" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="space-y-2 pt-1">
                <Skeleton className="h-11 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border/50 bg-background dark:bg-zinc-900/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-12" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border border-border/50 bg-muted/20">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-10" />
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
