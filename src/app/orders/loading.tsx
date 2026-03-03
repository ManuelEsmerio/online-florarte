import { Skeleton } from '@/components/ui/skeleton';

export default function OrdersLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <Skeleton className="h-8 w-40 rounded-xl" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border border-border/50 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-24 rounded-lg" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-48 rounded-md" />
            <div className="flex gap-3">
              <Skeleton className="h-16 w-16 rounded-xl flex-shrink-0" />
              <Skeleton className="h-16 w-16 rounded-xl flex-shrink-0" />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border/30">
              <Skeleton className="h-5 w-20 rounded-lg" />
              <Skeleton className="h-9 w-28 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
