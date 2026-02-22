import { MetadataRoute } from 'next';
 
export default function robots(): MetadataRoute.Robots {
  // Asegúrate de cambiar esto a tu dominio de producción.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://floreriaflorarte.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/cart', '/checkout', '/profile', '/orders', '/coupons', '/wishlist'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
