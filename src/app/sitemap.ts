// src/app/sitemap.ts
import { MetadataRoute } from 'next';
import { blogPosts } from '@/lib/blog-data';
import { prisma } from '@/lib/prisma';
import { categoryService } from '@/services/categoryService';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://floreriaflorarte.com';

  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: 'yearly', priority: 1 },
    { url: `${siteUrl}/products/all`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/about`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.6 },
    { url: `${siteUrl}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
  ];

  try {
    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: { status: 'PUBLISHED', isDeleted: false },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }),
      categoryService.getAllCategories(),
    ]);

    const productPages: MetadataRoute.Sitemap = products.map((product) => ({
      url: `${siteUrl}/products/${product.slug}`,
      lastModified: product.updatedAt,
      priority: 0.9,
    }));

    const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
      url: `${siteUrl}/categories/${category.slug}`,
      lastModified: new Date(),
      priority: 0.7,
    }));
    
    const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
      url: `${siteUrl}/blog/${post.slug}`,
      lastModified: post.date,
      changeFrequency: 'monthly',
      priority: 0.7,
    }));

    return [...staticPages, ...categoryPages, ...productPages, ...blogPages];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    // Return only static pages if data fetching fails
    return staticPages;
  }
}
