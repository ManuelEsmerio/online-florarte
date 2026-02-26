// src/services/orderService.ts
import { prisma } from '@/lib/prisma';
import { cartService } from './cartService';
import type { DbCartItem, Order, OrderStatus } from '@/lib/definitions';

const paymentTransactionModel = (prisma as unknown as {
  paymentTransaction: {
    findMany: (args: any) => Promise<any[]>;
    findFirst: (args: any) => Promise<any | null>;
  };
}).paymentTransaction;

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

function normalizeGuestName(value: unknown): string | null {
  const normalized = String(value ?? '').trim().replace(/\s+/g, ' ');
  if (!normalized) return null;
  return normalized;
}

function normalizeGuestEmail(value: unknown): string | null {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (!normalized) return null;
  return normalized;
}

function normalizeGuestPhone(value: unknown): string | null {
  const normalized = String(value ?? '').replace(/\D/g, '').slice(0, 10);
  if (!normalized) return null;
  return normalized;
}

function isValidGuestEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const getPaymentTransactionModel = (dbClient: any) => {
  return (dbClient as {
    paymentTransaction: {
      upsert: (args: any) => Promise<any>;
    };
  }).paymentTransaction;
};

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

    const page = Math.max(1, Number(filters?.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(filters?.limit ?? 50)));
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { name: true, email: true } },
          deliveryDriver: { select: { name: true } },
          items: { include: { product: true, variant: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders: orders.map((o: any) => ({
        ...o,
        status: mapStatus(o.status),
        customerName: o.user?.name ?? o.guestName ?? 'Cliente invitado',
        customerEmail: o.user?.email ?? o.guestEmail ?? '',
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
      total,
      page,
      limit,
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

    const orderIds = orders.map((order: any) => order.id);
    const transactions = orderIds.length > 0
      ? await paymentTransactionModel.findMany({
          where: { orderId: { in: orderIds } },
          orderBy: { createdAt: 'desc' },
        })
      : [];

    const latestPaymentStatusByOrderId = new Map<number, string>();
    const hasPaymentTransactionByOrderId = new Map<number, boolean>();
    for (const transaction of transactions) {
      hasPaymentTransactionByOrderId.set(transaction.orderId, true);
      if (!latestPaymentStatusByOrderId.has(transaction.orderId)) {
        latestPaymentStatusByOrderId.set(transaction.orderId, transaction.status);
      }
    }

    return orders.map((o: any) => ({
      id: o.id,
      user_id: o.userId,
      customerName: o.user.name,
      customerEmail: o.user.email,
      status: mapStatus(o.status) as OrderStatus,
      subtotal: Number(o.subtotal),
      total: Number(o.total),
      shipping_cost: Number(o.shippingCost),
      recipientName: o.recipientName,
      recipientPhone: o.recipientPhone,
      payment_status: latestPaymentStatusByOrderId.get(o.id) ?? 'PENDING',
      has_payment_transaction: hasPaymentTransactionByOrderId.get(o.id) ?? false,
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

    const latestPaymentTransaction = await paymentTransactionModel.findFirst({
      where: { orderId: order.id },
      orderBy: { createdAt: 'desc' },
    });

    return {
      id: order.id,
      user_id: order.userId,
      customerName: order.user?.name ?? order.guestName ?? 'Cliente invitado',
      customerEmail: order.user?.email ?? order.guestEmail ?? '',
      status: mapStatus(order.status) as OrderStatus,
      subtotal: Number(order.subtotal),
      total: Number(order.total),
      shipping_cost: Number(order.shippingCost),
      recipientName: order.recipientName,
      recipientPhone: order.recipientPhone,
      payment_status: latestPaymentTransaction?.status ?? 'PENDING',
      has_payment_transaction: Boolean(latestPaymentTransaction),
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
    const normalizedUserId = Number.isFinite(Number(params.userId))
      ? Number(params.userId)
      : null;
    const normalizedSessionId = String(params.sessionId ?? '').trim() || null;
    const isGuest = !normalizedUserId;

    if (!normalizedUserId && !normalizedSessionId) {
      throw new Error('No se pudo identificar la sesión del carrito.');
    }

    const guestName = normalizeGuestName(params.guestName);
    const guestEmail = normalizeGuestEmail(params.guestEmail);
    const guestPhone = normalizeGuestPhone(params.guestPhone ?? params.recipientPhone);

    if (isGuest) {
      if (!guestName) {
        throw new Error('El nombre completo es obligatorio para compras como invitado.');
      }
      if (!guestEmail || !isValidGuestEmail(guestEmail)) {
        throw new Error('El email es obligatorio y debe tener un formato válido para compras como invitado.');
      }
      if (!guestPhone || guestPhone.length !== 10) {
        throw new Error('El teléfono debe contener 10 dígitos para compras como invitado.');
      }
    }

    const cartData = await cartService.getCartContents({ userId: normalizedUserId, sessionId: normalizedSessionId });

    if (!cartData.items || cartData.items.length === 0) {
      throw new Error('El carrito está vacío.');
    }

    const subtotal = cartData.subtotal;
    const shippingCost = params.shippingCost ?? 0;
    const total = subtotal + shippingCost;

    const selectedAddress = params.addressId
      ? await prisma.address.findFirst({
          where: {
            id: Number(params.addressId),
            ...(normalizedUserId ? { userId: normalizedUserId } : {}),
            isDeleted: false,
          },
        })
      : null;

    const recipientName = params.recipientName ?? selectedAddress?.recipientName ?? guestName ?? null;
    const recipientPhone = params.recipientPhone ?? selectedAddress?.recipientPhone ?? guestPhone ?? null;
    const shippingAddressSnapshot =
      params.shippingAddressSnapshot
      ?? (selectedAddress
        ? `${selectedAddress.streetName} ${selectedAddress.streetNumber}${selectedAddress.interiorNumber ? ` Int. ${selectedAddress.interiorNumber}` : ''}, ${selectedAddress.neighborhood}, ${selectedAddress.city}, ${selectedAddress.state}, CP ${selectedAddress.postalCode}`
        : (isGuest ? 'Compra como invitado - dirección por confirmar' : null));

    const orderItemsToCreate = cartData.items.map((item: DbCartItem, index: number) => {
      if (!Number.isFinite(item.product_id) || !Number.isFinite(item.unit_price) || !Number.isFinite(item.quantity) || item.quantity < 1) {
        throw new Error(`Ítem inválido en carrito (posición ${index + 1}).`);
      }

      return {
        productId: item.product_id,
        variantId: item.variant_id ?? null,
        productNameSnap: item.product_name ?? 'Producto',
        variantNameSnap: item.variant_name ?? null,
        imageSnap: item.variant_image ?? item.product_image ?? null,
        quantity: item.quantity,
        unitPrice: item.unit_price,
      };
    });

    const newOrder = await prisma.order.create({
      data: {
        userId: normalizedUserId,
        isGuest,
        guestName: isGuest ? guestName : null,
        guestEmail: isGuest ? guestEmail : null,
        guestPhone: isGuest ? guestPhone : null,
        sessionId: normalizedSessionId,
        addressId: params.addressId ?? null,
        shippingAddressSnapshot,
        recipientName,
        recipientPhone,
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
          create: orderItemsToCreate,
        },
      },
    });

    return {
      orderId: newOrder.id,
      total,
      customerEmail: isGuest ? (guestEmail ?? '') : '',
      orderToken: `token_${newOrder.id}`,
    };
  },

  async finalizeOrderFromWebhook(params: any) {
    await prisma.order.update({ where: { id: params.orderId }, data: { status: 'PENDING' } });
    return { success: true, orderId: params.orderId };
  },

  async finalizeSuccessfulPaymentFromWebhook(params: {
    orderId: number;
    externalPaymentId: string;
    gateway: 'stripe' | 'mercadopago';
    amount: number;
  }) {
    await prisma.$transaction(async (tx: any) => {
      const paymentTxModel = getPaymentTransactionModel(tx);

      await tx.order.update({
        where: { id: params.orderId },
        data: { status: 'PENDING' },
      });

      await paymentTxModel.upsert({
        where: { externalPaymentId: params.externalPaymentId },
        create: {
          orderId: params.orderId,
          externalPaymentId: params.externalPaymentId,
          gateway: params.gateway,
          amount: params.amount,
          status: 'SUCCEEDED',
        },
        update: {
          orderId: params.orderId,
          amount: params.amount,
          status: 'SUCCEEDED',
        },
      });
    });

    return { success: true, orderId: params.orderId };
  },

  async registerFailedPaymentFromWebhook(params: {
    orderId: number;
    externalPaymentId: string;
    gateway: 'stripe' | 'mercadopago';
    amount: number;
  }) {
    await prisma.$transaction(async (tx: any) => {
      const paymentTxModel = getPaymentTransactionModel(tx);

      await paymentTxModel.upsert({
        where: { externalPaymentId: params.externalPaymentId },
        create: {
          orderId: params.orderId,
          externalPaymentId: params.externalPaymentId,
          gateway: params.gateway,
          amount: params.amount,
          status: 'FAILED',
        },
        update: {
          orderId: params.orderId,
          amount: params.amount,
          status: 'FAILED',
        },
      });
    });

    return { success: true, orderId: params.orderId };
  },
};
