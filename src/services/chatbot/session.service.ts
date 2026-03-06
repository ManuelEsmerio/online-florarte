// src/services/chatbot/session.service.ts
// Manages WhatsApp conversation sessions in the chat_sessions table.
// One row per phone number — upserted on every interaction.

import { prisma } from '@/lib/prisma';
import { ConversationState, Intent, OrderDraft } from '@/types/chatbot.types';

export interface SessionData {
  id: number;
  phone: string;
  userId: number | null;
  currentState: string;
  lastIntent: string | null;
  lastMessage: string | null;
  updatedAt: Date;
}

export interface UpdateSessionInput {
  currentState?: ConversationState | string;
  lastIntent?: Intent | string | null;
  lastMessage?: string | null;
  userId?: number | null;
}

export const sessionService = {
  /**
   * Returns the existing session for a phone number,
   * or creates a new one in WELCOME state.
   */
  async getOrCreate(phone: string): Promise<SessionData> {
    const existing = await prisma.chatSession.findUnique({
      where: { phone },
    });

    if (existing) return existing;

    return prisma.chatSession.create({
      data: {
        phone,
        currentState: ConversationState.WELCOME,
      },
    });
  },

  /**
   * Updates conversation state, last intent, and/or last message.
   */
  async update(phone: string, data: UpdateSessionInput): Promise<void> {
    await prisma.chatSession.upsert({
      where: { phone },
      create: {
        phone,
        currentState: data.currentState ?? ConversationState.WELCOME,
        lastIntent:   data.lastIntent   ?? null,
        lastMessage:  data.lastMessage  ?? null,
        userId:       data.userId       ?? null,
      },
      update: {
        ...(data.currentState !== undefined && { currentState: data.currentState }),
        ...(data.lastIntent   !== undefined && { lastIntent:   data.lastIntent }),
        ...(data.lastMessage  !== undefined && { lastMessage:  data.lastMessage }),
        ...(data.userId       !== undefined && { userId:       data.userId }),
      },
    });
  },

  /**
   * Resets a session back to WELCOME state (e.g. after inactivity or explicit reset).
   */
  async reset(phone: string): Promise<void> {
    await prisma.chatSession.update({
      where: { phone },
      data: {
        currentState: ConversationState.WELCOME,
        lastIntent:   null,
        lastMessage:  null,
        context:      null,
      },
    });
  },

  // ─── Order draft context ────────────────────────────────────────────────

  /** Reads the in-progress order draft from the session context. */
  async getContext(phone: string): Promise<OrderDraft> {
    const row = await prisma.chatSession.findUnique({
      where:  { phone },
      select: { context: true },
    });
    if (!row?.context) return {};
    try { return JSON.parse(row.context) as OrderDraft; } catch { return {}; }
  },

  /** Merges partial draft data into the session context. */
  async setContext(phone: string, patch: Partial<OrderDraft>): Promise<void> {
    const existing = await this.getContext(phone);
    const merged   = { ...existing, ...patch };
    await prisma.chatSession.upsert({
      where:  { phone },
      create: { phone, currentState: ConversationState.WELCOME, context: JSON.stringify(merged) },
      update: { context: JSON.stringify(merged) },
    });
  },

  /** Clears the order draft context. */
  async clearContext(phone: string): Promise<void> {
    await prisma.chatSession.update({
      where: { phone },
      data:  { context: null },
    }).catch(() => {});
  },
};
