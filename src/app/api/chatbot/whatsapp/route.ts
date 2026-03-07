// src/app/api/chatbot/whatsapp/route.ts
// Handles Meta/WhatsApp Cloud API webhook events.
//
// GET  → webhook verification challenge (required by Meta)
// POST → incoming messages from users

import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { chatbotService } from '@/services/chatbot/chatbot.service';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { IncomingMessage } from '@/types/chatbot.types';
import { webhookMessageService } from '@/services/chatbot/webhook-message.service';

export const runtime = 'nodejs';

const SIGNATURE_HEADER = 'x-hub-signature-256';

function verifySignature(rawBody: string, headerValue: string | null, appSecret: string): boolean {
  if (!headerValue) return false;
  const expected = `sha256=${createHmac('sha256', appSecret).update(rawBody).digest('hex')}`;
  const received = headerValue.trim();
  if (expected.length !== received.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(received));
  } catch {
    return false;
  }
}

function extractMessageText(message: any): string | null {
  if (!message) return null;
  if (message.type === 'text') {
    return message.text?.body ?? null;
  }
  if (message.type === 'interactive') {
    const interactive = message.interactive;
    return interactive?.button_reply?.id ?? interactive?.list_reply?.id ?? null;
  }
  return null;
}

async function handleIncomingMessage(message: any): Promise<void> {
  try {
    const text = extractMessageText(message);
    if (!text) return;

    const registered = await webhookMessageService.register(message.id);
    if (!registered) {
      console.info('[WHATSAPP_WEBHOOK] Duplicate message skipped', { id: message.id, from: message.from });
      return;
    }

    const incoming: IncomingMessage = {
      phone:     message.from,
      text,
      messageId: message.id,
    };

    const response = await chatbotService.process(incoming);
    for (const msg of response.messages) {
      await sendWhatsAppMessage(incoming.phone, msg);
    }
  } catch (error) {
    console.error('[WHATSAPP_WEBHOOK_MESSAGE_ERROR]', { id: message?.id, error });
  }
}

async function dispatchMessages(messages: any[] | undefined): Promise<void> {
  if (!messages?.length) return;
  await Promise.allSettled(messages.map((message) => handleIncomingMessage(message)));
}

function scheduleDedupCleanup(): void {
  webhookMessageService.purgeOlderThan().catch(() => {
    /* best-effort */
  });
}

// ─── GET: Webhook verification ───────────────────────────────────────────────
// Meta sends this once when you configure the webhook URL in the developer portal.
// It expects the raw challenge string back with status 200.

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const mode      = searchParams.get('hub.mode');
  const token     = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.info('[WHATSAPP_WEBHOOK] Verification successful');
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn('[WHATSAPP_WEBHOOK] Verification failed — token mismatch');
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// ─── POST: Incoming messages ─────────────────────────────────────────────────
// WhatsApp always expects a 200 back quickly — errors must NOT return 4xx/5xx
// or Meta will retry the same message repeatedly.

export async function POST(req: NextRequest) {
  let rawBody = '';
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json({ received: true });
  }

  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) {
    console.error('[WHATSAPP_WEBHOOK] WHATSAPP_APP_SECRET is not configured');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const signature = req.headers.get(SIGNATURE_HEADER);
  if (!verifySignature(rawBody, signature, appSecret)) {
    console.warn('[WHATSAPP_WEBHOOK] Invalid signature');
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: any;
  try {
    body = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    console.warn('[WHATSAPP_WEBHOOK] Invalid JSON payload');
    return NextResponse.json({ received: true });
  }

  try {
    const entry    = body?.entry?.[0];
    const change   = entry?.changes?.[0];
    const value    = change?.value;
    const messages = value?.messages as any[] | undefined;

    if (!messages?.length) {
      return NextResponse.json({ received: true });
    }

    void dispatchMessages(messages);
    scheduleDedupCleanup();
  } catch (error) {
    console.error('[WHATSAPP_WEBHOOK_ERROR]', error);
  }

  return NextResponse.json({ received: true });
}
