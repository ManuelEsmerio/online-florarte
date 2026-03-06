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

export const whatsappOrderService = {
  async createOrderAndPaymentLink(
    phone: string,
    draft: OrderDraft,
  ): Promise<WhatsAppOrderResult> {
    const siteUrl      = await companyService.get('site_url') ?? 'https://online-florarte.vercel.app';
    const isPickup     = draft.deliveryType === 'PICKUP';

    // Use pre-resolved shipping cost from draft (set during municipality capture)
    const productPrice = draft.productPrice ?? 0;
    const shippingCost = isPickup ? 0 : (draft.shippingCost ?? 0);
    const upsellTotal  = (draft.upsellItems ?? []).reduce((s, i) => s + i.price, 0);
    const total        = productPrice + shippingCost + upsellTotal;

    const dedication = draft.cardMessage
      ? `De: ${draft.cardFrom ?? 'Anónimo'}\n${draft.cardMessage}`
      : null;

    // Build order items (main product + upsell items)
    const orderItems = [
      {
        productId:       draft.productId!,
        productNameSnap: draft.productName ?? '',
        quantity:        1,
        unitPrice:       productPrice,
      },
      ...(draft.upsellItems ?? []).map((item) => ({
        productId:       item.id,
        productNameSnap: item.name,
        quantity:        1,
        unitPrice:       item.price,
      })),
    ];

    // Create order in DB
    const order = await prisma.order.create({
      data: {
        isGuest:          true,
        isPickup,
        guestName:        draft.customerName ?? 'Cliente WhatsApp',
        guestPhone:       phone, // store full WhatsApp phone for webhook confirmation
        status:           'PENDING',
        subtotal:         productPrice + upsellTotal,
        shippingCost,
        total,
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
              recipientName:    draft.recipientName ?? draft.customerName ?? '',
              recipientPhone:   draft.recipientPhone ?? null,
              streetName:       draft.streetName ?? '',
              streetNumber:     draft.streetNumber ?? 'S/N',
              interiorNumber:   draft.interiorNumber ?? null,
              neighborhood:     draft.neighborhood ?? '',
              city:             draft.city ?? draft.municipalityName ?? '',
              state:            draft.state ?? '',
              country:          'México',
              postalCode:       draft.postalCode ?? null,
              referenceNotes:   draft.addressNotes ?? null,
              formattedAddress: buildFormattedAddress(draft),
              isGuestAddress:   true,
            },
          },
        }),
      },
    });

    const amountInCents = Math.round(total * 100);

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
        amount:            total,
        status:            'PENDING',
      },
    });

    return { orderId: order.id, total, paymentUrl: stripeSession.url! };
  },
};
