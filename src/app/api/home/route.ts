// src/app/api/home/route.ts
import { NextResponse } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { productService } from '@/services/productService';
import { categoryService } from '@/services/categoryService';
import { testimonialService } from '@/services/testimonialService';
import { occasionService } from '@/services/occasionService';
import { getActiveAnnouncements } from '@/services/announcementService';
import { tagService } from '@/services/tagService';

export const revalidate = 3600;

/**
 * GET /api/home
 * Endpoint público para obtener los datos iniciales de la página principal.
 * Se ha optimizado para ser más ligero y rápido.
 */
export async function GET() {
  try {
    // 1. Ejecutamos todas las promesas de obtención de datos en paralelo.
    const [
      categories,
      testimonials,
      occasions,
      announcements,
      tags,
    ] = await Promise.all([
      categoryService.getAllCategories(),
      testimonialService.getApprovedTestimonials(),
      occasionService.getHomePageOccasions(),
      getActiveAnnouncements(),
      tagService.getAllTags(),
    ]);

    // 2. Construimos el objeto de respuesta.
    const homeData = {
      categories,
      testimonials,
      occasions,
      announcements,
      tags,
    };

    // 3. Devolvemos la respuesta exitosa.
    return successResponse(homeData);

  } catch (error) {
    console.error('[API_HOME_GET_ERROR]', error);
    // 4. Manejamos cualquier error que ocurra durante el proceso.
    return errorHandler(error);
  }
}
