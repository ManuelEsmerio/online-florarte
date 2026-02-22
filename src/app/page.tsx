
// src/app/page.tsx
import Header from '@/components/Header';
import { Hero } from '@/components/Hero';
import { Categories } from '@/components/Categories';
import { Footer } from '@/components/Footer';
import { Commitments } from '@/components/Commitments';
import { Occasions } from '@/components/Occasions';
import { Newsletter } from '@/components/Newsletter';
import dynamic from 'next/dynamic';
import { categoryService } from '@/services/categoryService';
import { testimonialService } from '@/services/testimonialService';
import { occasionService } from '@/services/occasionService';

// Lazy load components that are not immediately visible on screen to improve initial page load performance.
const Testimonials = dynamic(() => import('@/components/Testimonials').then(mod => mod.Testimonials));

async function getHomePageData() {
    try {
        const [categories, testimonials, occasions] = await Promise.all([
            categoryService.getHomePageCategories(),
            testimonialService.getApprovedTestimonials(),
            occasionService.getAllOccasions(),
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
}

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
