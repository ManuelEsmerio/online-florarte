// src/services/chatbot/whatsapp-contact.service.ts
// Stores and retrieves known WhatsApp contacts (phone + confirmed name).
// Used to greet returning customers by name.

import { prisma } from '@/lib/prisma';

export interface WhatsappContactData {
  phone: string;
  name: string;
  orderCount: number;
}

export const whatsappContactService = {
  /**
   * Returns the contact record for a phone number, or null if unknown.
   */
  async get(phone: string): Promise<WhatsappContactData | null> {
    const row = await prisma.whatsappContact.findUnique({
      where:  { phone },
      select: { phone: true, name: true, orderCount: true },
    });
    return row ?? null;
  },

  /**
   * Creates or updates a contact record with the confirmed customer name.
   * Also refreshes lastSeenAt on every call.
   */
  async upsert(phone: string, name: string): Promise<void> {
    await prisma.whatsappContact.upsert({
      where:  { phone },
      create: { phone, name, lastSeenAt: new Date() },
      update: { name, lastSeenAt: new Date() },
    });
  },

  /**
   * Increments the order counter for a contact.
   * Call this when a WhatsApp order is confirmed (payment received).
   */
  async incrementOrderCount(phone: string): Promise<void> {
    await prisma.whatsappContact.update({
      where: { phone },
      data:  { orderCount: { increment: 1 }, lastSeenAt: new Date() },
    }).catch(() => {}); // ignore if contact not yet registered
  },
};
