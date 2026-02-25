// src/services/orderService.ts
import { prisma } from '@/lib/prisma';
import { cartService } from './cartService';
import type { Order, OrderStatus } from '@/lib/definitions';

const ORDER_STATUS_MAP: Record<string, string> = {
  PENDING: 'pendiente',
  PROCESSING: 'procesando',
  SHIPPED: 'en_reparto',
  DELIVERED: 'completado',
  CANCELLED: 'cancelado',
};

function mapStatus(status: string): string {
  return ORDER_STATUS_MAP[status] ?? status.toLowerCase();
}

export const orderService = {
  async getAllOrdersForAdmin(filters: any) {
    const where: any = {};
    if (Array.isArray(filters?.status) && filters.status.length > 0) {
      where.status = {
        in: filters.status.map((status: string) => Object.entries(ORDER_STATUS_MAP).find(([, value]) => value === status)?.[0] ?? String(status).toUpperCase()),
      };
    } else if (typeof filters?.status === 'string' && filters.status.trim() !== '') {
      where.status = (Object.entries(ORDER_STATUS_MAP).find(([, value]) => value === filters.status)?.[0] ?? String(filters.status).toUpperCase());
    }

    if (filters?.search) {
      where.OR = [
        { id: Number.isNaN(Number(filters.search)) ? undefined : Number(filters.search) },
        { user: { name: { contains: filters.search } } },
        { user: { email: { contains: filters.search } } },
      ].filter(Boolean);
    }

    if (filters?.userId) where.userId = filters.userId;

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        deliveryDriver: { select: { name: true } },
        items: { include: { product: true, variant: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      orders: orders.map((o: any) => ({
        ...o,
        status: mapStatus(o.status),
        customerName: o.user.name,
        customerEmail: o.user.email,
        deliveryDriverName: o.deliveryDriver?.name ?? null,
        total: Number(o.total),
        subtotal: Number(o.subtotal),
        coupon_discount: Number(o.couponDiscount),
        shipping_cost: Number(o.shippingCost),
        delivery_date: o.deliveryDate?.toISOString().slice(0, 10) ?? '',
        delivery_time_slot: o.deliveryTimeSlot,
        delivery_notes: o.deliveryNotes,
        created_at: o.createdAt.toISOString(),
        updated_at: o.updatedAt.toISOString(),
      })),
      total: orders.length,
    };
  },

  async getOrdersForUser(userId: number): Promise<Order[]> {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { product: { include: { images: { where: { isPrimary: true, variantId: null }, take: 1 } } }, variant: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((o: any) => ({
      id: o.id,
      user_id: o.userId,
      customerName: o.user.name,
      customerEmail: o.user.email,
      status: mapStatus(o.status) as OrderStatus,
      subtotal: Number(o.subtotal),
      total: Number(o.total),
      shipping_cost: Number(o.shippingCost),
      shippingAddress: o.shippingAddressSnapshot ?? '',
      delivery_date: o.deliveryDate?.toISOString().slice(0, 10) ?? '',
      delivery_time_slot: o.deliveryTimeSlot,
      dedication: o.dedication,
      is_anonymous: o.isAnonymous,
      signature: o.signature,
      created_at: o.createdAt.toISOString(),
      items: o.items.map((it: any) => ({
        product_id: it.productId,
        quantity: it.quantity,
        price: Number(it.unitPrice),
        product_name: it.productNameSnap,
        image: it.imageSnap ?? it.product.images[0]?.src ?? '',
      })),
    } as unknown as Order));
  },

  async getOrderDetails(orderId: number): Promise<Order | null> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { name: true, email: true } }, items: { include: { product: true, variant: true } } },
    });
    if (!order) return null;

    return {
      id: order.id,
      user_id: order.userId,
      customerName: order.user.name,
      customerEmail: order.user.email,
      status: mapStatus(order.status) as OrderStatus,
      subtotal: Number(order.subtotal),
      total: Number(order.total),
      shipping_cost: Number(order.shippingCost),
      shippingAddress: order.shippingAddressSnapshot ?? '',
      delivery_date: order.deliveryDate?.toISOString().slice(0, 10) ?? '',
      delivery_time_slot: order.deliveryTimeSlot,
      dedication: order.dedication,
      is_anonymous: order.isAnonymous,
      signature: order.signature,
      created_at: order.createdAt.toISOString(),
      items: order.items.map((it: any) => ({
        product_id: it.productId,
        quantity: it.quantity,
        price: Number(it.unitPrice),
        product_name: it.productNameSnap,
        image: it.imageSnap ?? '',
      })),
    } as unknown as Order;
  },

  async updateOrderStatus(orderId: number, newStatus: OrderStatus, payload: any): Promise<boolean> {
    const prismaStatus = Object.entries(ORDER_STATUS_MAP).find(([, v]) => v === newStatus)?.[0] ?? (newStatus as string).toUpperCase();
    await prisma.order.update({ where: { id: orderId }, data: { status: prismaStatus as any, ...payload } });
    return true;
  },

  async initializeCheckout(params: any) {
    const cartData = await cartService.getCartContents({ userId: params.userId, sessionId: params.sessionId });

    if (!cartData.items || cartData.items.length === 0) {
      throw new Error('El carrito está vacío.');
    }

    const subtotal = cartData.subtotal;
    const shippingCost = params.shippingCost ?? 0;
    const total = subtotal + shippingCost;

    const newOrder = await prisma.order.create({
      data: {
        userId: params.userId,
        addressId: params.addressId ?? null,
        shippingAddressSnapshot: params.shippingAddressSnapshot ?? null,
        status: 'PENDING',
        subtotal,
        shippingCost,
        total,
        deliveryDate: new Date(params.deliveryDate ?? params.p_delivery_date),
        deliveryTimeSlot: params.deliveryTimeSlot ?? params.p_delivery_time_slot ?? '',
        dedication: params.dedication ?? null,
        isAnonymous: params.isAnonymous ?? false,
        signature: params.signature ?? null,
        items: {
          create: cartData.items.map(it => ({
            productId: it.id,
            variantId: it.variants?.[0]?.id ?? null,
            productNameSnap: it.name,
            variantNameSnap: it.variants?.[0]?.name ?? null,
            imageSnap: it.image ?? null,
            quantity: it.quantity,
            unitPrice: it.price,
          })),
        },
      },
    });

    return {
      orderId: newOrder.id,
      total,
      customerEmail: '',
      orderToken: `token_${newOrder.id}`,
    };
  },

  async finalizeOrderFromWebhook(params: any) {
    await prisma.order.update({ where: { id: params.orderId }, data: { status: 'PROCESSING' } });
    return { success: true, orderId: params.orderId };
  },
};
