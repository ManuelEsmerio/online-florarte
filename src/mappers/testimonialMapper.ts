// src/mappers/testimonialMapper.ts
import type { Testimonial } from '@/lib/definitions';

/**
 * Mapea una fila de la tabla `testimonials` a un objeto `Testimonial` limpio
 * para ser usado en la aplicación.
 */
export function mapDbTestimonialToTestimonial(row: any): Testimonial {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name, // Este campo viene del JOIN con la tabla de usuarios
    userProfilePic: row.user_profile_pic, // Este también viene del JOIN
    orderId: row.order_id,
    rating: row.rating,
    comment: row.comment,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
  };
}
