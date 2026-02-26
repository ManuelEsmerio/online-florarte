
// src/app/products/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { ProductDetail } from '@/components/ProductDetail';
import Header from '@/components/Header';
import { Footer } from '@/components/Footer';
import { productService } from '@/services/productService';
import type { Product } from '@/lib/definitions';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const ProductPageSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse">
      <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 items-start">
        {/* Carousel Skeleton */}
        <div className="lg:col-span-7 space-y-4">
            <Skeleton className="w-full aspect-[4/5] rounded-[3rem]" />
            <div className="flex gap-4 overflow-hidden">
                <Skeleton className="h-24 w-24 rounded-xl flex-shrink-0" />
                <Skeleton className="h-24 w-24 rounded-xl flex-shrink-0" />
                <Skeleton className="h-24 w-24 rounded-xl flex-shrink-0" />
            </div>
        </div>
        {/* Info Skeleton */}
        <div className="lg:col-span-5 mt-10 lg:mt-0 space-y-8">
            <div className="space-y-4">
                <Skeleton className="h-10 w-3/4 rounded-lg" />
                <Skeleton className="h-4 w-1/4 rounded-md" />
            </div>
            <Skeleton className="h-10 w-1/3 rounded-lg" />
            <div className="space-y-6">
                <div className="space-y-3">
                    <Skeleton className="h-3 w-20 rounded-md" />
                    <div className="flex gap-3">
                        <Skeleton className="h-10 w-24 rounded-lg" />
                        <Skeleton className="h-10 w-24 rounded-lg" />
                    </div>
                </div>
                <div className="space-y-3">
                    <Skeleton className="h-3 w-24 rounded-md" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                </div>
                <div className="pt-8 border-t border-border/50">
                    <Skeleton className="h-14 w-full rounded-2xl" />
                </div>
            </div>
        </div>
    </div>
    {/* Tabs Skeleton */}
    <div className="mt-24 w-full space-y-8">
        <Skeleton className="h-12 w-full max-w-md rounded-2xl mx-auto md:mx-0" />
        <div className="grid md:grid-cols-3 gap-12">
            <Skeleton className="h-32 w-full rounded-3xl" />
            <Skeleton className="h-32 w-full rounded-3xl" />
            <Skeleton className="h-32 w-full rounded-3xl" />
        </div>
    </div>
  </div>
);

type ProductPageProps = {
    params: Promise<{ slug: string }>;
};

async function getProductData(slug: string): Promise<{ product: Product, complementProducts: Product[] } | null> {
    try {
        const product = await productService.getCompleteProductDetailsBySlug(slug);
        if (!product) {
            return null;
        }

        const allComplementProducts = await productService.getComplementProducts();
        const complementProducts = allComplementProducts.slice(0, 6);

        return { product, complementProducts };

    } catch (error) {
        console.error(`Failed to fetch product data for slug ${slug}:`, error);
        return null;
    }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  console.log('slug: ', slug);
  const data = await getProductData(slug);

  if (!data || !data.product) {
    notFound();
  }

  const { product, complementProducts } = data;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <Suspense fallback={<ProductPageSkeleton />}>
            <ProductDetail product={product} complementProducts={complementProducts} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
