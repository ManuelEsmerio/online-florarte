import { prisma } from '@/lib/prisma';
import { UserFacingError } from '@/utils/errors';
import type { Testimonial } from '@/lib/definitions';

export const testimonialService = {
  // --- Get All (e.g. for Admin Dashboard) ---
  async getAllTestimonials() {
    return await prisma.testimonial.findMany({
      include: {
        user: { select: { id: true, name: true, profilePicUrl: true } },
        order: { select: { id: true, createdAt: true, total: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  // --- Get Approved (Public Storefront) ---
  async getApprovedTestimonials() {
    return await prisma.testimonial.findMany({
      where: { status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      take: 10, // Limit for homepage usually
    });
  },

  // --- Get Pending (Admin Dashboard) ---
  async getPendingTestimonials() {
    return await prisma.testimonial.findMany({
      where: { status: 'PENDING' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        order: { select: { id: true, total: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  },

  // --- Get by Order ID (Check if user already reviewed) ---
  async getTestimonialByOrder(orderId: number) {
    return await prisma.testimonial.findUnique({
      where: { orderId },
    });
  },

  // --- Create ---
  async createTestimonial(data: {
    userId: number;
    orderId: number;
    rating: number;
    comment: string;
  }) {
    // Check if order belongs to user
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
    });

    if (!order) throw new UserFacingError('Pedido no encontrado.');
    if (order.userId !== data.userId) throw new UserFacingError('Este pedido no pertenece a tu cuenta.');

    // Check if duplicate
    const existing = await prisma.testimonial.findUnique({
      where: { orderId: data.orderId },
    });
    if (existing) throw new UserFacingError('Este pedido ya tiene una reseña.');

    // Fetch user details for snapshot
    const user = await prisma.user.findUnique({
        where: { id: data.userId },
        select: { name: true, profilePicUrl: true }
    });

    if (!user) throw new UserFacingError('Usuario no encontrado.');

    return await prisma.testimonial.create({
      data: {
        userId: data.userId,
        orderId: data.orderId,
        rating: data.rating,
        comment: data.comment,
        status: 'PENDING', // Default to pending moderation
        userName: user.name,
        userProfilePic: user.profilePicUrl
      },
    });
  },

  // --- Update Status (Approve/Reject) ---
  async updateStatus(id: number, status: 'APPROVED' | 'REJECTED' | 'PENDING') {
    return await prisma.testimonial.update({
      where: { id },
      data: { status },
    });
  },

  // --- Delete ---
  async deleteTestimonial(id: number) {
    return await prisma.testimonial.delete({
      where: { id },
    });
  },
};