// src/repositories/testimonialRepository.ts
import { testimonials } from '@/lib/data/testimonials-data';
import type { PoolConnection } from '@/lib/db';
import type { Testimonial } from '@/lib/definitions';


export const testimonialRepository = {
  /**
   * Obtiene todos los testimonios que han sido aprobados.
   * Une las tablas `testimonials` y `users` para obtener el nombre del autor.
   * @returns Una promesa que resuelve a un array de testimonios con datos del usuario.
   */
  async findApproved(): Promise<any[]> {
    return Promise.resolve(testimonials
      .filter(t => t.status === 'aprobado' || t.status === 'approved')
      .map(t => ({
        id: t.id,
        user_id: t.userId,
        user_name: t.userName,
        user_profile_pic: t.userProfilePic,
        order_id: t.orderId,
        rating: t.rating,
        comment: t.comment,
        status: t.status,
        created_at: t.createdAt
      }))
    );
  },

  async findByOrder(connection: PoolConnection, orderId: number): Promise<any | null> {
    const t = testimonials.find(t => t.orderId === orderId);
    if (!t) return Promise.resolve(null);
    return Promise.resolve({
      id: t.id,
      user_id: t.userId,
      user_name: t.userName,
      user_profile_pic: t.userProfilePic,
      order_id: t.orderId,
      rating: t.rating,
      comment: t.comment,
      status: t.status,
      created_at: t.createdAt
    });
  },

  /**
   * Envía un nuevo testimonio usando el Stored Procedure.
   */
  async submit(connection: PoolConnection, userId: number, orderId: number, rating: number, comment: string): Promise<number> {
    const newId = Math.max(...testimonials.map(t => t.id), 0) + 1;
    testimonials.push({
      id: newId,
      userId,
      orderId,
      rating,
      comment,
      status: 'pending',
      userName: 'Usuario ' + userId, // Mock
      createdAt: new Date().toISOString()
    });
    return Promise.resolve(newId);
  },

  async update(connection: PoolConnection, id: number, data: { rating: number, comment: string }): Promise<boolean> {
    const index = testimonials.findIndex(t => t.id === id);
    if (index === -1) return Promise.resolve(false);
    
    testimonials[index] = { ...testimonials[index], ...data, status: 'pending', createdAt: new Date().toISOString() };
    return Promise.resolve(true);
  },

  /**
   * Actualiza el estado de un testimonio usando el Stored Procedure.
   */
  async setStatus(connection: PoolConnection, id: number, status: 'pending' | 'approved' | 'rejected'): Promise<boolean> {
    const index = testimonials.findIndex(t => t.id === id);
    if (index === -1) return Promise.resolve(false);
    
    testimonials[index].status = status === 'approved' ? 'aprobado' : status; // Handle language mismatch if needed
    return Promise.resolve(true);
  }
};
