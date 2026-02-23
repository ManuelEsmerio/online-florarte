
// src/app/page.tsx
import Header from '@/components/Header';
import { Hero } from '@/components/Hero';
import { Categories } from '@/components/Categories';
import { Footer } from '@/components/Footer';
import { Commitments } from '@/components/Commitments';
import { Occasions } from '@/components/Occasions';
import { Newsletter } from '@/components/Newsletter';
import dynamic from 'next/dynamic';
import { testimonialService } from '@/services/testimonialService';
import { mockCategories, mockOccasions } from '@/lib/data/home-page-data';

// Lazy load components that are not immediately visible on screen to improve initial page load performance.
const Testimonials = dynamic(() => import('@/components/Testimonials').then(mod => mod.Testimonials));

async function getHomePageData() {
    try {
        // Fetch testimonials, but use mock data for categories and occasions
        const testimonials = await testimonialService.getApprovedTestimonials();
        
        return {
            categories: mockCategories, // Using mock data
            occasions: mockOccasions,   // Using mock data
            testimonials: testimonials || [],
        };
    } catch (error) {
        console.error("Failed to load home page data on server:", error);
        // Fallback to mock data for all if testimonials fail
        return {
            categories: mockCategories,
            occasions: mockOccasions,
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
