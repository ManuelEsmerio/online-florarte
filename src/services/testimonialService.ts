// src/services/testimonialService.ts
import { testimonialRepository } from '../repositories/testimonialRepository';
import { mapDbTestimonialToTestimonial } from '../mappers/testimonialMapper';
import type { Testimonial } from '@/lib/definitions';
// import { dbWithAudit } from '@/lib/db';

const dbWithAudit = async <T>(userId: number, fn: () => Promise<T>): Promise<T> => fn();

export const testimonialService = {
  async getApprovedTestimonials(): Promise<Testimonial[]> {
    const dbTestimonials = await testimonialRepository.findApproved();
    return dbTestimonials.map(mapDbTestimonialToTestimonial);
  },

  async upsertTestimonial(userId: number, orderId: number, rating: number, comment: string): Promise<{ id: number, action: 'created' | 'updated' }> {
    return dbWithAudit(userId, async () => {
      const existing = await testimonialRepository.findByOrder(orderId);
      
      if (existing) {
        if (existing.status !== 'pending') {
          throw new Error('No puedes editar una reseña que ya ha sido procesada.');
        }
        await testimonialRepository.update(existing.id, { rating, comment });
        return { id: existing.id, action: 'updated' };
      } else {
        const newId = await testimonialRepository.submit(userId, orderId, rating, comment);
        return { id: newId, action: 'created' };
      }
    });
  },

  async setTestimonialStatus(id: number, status: 'pending' | 'approved' | 'rejected', adminId: number): Promise<boolean> {
    return dbWithAudit(adminId, () =>
      testimonialRepository.setStatus(id, status)
    );
  }
};
