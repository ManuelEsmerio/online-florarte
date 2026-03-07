import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const DEFAULT_PURGE_MINUTES = 60;

/**
 * Persists WhatsApp message IDs to ensure we only process each webhook payload once,
 * even across multiple server instances.
 */
export const webhookMessageService = {
  async register(messageId: string): Promise<boolean> {
    if (!messageId) return false;
    try {
      await prisma.chatbotWebhookMessage.create({ data: { messageId } });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return false; // already processed
      }
      throw error;
    }
  },

  async purgeOlderThan(minutes = DEFAULT_PURGE_MINUTES): Promise<void> {
    const threshold = new Date(Date.now() - minutes * 60 * 1000);
    await prisma.chatbotWebhookMessage.deleteMany({ where: { processedAt: { lt: threshold } } }).catch((err) => {
      console.warn('[CHATBOT_WEBHOOK] Failed to purge dedup entries', err);
    });
  },
};
