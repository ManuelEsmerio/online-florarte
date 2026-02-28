// src/services/orderService.ts
import { prisma } from '@/lib/prisma';
import { cartService } from './cartService';
import { orderAddressService } from './orderAddressService';
import { orderEmailService } from './orderEmailService';
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

function normalizeGuestText(value: unknown): string | null {
  const normalized = String(value ?? '').trim().replace(/\s+/g, ' ');
  return normalized || null;
}

function isValidGuestEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function asNumberOrNull(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function calculateCouponDiscount(
  subtotal: number,
  coupon: { discountType?: string; discount_type?: string; discountValue?: number; discount_value?: number } | null,
): number {
  if (!coupon) return 0;
  const discountType = String(coupon.discountType ?? coupon.discount_type ?? '').toUpperCase();
  const discountValue = Number(coupon.discountValue ?? coupon.discount_value ?? 0);
  if (!Number.isFinite(discountValue) || discountValue <= 0) return 0;

  if (discountType === 'PERCENTAGE') {
    return Math.min(subtotal, subtotal * (discountValue / 100));
  }

  return Math.min(subtotal, discountValue);
}

const getPaymentTransactionModel = (dbClient: any) => {
  return (dbClient as {
    paymentTransaction: {
      findFirst: (args: any) => Promise<any | null>;
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
        { guestName: { contains: filters.search } },
        { guestEmail: { contains: filters.search } },
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
          orderAddress: true,
          deliveryDriver: { select: { name: true } },
          items: { include: { product: true, variant: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    const orderIds = orders.map((order: any) => order.id);
    const transactions = orderIds.length > 0
      ? await paymentTransactionModel.findMany({
          where: { orderId: { in: orderIds } },
          orderBy: { createdAt: 'desc' },
        })
      : [];

    const latestPaymentGatewayByOrderId = new Map<number, string>();
    for (const transaction of transactions) {
      if (!latestPaymentGatewayByOrderId.has(transaction.orderId)) {
        latestPaymentGatewayByOrderId.set(transaction.orderId, String(transaction.gateway ?? '').toLowerCase());
      }
    }

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
        recipientName: o.orderAddress?.recipientName ?? null,
        recipientPhone: o.orderAddress?.recipientPhone ?? null,
        shippingAddress: o.orderAddress?.formattedAddress ?? 'Dirección por confirmar',
        delivery_date: o.deliveryDate?.toISOString().slice(0, 10) ?? '',
        delivery_time_slot: o.deliveryTimeSlot,
        delivery_notes: o.deliveryNotes,
        created_at: o.createdAt.toISOString(),
        updated_at: o.updatedAt.toISOString(),
        payment_gateway: latestPaymentGatewayByOrderId.get(o.id) ?? null,
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
        orderAddress: true,
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
      recipientName: o.orderAddress?.recipientName ?? null,
      recipientPhone: o.orderAddress?.recipientPhone ?? null,
      payment_status: latestPaymentStatusByOrderId.get(o.id) ?? 'PENDING',
      has_payment_transaction: hasPaymentTransactionByOrderId.get(o.id) ?? false,
      shippingAddress: o.orderAddress?.formattedAddress ?? '',
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
      include: {
        user: { select: { name: true, email: true } },
        coupon: { select: { code: true, discountType: true, discountValue: true } },
        orderAddress: true,
        items: { include: { product: true, variant: true } },
      },
    });
    if (!order) return null;

    const latestPaymentTransaction = await paymentTransactionModel.findFirst({
      where: { orderId: order.id },
      orderBy: { createdAt: 'desc' },
    });

    return {
      id: order.id,
      user_id: order.userId,
      is_guest: order.isGuest,
      guest_name: order.guestName,
      guest_email: order.guestEmail,
      guest_phone: order.guestPhone,
      customerName: order.user?.name ?? order.guestName ?? 'Cliente invitado',
      customerEmail: order.user?.email ?? order.guestEmail ?? '',
      status: mapStatus(order.status) as OrderStatus,
      subtotal: Number(order.subtotal),
      coupon_id: order.couponId ?? null,
      coupon_code: order.couponCodeSnap ?? order.coupon?.code ?? null,
      coupon_type: order.coupon?.discountType ?? null,
      coupon_value: order.coupon?.discountValue ? Number(order.coupon.discountValue) : null,
      coupon_discount: Number(order.couponDiscount ?? 0),
      total: Number(order.total),
      shipping_cost: Number(order.shippingCost),
      recipientName: order.orderAddress?.recipientName ?? null,
      recipientPhone: order.orderAddress?.recipientPhone ?? null,
      payment_status: latestPaymentTransaction?.status ?? 'PENDING',
      payment_gateway: latestPaymentTransaction?.gateway ?? null,
      has_payment_transaction: Boolean(latestPaymentTransaction),
      shippingAddress: order.orderAddress?.formattedAddress ?? '',
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
        image: it.imageSnap ?? it.product?.mainImage ?? '',
      })),
    } as unknown as Order;
  },

  async updateOrderStatus(orderId: number, newStatus: OrderStatus, payload: any): Promise<boolean> {
    const prismaStatus = Object.entries(ORDER_STATUS_MAP).find(([, v]) => v === newStatus)?.[0] ?? (newStatus as string).toUpperCase();
    await prisma.order.update({ where: { id: orderId }, data: { status: prismaStatus as any, ...payload } });
    return true;
  },

  async initializeCheckout(params: any) {
    const requestedUserId = Number.isFinite(Number(params.userId))
      ? Number(params.userId)
      : null;
    const normalizedSessionId = String(params.sessionId ?? '').trim() || null;
    const validUser = requestedUserId
      ? await prisma.user.findUnique({ where: { id: requestedUserId }, select: { id: true } })
      : null;
    const normalizedUserId = validUser?.id ?? null;
    const isGuest = !normalizedUserId;

    if (!normalizedUserId && !normalizedSessionId) {
      throw new Error('No se pudo identificar la sesión del carrito.');
    }

    const guestName = normalizeGuestName(params.guestName);
    const guestEmail = normalizeGuestEmail(params.guestEmail);
    const guestPhone = normalizeGuestPhone(params.guestPhone ?? params.recipientPhone);
    const guestAddressAlias = normalizeGuestText(params.guestAddressAlias);
    const guestStreetName = normalizeGuestText(params.guestStreetName);
    const guestStreetNumber = normalizeGuestText(params.guestStreetNumber);
    const guestInteriorNumber = normalizeGuestText(params.guestInteriorNumber);
    const guestNeighborhood = normalizeGuestText(params.guestNeighborhood);
    const guestCity = normalizeGuestText(params.guestCity);
    const guestState = normalizeGuestText(params.guestState) ?? 'Jalisco';
    const guestPostalCode = normalizeGuestText(params.guestPostalCode);
    const guestReferenceNotes = normalizeGuestText(params.guestReferenceNotes);

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
      if (!guestStreetName || !guestStreetNumber || !guestNeighborhood || !guestCity || !guestPostalCode) {
        throw new Error('La dirección de envío es obligatoria para compras como invitado.');
      }
    }

    let cartData = await cartService.getCartContents({ userId: normalizedUserId, sessionId: normalizedSessionId });

    if (!cartData.items || cartData.items.length === 0) {
      throw new Error('El carrito está vacío.');
    }

    const couponCodeFromPayload = String(params.couponCode ?? '').trim().toUpperCase();
    let appliedCoupon: {
      id: number;
      code: string;
      discountType?: string;
      discountValue?: number;
      maxUses?: number | null;
      usesCount?: number;
    } | null = null;

    if (normalizedUserId) {
      const couponCodeFromCart = String(cartData.coupon?.code ?? '').trim().toUpperCase();
      const couponCode = couponCodeFromPayload || couponCodeFromCart;

      if (couponCode) {
        const validatedCoupon = await cartService.applyCouponToCart({
          userId: normalizedUserId,
          sessionId: normalizedSessionId,
          couponCode,
          deliveryDate: params.deliveryDate ?? params.p_delivery_date ?? null,
        });

        appliedCoupon = {
          id: validatedCoupon.id,
          code: validatedCoupon.code,
          discountType: validatedCoupon.discountType,
          discountValue: Number(validatedCoupon.discountValue ?? 0),
          maxUses: validatedCoupon.maxUses,
          usesCount: validatedCoupon.usesCount,
        };

        cartData = await cartService.getCartContents({ userId: normalizedUserId, sessionId: normalizedSessionId });
      }
    }

    const subtotal = cartData.subtotal;
    const shippingCost = params.shippingCost ?? 0;
    const couponDiscount = calculateCouponDiscount(subtotal, appliedCoupon ?? (cartData.coupon ?? null));
    const total = Math.max(0, subtotal - couponDiscount + shippingCost);

    if (normalizedUserId && !params.addressId) {
      throw new Error('Debes seleccionar una dirección guardada para completar tu compra.');
    }

    const selectedAddress = normalizedUserId && params.addressId
      ? await prisma.address.findFirst({
          where: {
            id: Number(params.addressId),
            userId: normalizedUserId,
            isDeleted: false,
          },
        })
      : null;

    if (normalizedUserId && params.addressId && !selectedAddress) {
      throw new Error('La dirección seleccionada no existe o no pertenece al usuario.');
    }

    const snapshotData = selectedAddress
      ? orderAddressService.normalizeSnapshot({
          sourceAddressId: selectedAddress.id,
          alias: selectedAddress.alias,
          recipientName: params.recipientName ?? selectedAddress.recipientName,
          recipientPhone: params.recipientPhone ?? selectedAddress.recipientPhone,
          streetName: selectedAddress.streetName,
          streetNumber: selectedAddress.streetNumber,
          interiorNumber: selectedAddress.interiorNumber,
          neighborhood: selectedAddress.neighborhood,
          city: selectedAddress.city,
          state: selectedAddress.state,
          country: selectedAddress.country,
          postalCode: selectedAddress.postalCode,
          addressType: selectedAddress.addressType,
          referenceNotes: selectedAddress.referenceNotes,
          latitude: asNumberOrNull(selectedAddress.latitude),
          longitude: asNumberOrNull(selectedAddress.longitude),
          googlePlaceId: selectedAddress.googlePlaceId,
          isGuestAddress: false,
        })
      : orderAddressService.normalizeSnapshot({
          alias: guestAddressAlias,
          recipientName: params.recipientName ?? guestName ?? 'Cliente invitado',
          recipientPhone: params.recipientPhone ?? guestPhone,
          streetName: guestStreetName,
          streetNumber: guestStreetNumber,
          interiorNumber: guestInteriorNumber,
          neighborhood: guestNeighborhood,
          city: guestCity,
          state: guestState,
          country: 'México',
          postalCode: guestPostalCode,
          referenceNotes: guestReferenceNotes,
          formattedAddress: params.shippingAddressSnapshot ?? null,
          isGuestAddress: true,
        });

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

    const newOrder = await prisma.$transaction(async (tx: any) => {
      if (appliedCoupon && normalizedUserId) {
        const alreadyUsedByUser = await tx.order.findFirst({
          where: {
            userId: normalizedUserId,
            couponId: appliedCoupon.id,
            status: { not: 'CANCELLED' },
          },
          select: { id: true },
        });

        if (alreadyUsedByUser) {
          throw new Error('Este cupón ya fue utilizado por tu cuenta.');
        }
      }

      const createdOrder = await tx.order.create({
        data: {
          userId: normalizedUserId,
          isGuest,
          guestName: isGuest ? guestName : null,
          guestEmail: isGuest ? guestEmail : null,
          guestPhone: isGuest ? guestPhone : null,
          sessionId: normalizedSessionId,
          couponId: appliedCoupon?.id ?? null,
          couponCodeSnap: appliedCoupon?.code ?? null,
          status: 'PENDING',
          subtotal,
          couponDiscount,
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

      await tx.orderAddress.create({
        data: {
          orderId: createdOrder.id,
          ...snapshotData,
        },
      });

      if (appliedCoupon) {
        const couponUpdateWhere: any = {
          id: appliedCoupon.id,
          isDeleted: false,
          status: 'ACTIVE',
        };

        if (Number.isFinite(Number(appliedCoupon.maxUses)) && appliedCoupon.maxUses !== null) {
          couponUpdateWhere.usesCount = { lt: Number(appliedCoupon.maxUses) };
        }

        const couponUpdateResult = await tx.coupon.updateMany({
          where: couponUpdateWhere,
          data: {
            usesCount: { increment: 1 },
          },
        });

        if (couponUpdateResult.count !== 1) {
          throw new Error('No se pudo reservar el cupón para este pedido. Intenta nuevamente.');
        }
      }

      const activeCart = await tx.cart.findFirst({
        where: {
          status: 'ACTIVE',
          ...(normalizedUserId ? { userId: normalizedUserId } : { sessionId: normalizedSessionId }),
        },
        select: { id: true },
      });

      if (activeCart?.id) {
        await tx.cart.update({
          where: { id: activeCart.id },
          data: { couponId: null, couponCode: null },
        });
      }

      return createdOrder;
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
    const shouldSendEmails = await prisma.$transaction(async (tx: any) => {
      const paymentTxModel = getPaymentTransactionModel(tx);
      const existingTransaction = await paymentTxModel.findFirst({
        where: { externalPaymentId: params.externalPaymentId },
        select: { status: true },
      });

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

      return existingTransaction?.status !== 'SUCCEEDED';
    });

    if (shouldSendEmails) {
      try {
        await orderEmailService.sendOrderConfirmationAndAdminNotification(params.orderId);
      } catch (error) {
        console.error('[ORDER_EMAIL_SEND_ERROR]', error);
      }
    }

    return { success: true, orderId: params.orderId };
  },

  async registerFailedPaymentFromWebhook(params: {
    orderId: number;
    externalPaymentId: string;
    gateway: 'stripe' | 'mercadopago';
    amount: number;
  }) {
    const shouldSendFailureEmail = await prisma.$transaction(async (tx: any) => {
      const paymentTxModel = getPaymentTransactionModel(tx);
      const existingTransaction = await paymentTxModel.findFirst({
        where: { externalPaymentId: params.externalPaymentId },
        select: { status: true },
      });

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

      return existingTransaction?.status !== 'FAILED';
    });

    if (shouldSendFailureEmail) {
      try {
        await orderEmailService.sendFailedPaymentAdminNotification(params.orderId);
      } catch (error) {
        console.error('[ORDER_FAILED_PAYMENT_EMAIL_ERROR]', error);
      }
    }

    return { success: true, orderId: params.orderId };
  },
};
