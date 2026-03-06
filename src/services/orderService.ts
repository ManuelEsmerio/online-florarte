// src/services/orderService.ts
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { resolveShippingCost } from '@/lib/checkout/resolveShippingCost';
import { cartService } from './cartService';
import { orderAddressService } from './orderAddressService';
import { orderEmailService } from './orderEmailService';
import { stripeService } from './stripeService';
import type { DbCartItem, Order, OrderStatus } from '@/lib/definitions';
import { UserFacingError } from '@/utils/errors';

const ORDER_STATUS_MAP: Record<string, string> = {
  PENDING: 'pendiente',
  PAYMENT_FAILED: 'pago_fallido',
  PROCESSING: 'procesando',
  SHIPPED: 'en_reparto',
  DELIVERED: 'completado',
  CANCELLED: 'cancelado',
  EXPIRED: 'expirado',
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
      update: (args: any) => Promise<any>;
      upsert: (args: any) => Promise<any>;
    };
  }).paymentTransaction;
};

type SupportedGateway = 'stripe' | 'mercadopago' | 'paypal';

type PaymentUpsertParams = {
  orderId: number;
  externalPaymentId: string;
  gateway: SupportedGateway;
  amount: number;
  status: 'SUCCEEDED' | 'FAILED';
};

async function safeUpsertPaymentTransaction(model: any, params: PaymentUpsertParams) {
  try {
    await model.upsert({
      where: { externalPaymentId: params.externalPaymentId },
      create: {
        orderId: params.orderId,
        externalPaymentId: params.externalPaymentId,
        gateway: params.gateway,
        amount: params.amount,
        status: params.status,
      },
      update: {
        orderId: params.orderId,
        amount: params.amount,
        status: params.status,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      await model.update({
        where: { externalPaymentId: params.externalPaymentId },
        data: {
          orderId: params.orderId,
          amount: params.amount,
          status: params.status,
        },
      });
      return;
    }

    throw error;
  }
}

function ensureValidDeliveryDate(rawValue: unknown): Date {
  if (!rawValue) {
    throw new UserFacingError('Debes seleccionar una fecha de entrega.');
  }

  const deliveryDate = new Date(rawValue as any);
  if (Number.isNaN(deliveryDate.getTime())) {
    throw new UserFacingError('La fecha de entrega proporcionada es inválida.');
  }

  const now = Date.now();
  if (deliveryDate.getTime() < now - 60 * 60 * 1000) {
    throw new UserFacingError('La fecha de entrega no puede estar en el pasado.');
  }

  return deliveryDate;
}

const mapTestimonialSnapshot = (testimonial?: any) => {
  if (!testimonial) return null;
  return {
    id: testimonial.id,
    userId: testimonial.userId,
    orderId: testimonial.orderId,
    rating: testimonial.rating,
    comment: testimonial.comment,
    userName: testimonial.userName,
    userProfilePic: testimonial.userProfilePic,
    status: testimonial.status,
    createdAt: testimonial.createdAt,
    updatedAt: testimonial.updatedAt,
  };
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
      ? await prisma.paymentTransaction.findMany({
          where: { orderId: { in: orderIds } },
          orderBy: { createdAt: 'desc' },
        })
      : [];

    const latestPaymentGatewayByOrderId = new Map<number, string>();
    const latestPaymentStatusByOrderId = new Map<number, string>();
    const hasPaymentTransactionByOrderId = new Map<number, boolean>();
    for (const transaction of transactions) {
      if (!latestPaymentGatewayByOrderId.has(transaction.orderId)) {
        latestPaymentGatewayByOrderId.set(transaction.orderId, String(transaction.gateway ?? '').toLowerCase());
      }
      if (!latestPaymentStatusByOrderId.has(transaction.orderId)) {
        latestPaymentStatusByOrderId.set(transaction.orderId, String(transaction.status ?? '').toUpperCase());
      }
      hasPaymentTransactionByOrderId.set(transaction.orderId, true);
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
        deliveryNotes: o.deliveryNotes ?? o.orderAddress?.referenceNotes ?? null,
        delivery_notes: o.deliveryNotes ?? o.orderAddress?.referenceNotes ?? null,
        created_at: o.createdAt.toISOString(),
        updated_at: o.updatedAt.toISOString(),
        payment_gateway: latestPaymentGatewayByOrderId.get(o.id) ?? null,
        payment_status: latestPaymentStatusByOrderId.get(o.id) ?? null,
        has_payment_transaction: hasPaymentTransactionByOrderId.get(o.id) ?? false,
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
        testimonial: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const orderIds = orders.map((order: any) => order.id);
    const transactions = orderIds.length > 0
      ? await prisma.paymentTransaction.findMany({
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

    return orders.map((o: any) => {
      const deliveryDateIso = o.deliveryDate ? o.deliveryDate.toISOString() : null;
      const createdAtIso = o.createdAt.toISOString();
      const updatedAtIso = o.updatedAt.toISOString();
      const paymentStatus = latestPaymentStatusByOrderId.get(o.id) ?? 'PENDING';
      const hasPaymentTx = hasPaymentTransactionByOrderId.get(o.id) ?? false;
      const shippingAddress = o.orderAddress?.formattedAddress ?? '';
      const recipientName = o.orderAddress?.recipientName ?? null;
      const recipientPhone = o.orderAddress?.recipientPhone ?? null;

      const items = o.items.map((it: any) => ({
        id: it.id,
        orderId: it.orderId,
        productId: it.productId,
        variantId: it.variantId,
        productNameSnap: it.productNameSnap,
        variantNameSnap: it.variantNameSnap,
        imageSnap: it.imageSnap ?? it.product?.images?.[0]?.src ?? null,
        quantity: it.quantity,
        unitPrice: Number(it.unitPrice),
        customPhotoUrl: it.customPhotoUrl ?? null,
        createdAt: it.createdAt?.toISOString?.() ?? null,
      }));

      return {
        id: o.id,
        userId: o.userId,
        user_id: o.userId,
        customerName: o.user?.name ?? o.guestName ?? 'Cliente invitado',
        customerEmail: o.user?.email ?? o.guestEmail ?? '',
        status: o.status as OrderStatus,
        subtotal: Number(o.subtotal),
        couponDiscount: Number(o.couponDiscount ?? 0),
        coupon_discount: Number(o.couponDiscount ?? 0),
        shippingCost: Number(o.shippingCost ?? 0),
        shipping_cost: Number(o.shippingCost ?? 0),
        total: Number(o.total),
        deliveryDate: deliveryDateIso,
        delivery_date: deliveryDateIso,
        deliveryTimeSlot: o.deliveryTimeSlot ?? '',
        delivery_time_slot: o.deliveryTimeSlot ?? '',
        dedication: o.dedication ?? null,
        deliveryNotes: o.deliveryNotes ?? o.orderAddress?.referenceNotes ?? null,
        isAnonymous: Boolean(o.isAnonymous),
        is_anonymous: Boolean(o.isAnonymous),
        signature: o.signature ?? null,
        createdAt: createdAtIso,
        created_at: createdAtIso,
        updatedAt: updatedAtIso,
        updated_at: updatedAtIso,
        payment_status: paymentStatus,
        has_payment_transaction: hasPaymentTx,
        shippingAddress,
        shipping_address_snapshot: shippingAddress,
        recipientName,
        recipient_name: recipientName,
        recipientPhone,
        recipient_phone: recipientPhone,
        items,
        testimonial: mapTestimonialSnapshot(o.testimonial),
      } as unknown as Order;
    });
  },

  async getOrderDetails(orderId: number): Promise<Order | null> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        coupon: { select: { code: true, discountType: true, discountValue: true } },
        orderAddress: true,
        items: { include: { product: true, variant: true } },
        testimonial: true,
      },
    });
    if (!order) return null;

    const latestPaymentTransaction = await prisma.paymentTransaction.findFirst({
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
      customerPhone: order.user?.phone ?? order.guestPhone ?? null,
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
      deliveryNotes: order.deliveryNotes ?? order.orderAddress?.referenceNotes ?? null,
      delivery_notes: order.deliveryNotes ?? order.orderAddress?.referenceNotes ?? null,
      delivery_date: order.deliveryDate?.toISOString().slice(0, 10) ?? '',
      delivery_time_slot: order.deliveryTimeSlot,
      dedication: order.dedication,
      is_anonymous: order.isAnonymous,
      signature: order.signature,
      created_at: order.createdAt.toISOString(),
      testimonial: mapTestimonialSnapshot(order.testimonial),
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
    const statusChanged = await prisma.$transaction(async (tx: any) => {
      const current = await tx.order.findUnique({ where: { id: orderId }, select: { status: true } });
      if (!current) {
        throw new UserFacingError('Pedido no encontrado.');
      }

      const latestPayment = await tx.paymentTransaction.findFirst({
        where: { orderId },
        orderBy: { createdAt: 'desc' },
        select: { status: true },
      });

      const latestPaymentStatus = String(latestPayment?.status ?? '').toUpperCase();
      const isPaid = latestPaymentStatus === 'SUCCEEDED';
      const isCancelling = newStatus === 'CANCELLED';

      if (!isPaid && !isCancelling) {
        throw new UserFacingError('No puedes actualizar el estado de un pedido sin un pago confirmado.');
      }

      await tx.order.update({ where: { id: orderId }, data: { status: prismaStatus as any, ...payload } });
      return current.status !== prismaStatus;
    });

    if (statusChanged) {
      orderEmailService.sendOrderStatusChangeNotification(orderId, newStatus)
        .catch(error => console.error('[ORDER_STATUS_NOTIFICATION_ERROR]', error));
    }

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
    const normalizedAddressId = Number.isFinite(Number(params.addressId)) ? Number(params.addressId) : null;

    if (!normalizedUserId && !normalizedSessionId) {
      throw new UserFacingError('No se pudo identificar la sesión del carrito.');
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
    const deliveryDate = ensureValidDeliveryDate(params.deliveryDate ?? params.p_delivery_date);

    if (isGuest) {
      if (!guestName) {
        throw new UserFacingError('El nombre completo es obligatorio para compras como invitado.');
      }
      if (!guestEmail || !isValidGuestEmail(guestEmail)) {
        throw new UserFacingError('El email es obligatorio y debe tener un formato válido para compras como invitado.');
      }
      if (!guestPhone || guestPhone.length !== 10) {
        throw new UserFacingError('El teléfono debe contener 10 dígitos para compras como invitado.');
      }
      if (!guestStreetName || !guestStreetNumber || !guestNeighborhood || !guestCity || !guestPostalCode) {
        throw new UserFacingError('La dirección de envío es obligatoria para compras como invitado.');
      }
    }

    let cartData = await cartService.getCartContents({ userId: normalizedUserId, sessionId: normalizedSessionId });

    if (!cartData.items || cartData.items.length === 0) {
      throw new UserFacingError('El carrito está vacío.');
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
          deliveryDate: deliveryDate.toISOString(),
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

    if (normalizedUserId && !normalizedAddressId) {
      throw new UserFacingError('Debes seleccionar una dirección guardada para completar tu compra.');
    }

    const selectedAddress = normalizedUserId && normalizedAddressId
      ? await prisma.address.findFirst({
          where: {
            id: normalizedAddressId,
            userId: normalizedUserId,
            isDeleted: false,
          },
        })
      : null;

    if (normalizedUserId && normalizedAddressId && !selectedAddress) {
      throw new UserFacingError('La dirección seleccionada no existe o no pertenece al usuario.');
    }

    const resolvedShippingCost = await resolveShippingCost(
      selectedAddress?.id ?? normalizedAddressId,
      guestPostalCode,
    );
    const shippingCost = Number.isFinite(Number(resolvedShippingCost))
      ? Math.max(0, Number(resolvedShippingCost))
      : 0;

    const subtotal = cartData.subtotal;
    const couponDiscount = calculateCouponDiscount(subtotal, appliedCoupon ?? (cartData.coupon ?? null));
    const total = Math.max(0, Number((subtotal - couponDiscount + shippingCost).toFixed(2)));

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
        throw new UserFacingError(`Ítem inválido en carrito (posición ${index + 1}).`);
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
        const existingRedemption = await tx.couponRedemption.findUnique({
          where: {
            couponId_userId: {
              couponId: appliedCoupon.id,
              userId: normalizedUserId,
            },
          },
          select: { id: true },
        });

        if (existingRedemption) {
          throw new UserFacingError('Este cupón ya fue utilizado por tu cuenta.');
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

      // Deducir stock de cada ítem (atómico: si alguno falla, rollback completo)
      for (const item of orderItemsToCreate) {
        if (item.variantId) {
          const result = await tx.productVariant.updateMany({
            where: { id: item.variantId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (result.count !== 1) {
            throw new UserFacingError(`Stock insuficiente para "${item.productNameSnap}" (${item.variantNameSnap ?? 'variante'}).`);
          }
        } else {
          const result = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (result.count !== 1) {
            throw new UserFacingError(`Stock insuficiente para "${item.productNameSnap}".`);
          }
        }
      }

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
          throw new UserFacingError('No se pudo reservar el cupón para este pedido. Intenta nuevamente.');
        }
      }

      if (appliedCoupon && normalizedUserId) {
        await tx.couponRedemption.create({
          data: {
            couponId: appliedCoupon.id,
            userId: normalizedUserId,
            orderId: createdOrder.id,
          },
        });
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

  async finalizeSuccessfulPaymentFromWebhook(params: {
    orderId: number;
    externalPaymentId: string;
    gateway: SupportedGateway;
    amount: number;
  }) {
    let amountMismatchDetected = false;

    const { shouldSendEmails, cartIdentity } = await prisma.$transaction(
      async (tx: any) => {
        const paymentTxModel = getPaymentTransactionModel(tx);
        const [existingTransaction, order] = await Promise.all([
          paymentTxModel.findFirst({
            where: { externalPaymentId: params.externalPaymentId },
            select: { status: true },
          }),
          tx.order.findUnique({
            where: { id: params.orderId },
            select: { id: true, total: true, status: true, userId: true, sessionId: true },
          }),
        ]);

        if (!order) {
          throw new UserFacingError('Pedido no encontrado para registrar el pago.');
        }

        const orderTotal = Number(order.total);
        const normalizedAmount = Number(params.amount);
        if (!Number.isFinite(orderTotal) || !Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
          throw new UserFacingError('Monto del pedido o del pago inválido.');
        }

        if (Math.abs(orderTotal - normalizedAmount) > 0.5) {
          amountMismatchDetected = true;
          await safeUpsertPaymentTransaction(paymentTxModel, {
            orderId: params.orderId,
            externalPaymentId: params.externalPaymentId,
            gateway: params.gateway,
            amount: params.amount,
            status: 'FAILED',
          });
          return {
            shouldSendEmails: false,
            cartIdentity: { userId: order.userId ?? null, sessionId: order.sessionId ?? null },
          };
        }

        await safeUpsertPaymentTransaction(paymentTxModel, {
          orderId: params.orderId,
          externalPaymentId: params.externalPaymentId,
          gateway: params.gateway,
          amount: params.amount,
          status: 'SUCCEEDED',
        });

        // Advance from any pre-payment state to PROCESSING
        if (['PENDING', 'PAYMENT_FAILED'].includes(order.status)) {
          await tx.order.update({
            where: { id: params.orderId },
            data: { status: 'PROCESSING' },
          });
        }

        return {
          shouldSendEmails: existingTransaction?.status !== 'SUCCEEDED',
          cartIdentity: { userId: order.userId ?? null, sessionId: order.sessionId ?? null },
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted }
    );

    if (amountMismatchDetected) {
      console.error('[ORDER_PAYMENT_AMOUNT_MISMATCH]', {
        orderId: params.orderId,
        gateway: params.gateway,
        reportedAmount: params.amount,
      });
      await this.cancelAbandonedOrder(params.orderId);
      return { success: false, orderId: params.orderId };
    }

    if (cartIdentity?.userId || cartIdentity?.sessionId) {
      try {
        await cartService.clearCart({
          userId: cartIdentity.userId ?? null,
          sessionId: cartIdentity.sessionId ?? null,
        });
      } catch (error) {
        console.error('[ORDER_CLEAR_CART_AFTER_PAYMENT_ERROR]', {
          orderId: params.orderId,
          error,
        });
      }
    }

    if (shouldSendEmails) {
      orderEmailService.sendOrderConfirmationAndAdminNotification(params.orderId)
        .catch(error => console.error('[ORDER_EMAIL_SEND_ERROR]', error));
    }

    return { success: true, orderId: params.orderId };
  },

  async registerFailedPaymentFromWebhook(params: {
    orderId: number;
    externalPaymentId: string;
    gateway: SupportedGateway;
    amount: number;
  }) {
    const shouldSendFailureEmail = await prisma.$transaction(
      async (tx: any) => {
        const paymentTxModel = getPaymentTransactionModel(tx);
        const [existingTransaction, order] = await Promise.all([
          paymentTxModel.findFirst({
            where: { externalPaymentId: params.externalPaymentId },
            select: { status: true },
          }),
          tx.order.findUnique({
            where: { id: params.orderId },
            select: { status: true },
          }),
        ]);

        // Idempotency: already in a terminal state — nothing to do
        if (!order || ['PROCESSING', 'DELIVERED', 'CANCELLED', 'EXPIRED'].includes(order.status)) {
          return false;
        }

        await safeUpsertPaymentTransaction(paymentTxModel, {
          orderId: params.orderId,
          externalPaymentId: params.externalPaymentId,
          gateway: params.gateway,
          amount: params.amount,
          status: 'FAILED',
        });

        // Mark the order as PAYMENT_FAILED — keeps it alive for retry within Stripe Checkout
        await tx.order.update({
          where: { id: params.orderId },
          data: { status: 'PAYMENT_FAILED' },
        });

        return existingTransaction?.status !== 'FAILED';
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted }
    );

    if (shouldSendFailureEmail) {
      orderEmailService.sendFailedPaymentAdminNotification(params.orderId)
        .catch(error => console.error('[ORDER_FAILED_PAYMENT_EMAIL_ERROR]', error));
    }

    return { success: true, orderId: params.orderId };
  },

  /**
   * Expires or cancels a pre-payment order (no refund needed — payment never succeeded).
   * Called by:
   *  - Stripe webhook `checkout.session.expired` → targetStatus = 'EXPIRED'
   *  - Stripe webhook `payment_intent.canceled`  → targetStatus = 'CANCELLED'
   *  - Amount-mismatch path in finalizeSuccessfulPaymentFromWebhook → targetStatus = 'CANCELLED'
   */
  async cancelAbandonedOrder(
    orderId: number,
    targetStatus: 'CANCELLED' | 'EXPIRED' = 'CANCELLED',
  ): Promise<void> {
    await prisma.$transaction(async (tx: any) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          status: true,
          couponId: true,
          items: { select: { productId: true, variantId: true, quantity: true } },
        },
      });

      // Only act on pre-payment states
      if (!order || !['PENDING', 'PAYMENT_FAILED'].includes(order.status)) return;

      // Restaurar stock de cada ítem
      for (const item of order.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      // Revertir uso del cupón
      if (order.couponId) {
        await tx.coupon.updateMany({
          where: { id: order.couponId, usesCount: { gt: 0 } },
          data: { usesCount: { decrement: 1 } },
        });
        await tx.couponRedemption.deleteMany({ where: { orderId } });
      }

      await tx.order.update({
        where: { id: orderId },
        data: { status: targetStatus },
      });
    });
  },

  /**
   * User-initiated cancellation with automatic Stripe refund.
   *
   * Flow:
   * 1. Verify order is still PENDING (guard against race conditions).
   * 2. Find the SUCCEEDED PaymentTransaction for the order.
   * 3. If no payment → simple cancellation without refund (abandoned order).
   * 4. Idempotency: if a Refund record already exists, skip Stripe and sync DB state.
   * 5. Call Stripe to issue a full refund (outside the DB transaction).
   * 6. Commit Prisma transaction: create Refund record, mark Order CANCELLED,
   *    mark PaymentTransaction CANCELED, restore inventory, revert coupon.
   */
  async cancelOrderWithRefund(orderId: number): Promise<{ refunded: boolean; stripeRefundId?: string }> {
    // --- 1. Fetch order with items ---
    const rawOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        couponId: true,
        items: { select: { productId: true, variantId: true, quantity: true } },
      },
    });

    if (!rawOrder) throw new UserFacingError('Pedido no encontrado.');

    // Double-check status (may have changed since getCancellationInfo ran in the route)
    if (!['PENDING', 'PAYMENT_FAILED'].includes(rawOrder.status)) {
      throw new UserFacingError('El pedido ya no puede cancelarse porque su estado cambió.');
    }

    // --- 2. Find SUCCEEDED payment transaction ---
    const paymentTx = await prisma.paymentTransaction.findFirst({
      where: { orderId, status: 'SUCCEEDED' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, externalPaymentId: true, gateway: true, amount: true },
    });

    // --- 3. No payment found: simple cancellation, no refund ---
    if (!paymentTx) {
      await prisma.$transaction(async (tx: any) => {
        for (const item of rawOrder.items) {
          if (item.variantId) {
            await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
          } else {
            await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
          }
        }
        if (rawOrder.couponId) {
          await tx.coupon.updateMany({ where: { id: rawOrder.couponId, usesCount: { gt: 0 } }, data: { usesCount: { decrement: 1 } } });
          await tx.couponRedemption.deleteMany({ where: { orderId } });
        }
        await tx.order.update({ where: { id: orderId }, data: { status: 'CANCELLED' } });
        await (tx as any).orderCancellationLog.create({
          data: {
            orderId,
            cancelledBy: 'USER',
            cancellationReason: 'customer_request',
          },
        });
      });
      console.info('[AUDIT] order_cancelled_no_payment', { orderId });
      return { refunded: false };
    }

    // --- 4. Idempotency: check if refund already exists ---
    const existingRefund = await prisma.refund.findUnique({
      where: { paymentTransactionId: paymentTx.id },
      select: { externalRefundId: true, status: true },
    });

    if (existingRefund) {
      // Refund already issued. Ensure DB state is consistent.
      const currentOrder = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true } });
      if (currentOrder?.status !== 'CANCELLED') {
        await prisma.order.update({ where: { id: orderId }, data: { status: 'CANCELLED' } });
        await prisma.paymentTransaction.update({ where: { id: paymentTx.id }, data: { status: 'CANCELED' } });
      }
      console.info('[AUDIT] order_cancel_idempotent_hit', { orderId, externalRefundId: existingRefund.externalRefundId });
      return { refunded: true, stripeRefundId: existingRefund.externalRefundId };
    }

    // --- 5. Call Stripe to issue the refund (outside the DB transaction) ---
    let stripeRefund: { id: string; status: string };
    try {
      stripeRefund = await stripeService.createRefund({
        paymentIntentId: paymentTx.externalPaymentId,
        reason: 'requested_by_customer',
      });
    } catch (stripeError: any) {
      const code: string = stripeError?.code ?? '';
      // If Stripe says it's already refunded, handle gracefully
      if (code === 'charge_already_refunded') {
        console.warn('[STRIPE_REFUND] charge_already_refunded — syncing DB state', { orderId });
        await prisma.$transaction(async (tx: any) => {
          await tx.order.update({ where: { id: orderId }, data: { status: 'CANCELLED' } });
          await (tx as any).paymentTransaction.update({ where: { id: paymentTx.id }, data: { status: 'CANCELED' } });
          for (const item of rawOrder.items) {
            if (item.variantId) {
              await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
            } else {
              await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
            }
          }
          if (rawOrder.couponId) {
            await tx.coupon.updateMany({ where: { id: rawOrder.couponId, usesCount: { gt: 0 } }, data: { usesCount: { decrement: 1 } } });
          }
        });
        console.info('[AUDIT] order_cancelled_stripe_already_refunded', { orderId });
        return { refunded: true };
      }
      console.error('[STRIPE_REFUND_ERROR]', { orderId, code, message: stripeError?.message });
      throw new UserFacingError(`No se pudo procesar el reembolso con Stripe: ${stripeError?.message ?? 'error desconocido'}`);
    }

    // --- 6. Commit everything in a single Prisma transaction ---
    await prisma.$transaction(async (tx: any) => {
      // Refund audit record — @unique on paymentTransactionId prevents double-writes
      const refundRecord = await (tx as any).refund.create({
        data: {
          paymentTransactionId: paymentTx.id,
          externalRefundId: stripeRefund.id,
          amount: Number(paymentTx.amount),
          status: stripeRefund.status, // 'pending' or 'succeeded'
          reason: 'requested_by_customer',
        },
        select: { id: true },
      });

      await (tx as any).paymentTransaction.update({
        where: { id: paymentTx.id },
        data: { status: 'CANCELED' },
      });

      await tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
      });

      // Restore inventory
      for (const item of rawOrder.items) {
        if (item.variantId) {
          await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
        } else {
          await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
        }
      }

      // Revert coupon usage
      if (rawOrder.couponId) {
        await tx.coupon.updateMany({
          where: { id: rawOrder.couponId, usesCount: { gt: 0 } },
          data: { usesCount: { decrement: 1 } },
        });
        await tx.couponRedemption.deleteMany({ where: { orderId } });
      }

      // Cancellation audit log
      await (tx as any).orderCancellationLog.create({
        data: {
          orderId,
          refundId: refundRecord.id,
          cancelledBy: 'USER',
          refundPercentage: 100,
          refundAmount: Number(paymentTx.amount),
          cancellationReason: 'customer_request',
        },
      });
    });

    console.info('[AUDIT] order_cancelled_with_refund', {
      orderId,
      paymentTransactionId: paymentTx.id,
      externalRefundId: stripeRefund.id,
      amount: Number(paymentTx.amount),
    });

    return { refunded: true, stripeRefundId: stripeRefund.id };
  },

  /**
   * Admin-initiated cancellation with percentage-based multi-gateway refund.
   *
   * Supported statuses: all except CANCELLED.
   * Refund is proportional to the percentage the admin selects (0–100).
   * Creates an OrderCancellationLog audit record for every cancellation.
   */
  async adminCancelOrderWithRefund(params: {
    orderId: number;
    adminId: number;
    /** Refund percentage 0–100. Pass 0 to cancel without issuing a refund. */
    refundPercentage: number;
    cancellationReason: string;
    customReason?: string;
  }): Promise<{ refunded: boolean; refundAmount: number; externalRefundId?: string }> {
    const { orderId, adminId, refundPercentage, cancellationReason, customReason } = params;

    // --- 1. Fetch order ---
    const rawOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        total: true,
        couponId: true,
        items: { select: { productId: true, variantId: true, quantity: true } },
      },
    });

    if (!rawOrder) throw new UserFacingError('Pedido no encontrado.');
    if (rawOrder.status === 'CANCELLED') throw new UserFacingError('El pedido ya está cancelado.');

    // --- 2. Find SUCCEEDED payment transaction ---
    const paymentTx = await prisma.paymentTransaction.findFirst({
      where: { orderId, status: 'SUCCEEDED' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, externalPaymentId: true, gateway: true, amount: true },
    });

    const shouldRefund = refundPercentage > 0 && paymentTx !== null;
    const paidAmount = paymentTx ? Number(paymentTx.amount) : 0;
    const refundAmount = shouldRefund
      ? Math.round(paidAmount * (refundPercentage / 100) * 100) / 100
      : 0;

    let refundResult: { externalRefundId: string; status: string; amount: number } | null = null;

    if (shouldRefund) {
      // --- 3. Idempotency check ---
      const existingRefund = await prisma.refund.findUnique({
        where: { paymentTransactionId: paymentTx.id },
        select: { externalRefundId: true, amount: true },
      });

      if (existingRefund) {
        console.info('[AUDIT] admin_cancel_idempotent_hit', { orderId, externalRefundId: existingRefund.externalRefundId });
        refundResult = { externalRefundId: existingRefund.externalRefundId, status: 'already_refunded', amount: Number(existingRefund.amount) };
      } else {
        // --- 4. Call payment provider (OUTSIDE DB transaction) ---
        const { getRefundProvider } = await import('@/lib/payment/refundProviderRouter');
        const provider = getRefundProvider(paymentTx.gateway ?? 'stripe');

        try {
          const result = await provider.createRefund({
            externalPaymentId: paymentTx.externalPaymentId,
            amount: refundPercentage === 100 ? undefined : refundAmount,
            reason: 'requested_by_customer',
          });
          refundResult = result;
        } catch (providerError: any) {
          const code: string = providerError?.code ?? '';
          if (code === 'charge_already_refunded') {
            console.warn('[ADMIN_CANCEL] charge_already_refunded — continuing with DB update', { orderId });
            refundResult = null; // Will mark cancelled without new refund record
          } else {
            console.error('[ADMIN_CANCEL_REFUND_ERROR]', { orderId, gateway: paymentTx.gateway, error: providerError?.message });
            throw new UserFacingError(`No se pudo procesar el reembolso: ${providerError?.message ?? 'error desconocido'}`);
          }
        }
      }
    }

    // --- 5. Commit all DB changes atomically ---
    await prisma.$transaction(async (tx: any) => {
      let refundDbId: number | null = null;

      if (refundResult && !refundResult.status.includes('already_refunded')) {
        const refundRecord = await (tx as any).refund.create({
          data: {
            paymentTransactionId: paymentTx!.id,
            externalRefundId: refundResult.externalRefundId,
            amount: refundResult.amount,
            status: refundResult.status as import('@prisma/client').RefundStatus,
            reason: 'requested_by_customer',
          },
          select: { id: true },
        });
        refundDbId = refundRecord.id;

        await (tx as any).paymentTransaction.update({
          where: { id: paymentTx!.id },
          data: { status: 'CANCELED' },
        });
      }

      await tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
      });

      // Restore inventory
      for (const item of rawOrder.items) {
        if (item.variantId) {
          await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
        } else {
          await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
        }
      }

      // Revert coupon usage
      if (rawOrder.couponId) {
        await tx.coupon.updateMany({
          where: { id: rawOrder.couponId, usesCount: { gt: 0 } },
          data: { usesCount: { decrement: 1 } },
        });
        await tx.couponRedemption.deleteMany({ where: { orderId } });
      }

      // Audit log
      await (tx as any).orderCancellationLog.create({
        data: {
          orderId,
          refundId: refundDbId ?? null,
          cancelledBy: 'ADMIN',
          adminId,
          refundPercentage: shouldRefund ? refundPercentage : null,
          refundAmount: refundAmount > 0 ? refundAmount : null,
          cancellationReason,
          customReason: customReason ?? null,
        },
      });
    });

    console.info('[AUDIT] admin_order_cancelled', {
      orderId,
      adminId,
      refundPercentage,
      refundAmount,
      externalRefundId: refundResult?.externalRefundId ?? null,
      gateway: paymentTx?.gateway ?? null,
    });

    return {
      refunded: Boolean(refundResult),
      refundAmount,
      externalRefundId: refundResult?.externalRefundId,
    };
  },
};
