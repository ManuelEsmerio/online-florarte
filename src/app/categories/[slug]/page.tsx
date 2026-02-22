
// src/app/categories/[slug]/page.tsx
'use client'

import { Footer } from '@/components/Footer';
import Header from '@/components/Header';
import { usePathname } from 'next/navigation';
import { CategoryPageClient } from './category-page-client';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductCardSkeleton } from '@/components/ProductCardSkeleton';
import { cn } from '@/lib/utils';

function CategoryPageContent() {
    const pathname = usePathname();
    const slug = pathname.split('/').pop();

    return (
        <CategoryPageClient 
            categorySlug={slug}
            pageType="category"
        />
    )
}

const CategoryPageSkeleton = () => (
     <div className="container mx-auto px-4 py-8 md:px-6 md:py-12 animate-pulse">
        <Skeleton className="h-6 w-48 mb-8 rounded-md" />
        <div className="text-center md:text-left mb-12">
            <Skeleton className="h-12 w-1/2 md:w-1/3 mx-auto md:mx-0 mb-4 rounded-lg" />
            <div className="space-y-2"><Skeleton className="h-4 w-full max-w-2xl mx-auto md:mx-0 rounded-md" /><Skeleton className="h-4 w-2/3 max-w-xl mx-auto md:mx-0 rounded-md" /></div>
        </div>
        <div className="flex flex-col gap-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
                <div className="flex gap-3 w-full md:w-auto">
                    <Skeleton className="h-11 flex-1 md:w-[240px] rounded-xl" />
                    <Skeleton className="h-11 w-24 rounded-xl" />
                </div>
                <Skeleton className="h-5 w-32 hidden md:block rounded-md" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                {Array.from({ length: 8 }).map((_, index) => <ProductCardSkeleton key={index} />)}
            </div>
        </div>
     </div>
)

export default function CategoryPage() {
  return (
    <>
      <Header />
      <main className="flex-grow">
        <Suspense fallback={<CategoryPageSkeleton />}>
            <CategoryPageContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
