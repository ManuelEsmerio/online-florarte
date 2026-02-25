// src/app/products/all/page.tsx
import { Suspense } from 'react';
import Header from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ProductCardSkeleton } from '@/components/ProductCardSkeleton';
import dynamic from 'next/dynamic';

const CategoryPageClient = dynamic(
  () => import('@/app/categories/[slug]/category-page-client').then(mod => mod.CategoryPageClient),
  {
    loading: () => <AllProductsPageSkeleton />,
  }
);

const AllProductsPageSkeleton = () => (
     <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
        <Skeleton className="h-6 w-48 mb-8" />
        <div className="text-center md:text-left mb-8">
            <Skeleton className="h-9 w-3/4 mb-2" />
            <div className="space-y-1"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3 mt-1" /></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <aside className="md:col-span-1">
                 <div className="space-y-6">
                    <Skeleton className="h-10 w-full" />
                    <div className="space-y-4">
                        <Skeleton className="h-5 w-1/3" />
                        <div className="space-y-3 pl-2">
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-5 w-full" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <Skeleton className="h-5 w-1/3" />
                        <Skeleton className="h-5 w-full" />
                    </div>
                </div>
            </aside>
            <div className="md:col-span-3">
                 <div className={cn("product-grid")}>
                    {Array.from({ length: 9 }).map((_, index) => <ProductCardSkeleton key={index} />)}
                </div>
            </div>
        </div>
     </div>
)


export default function AllProductsPage() {
  return (
    <>
      <Header />
      <main className="flex-grow">
        <Suspense fallback={<AllProductsPageSkeleton />}>
            <CategoryPageClient 
                pageType="all"
            />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
