// src/lib/whatsapp.ts
// WhatsApp Cloud API client — Meta Graph API v19.0

import { OutgoingMessage } from '@/types/chatbot.types';

const WA_BASE = 'https://graph.facebook.com/v22.0';

/**
 * Sends a single outgoing message via the WhatsApp Cloud API.
 * Throws if the API returns an error.
 */
export async function sendWhatsAppMessage(to: string, message: OutgoingMessage): Promise<void> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_TOKEN;

  if (!phoneNumberId || !token) {
    throw new Error('[WhatsApp] WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_TOKEN not configured');
  }

  let payload: Record<string, unknown>;

  if (message.type === 'text') {
    payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: message.body, preview_url: false },
    };
  } else if (message.type === 'interactive_list') {
    payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'list',
        body: { text: message.body },
        action: {
          button: message.buttonText,
          sections: message.sections.map((section) => ({
            title: section.title,
            rows: section.rows.map((row) => ({
              id: row.id,
              title: row.title,
              ...(row.description ? { description: row.description } : {}),
            })),
          })),
        },
      },
    };
  } else if (message.type === 'cta_url') {
    // Single call-to-action button that opens a URL
    payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'cta_url',
        body: { text: message.body },
        action: {
          name: 'cta_url',
          parameters: { display_text: message.buttonText, url: message.url },
        },
      },
    };
  } else if (message.type === 'location') {
    // Native WhatsApp location pin
    payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'location',
      location: {
        latitude:  message.latitude,
        longitude: message.longitude,
        name:      message.name,
        address:   message.address,
      },
    };
  } else if (message.type === 'image') {
    // Product image via public Cloudinary URL
    payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'image',
      image: {
        link: message.url,
        ...(message.caption ? { caption: message.caption } : {}),
      },
    };
  } else {
    // interactive_buttons — max 3 buttons per WhatsApp API limit
    payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: message.body },
        action: {
          buttons: message.buttons.slice(0, 3).map((b) => ({
            type: 'reply',
            reply: { id: b.id, title: b.title },
          })),
        },
      },
    };
  }

  const res = await fetch(`${WA_BASE}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`[WhatsApp] API error ${res.status}: ${errorBody}`);
  }
}
