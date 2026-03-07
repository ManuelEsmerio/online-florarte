// src/services/chatbot/whatsapp-order.service.ts
// Creates a guest order in the DB from a WhatsApp OrderDraft and generates a Stripe payment link.

import { prisma } from '@/lib/prisma';
import { stripeService } from '@/services/stripeService';
import { companyService } from './company.service';
import { OrderDraft } from '@/types/chatbot.types';

export interface WhatsAppOrderResult {
  orderId:    number;
  total:      number;
  paymentUrl: string;
}

export interface WhatsAppOrderOnly {
  orderId: number;
  total:   number;
}

/** Parses "DD/MM/YYYY" into a Date. Falls back to tomorrow if invalid. */
function parseDate(dateStr?: string): Date {
  if (!dateStr) return tomorrow();
  const [d, m, y] = dateStr.split('/').map(Number);
  if (!d || !m || !y) return tomorrow();
  const dt = new Date(y, m - 1, d);
  return isNaN(dt.getTime()) ? tomorrow() : dt;
}

function tomorrow(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d;
}

function buildFormattedAddress(draft: OrderDraft): string {
  return [
    `${draft.streetName ?? ''} ${draft.streetNumber ?? ''}`.trim(),
    draft.interiorNumber ? `Int. ${draft.interiorNumber}` : null,
    draft.neighborhood,
    draft.municipalityName ?? draft.city,
    draft.state,
    'México',
  ].filter(Boolean).join(', ');
}

interface ProductSnapshot {
  id: number;
  name: string;
  price: number;
}

interface ShippingSnapshot {
  cost: number;
  city?: string;
  state?: string;
}

interface PricingSnapshot {
  mainProduct: ProductSnapshot;
  upsellItems: ProductSnapshot[];
  shipping: ShippingSnapshot;
  subtotal: number;
  total: number;
}

function normalizeCurrency(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

function resolveUnitPrice(price: unknown, salePrice: unknown): number {
  const base = normalizeCurrency(Number(price ?? 0));
  if (salePrice === null || salePrice === undefined) {
    return base;
  }
  const discounted = normalizeCurrency(Number(salePrice));
  if (discounted > 0 && discounted < base) {
    return discounted;
  }
  return base;
}

async function fetchMainProductSnapshot(productId?: number): Promise<ProductSnapshot> {
  if (!productId) {
    throw new Error('Order draft is missing productId');
  }
  const product = await prisma.product.findFirst({
    where: {
      id:        productId,
      status:    'PUBLISHED',
      isDeleted: false,
    },
    select: { id: true, name: true, price: true, salePrice: true },
  });
  if (!product) {
    throw new Error(`Product ${productId} is no longer available`);
  }
  return {
    id:    product.id,
    name:  product.name,
    price: resolveUnitPrice(product.price, product.salePrice),
  };
}

async function fetchUpsellSnapshots(items?: OrderDraft['upsellItems']): Promise<ProductSnapshot[]> {
  if (!items?.length) return [];
  const ids = Array.from(new Set(items.map((item) => item.id).filter(Boolean)));
  if (ids.length === 0) return [];

  const rows = await prisma.product.findMany({
    where: {
      id:        { in: ids },
      status:    'PUBLISHED',
      isDeleted: false,
    },
    select: { id: true, name: true, price: true, salePrice: true },
  });
  const map = new Map<number, ProductSnapshot>(
    rows.map((row) => [row.id, {
      id:    row.id,
      name:  row.name,
      price: resolveUnitPrice(row.price, row.salePrice),
    }]),
  );

  return items
    .map((item) => {
      const snapshot = map.get(item.id);
      return snapshot ? { ...snapshot } : null;
    })
    .filter((snapshot): snapshot is ProductSnapshot => Boolean(snapshot));
}

async function resolveShippingSnapshot(draft: OrderDraft): Promise<ShippingSnapshot> {
  if (!draft.deliveryType) {
    throw new Error('Order draft is missing deliveryType');
  }
  if (draft.deliveryType === 'PICKUP') {
    return { cost: 0, city: draft.city, state: draft.state };
  }
  const municipality = draft.municipalityName?.trim();
  if (!municipality) {
    throw new Error('Municipality is required for delivery orders');
  }

  const zone = await prisma.shippingZone.findFirst({
    where: {
      isActive: true,
      municipality: { equals: municipality, mode: 'insensitive' },
    },
    orderBy: { shippingCost: 'asc' },
    select:  { shippingCost: true, municipality: true, state: true },
  });

  if (!zone) {
    throw new Error(`Shipping zone not found for municipality "${municipality}"`);
  }

  return {
    cost: Number(zone.shippingCost),
    city: zone.municipality ?? municipality,
    state: zone.state ?? draft.state ?? '',
  };
}

async function buildPricingSnapshot(draft: OrderDraft): Promise<PricingSnapshot> {
  const [mainProduct, upsellItems, shipping] = await Promise.all([
    fetchMainProductSnapshot(draft.productId),
    fetchUpsellSnapshots(draft.upsellItems),
    resolveShippingSnapshot(draft),
  ]);

  const upsellTotal = upsellItems.reduce((sum, item) => sum + item.price, 0);
  const subtotal = normalizeCurrency(mainProduct.price + upsellTotal);
  const total = normalizeCurrency(subtotal + shipping.cost);

  return { mainProduct, upsellItems, shipping, subtotal, total };
}

function buildOrderItems(mainProduct: ProductSnapshot, upsellItems: ProductSnapshot[]) {
  return [
    {
      productId:       mainProduct.id,
      productNameSnap: mainProduct.name,
      quantity:        1,
      unitPrice:       mainProduct.price,
    },
    ...upsellItems.map((item) => ({
      productId:       item.id,
      productNameSnap: item.name,
      quantity:        1,
      unitPrice:       item.price,
    })),
  ];
}

function buildDeliveryAddress(draft: OrderDraft, shipping: ShippingSnapshot) {
  const city = shipping.city ?? draft.city ?? draft.municipalityName ?? '';
  const state = shipping.state ?? draft.state ?? '';
  return {
    recipientName:    draft.recipientName ?? draft.customerName ?? '',
    recipientPhone:   draft.recipientPhone ?? null,
    streetName:       draft.streetName ?? '',
    streetNumber:     draft.streetNumber ?? 'S/N',
    interiorNumber:   draft.interiorNumber ?? null,
    neighborhood:     draft.neighborhood ?? '',
    city,
    state,
    country:          'México',
    postalCode:       draft.postalCode ?? null,
    referenceNotes:   draft.addressNotes ?? null,
    formattedAddress: buildFormattedAddress({ ...draft, city, state }),
    isGuestAddress:   true,
  };
}

export const whatsappOrderService = {
  async createOrderAndPaymentLink(
    phone: string,
    draft: OrderDraft,
  ): Promise<WhatsAppOrderResult> {
    const siteUrl      = await companyService.get('site_url') ?? 'https://online-florarte.vercel.app';
    const pricing      = await buildPricingSnapshot(draft);
    const isPickup     = draft.deliveryType === 'PICKUP';

    const dedication = draft.cardMessage
      ? `De: ${draft.cardFrom ?? 'Anónimo'}\n${draft.cardMessage}`
      : null;

    const orderItems = buildOrderItems(pricing.mainProduct, pricing.upsellItems);

    // Create order in DB
    const order = await prisma.order.create({
      data: {
        isGuest:          true,
        isPickup,
        guestName:        draft.customerName ?? 'Cliente WhatsApp',
        guestPhone:       phone, // store full WhatsApp phone for webhook confirmation
        status:           'PENDING',
        subtotal:         pricing.subtotal,
        shippingCost:     pricing.shipping.cost,
        total:            pricing.total,
        couponDiscount:   0,
        deliveryDate:     parseDate(draft.deliveryDate),
        deliveryTimeSlot: draft.deliveryTimeSlot ?? '',
        dedication,
        isAnonymous:      false,
        items: { create: orderItems },
        // Only create address for delivery orders
        ...(!isPickup && {
          orderAddress: {
            create: {
              ...buildDeliveryAddress(draft, pricing.shipping),
            },
          },
        }),
      },
    });

    const amountInCents = Math.round(pricing.total * 100);

    // Create Stripe checkout session
    const stripeSession = await stripeService.createCheckoutSession({
      orderId:     order.id,
      amountInCents,
      successUrl:  `${siteUrl}/order/success?orderId=${order.id}&source=whatsapp`,
      cancelUrl:   `${siteUrl}?source=whatsapp`,
    });

    // Record payment transaction
    await prisma.paymentTransaction.create({
      data: {
        orderId:           order.id,
        externalPaymentId: stripeSession.id,
        gateway:           'stripe',
        amount:            pricing.total,
        status:            'PENDING',
      },
    });

    return { orderId: order.id, total: pricing.total, paymentUrl: stripeSession.url! };
  },

  /**
   * Creates a DB order record without a payment gateway session.
   * Used for bank-transfer orders where payment is confirmed manually.
   */
  async createOrderOnly(
    phone: string,
    draft: OrderDraft,
  ): Promise<WhatsAppOrderOnly> {
    const pricing  = await buildPricingSnapshot(draft);
    const isPickup = draft.deliveryType === 'PICKUP';

    const dedication = draft.cardMessage
      ? `De: ${draft.cardFrom ?? 'Anónimo'}\n${draft.cardMessage}`
      : null;

    const orderItems = buildOrderItems(pricing.mainProduct, pricing.upsellItems);

    const order = await prisma.order.create({
      data: {
        isGuest:          true,
        isPickup,
        guestName:        draft.customerName ?? 'Cliente WhatsApp',
        guestPhone:       phone,
        status:           'PENDING',
        subtotal:         pricing.subtotal,
        shippingCost:     pricing.shipping.cost,
        total:            pricing.total,
        couponDiscount:   0,
        deliveryDate:     parseDate(draft.deliveryDate),
        deliveryTimeSlot: draft.deliveryTimeSlot ?? '',
        dedication,
        isAnonymous:      false,
        items: { create: orderItems },
        ...(!isPickup && {
          orderAddress: {
            create: {
              ...buildDeliveryAddress(draft, pricing.shipping),
            },
          },
        }),
      },
    });

    return { orderId: order.id, total: pricing.total };
  },
};
