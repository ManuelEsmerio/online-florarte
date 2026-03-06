// src/app/api/chatbot/whatsapp/route.ts
// Handles Meta/WhatsApp Cloud API webhook events.
//
// GET  → webhook verification challenge (required by Meta)
// POST → incoming messages from users

import { NextRequest, NextResponse } from 'next/server';
import { chatbotService } from '@/services/chatbot/chatbot.service';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { IncomingMessage } from '@/types/chatbot.types';

export const runtime = 'nodejs';

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
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ received: true }); // malformed — ack anyway
  }

  try {
    // WhatsApp payload structure:
    // body.entry[0].changes[0].value.messages[0]
    const entry   = body?.entry?.[0];
    const change  = entry?.changes?.[0];
    const value   = change?.value;
    const messages = value?.messages as any[] | undefined;

    if (!messages?.length) {
      // Status updates (delivered, read) — acknowledge without processing
      return NextResponse.json({ received: true });
    }

    for (const message of messages) {
      // Only handle text messages in Phase 1
      // (images / audio / buttons handled in later phases)
      let text: string | null = null;

      if (message.type === 'text') {
        text = message.text?.body ?? null;
      } else if (message.type === 'interactive') {
        const interactive = message.interactive;
        text = interactive?.button_reply?.id ?? interactive?.list_reply?.id ?? null;
      }

      if (!text) continue;

      const incoming: IncomingMessage = {
        phone:     message.from,
        text,
        messageId: message.id,
      };

      const response = await chatbotService.process(incoming);

      for (const msg of response.messages) {
        await sendWhatsAppMessage(incoming.phone, msg);
      }
    }
  } catch (error) {
    // Log but always return 200 to prevent WhatsApp retry loops
    console.error('[WHATSAPP_WEBHOOK_ERROR]', error);
  }

  return NextResponse.json({ received: true });
}
