
// src/app/page.tsx
import Header from '@/components/Header';
import { Hero } from '@/components/Hero';
import { Categories } from '@/components/Categories';
import { Footer } from '@/components/Footer';
import { Commitments } from '@/components/Commitments';
import { Occasions } from '@/components/Occasions';
import { Newsletter } from '@/components/Newsletter';
import dynamic from 'next/dynamic';
import { unstable_cache } from 'next/cache';
import { categoryService } from '@/services/categoryService';
import { testimonialService } from '@/services/testimonialService';
import { occasionService } from '@/services/occasionService';

// ISR: la página se regenera en servidor cada 5 minutos.
// Las visitas entre revalidaciones sirven la versión cacheada sin tocar la BD.
export const revalidate = 300;

// Lazy load components that are not immediately visible on screen to improve initial page load performance.
const Testimonials = dynamic(() => import('@/components/Testimonials').then(mod => mod.Testimonials));

// unstable_cache añade una capa de caché en memoria/disco de Next.js además del ISR.
// Si múltiples requests llegan al mismo tiempo durante la revalidación, solo
// uno hace la query a BD; los demás reciben la respuesta cacheada.
const getHomePageData = unstable_cache(
  async () => {
    try {
        const [categories, testimonials, occasions] = await Promise.all([
          categoryService.getHomePageCategories(),
          testimonialService.getApprovedTestimonials(),
          occasionService.getHomePageOccasions(),
        ]);

        return {
            categories: categories || [],
            occasions: occasions || [],
            testimonials: testimonials || [],
        };
    } catch (error) {
        console.error("Failed to load home page data on server:", error);
        return {
            categories: [],
            occasions: [],
            testimonials: [],
        };
    }
  },
  ['home-page-data'],
  { revalidate: 300, tags: ['home', 'categories', 'occasions', 'testimonials'] }
);

export default async function HomePage() {
  const homePageData = await getHomePageData();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Hero />
        <Categories categories={homePageData.categories || []} />
        <Commitments />
        <Occasions occasions={homePageData.occasions || []} />
        <Testimonials testimonials={homePageData.testimonials || []} />
        <Newsletter />
      </main>
      <Footer />
    </div>
  );
}
