// src/lib/chatbot/flows/order.flow.ts
// WhatsApp order flow messages — one function per capture step.

import { ChatbotResponse, OrderDraft, OutgoingMessage } from '@/types/chatbot.types';

export const TIME_SLOTS = [
  { id: 'TIME_MORNING',   label: 'Mañana 9-13h',  value: '09:00 - 13:00', startHour: 9 },
  { id: 'TIME_AFTERNOON', label: 'Tarde 13-18h',  value: '13:00 - 18:00', startHour: 13 },
  { id: 'TIME_EVENING',   label: 'Noche 18-20h',  value: '18:00 - 20:00', startHour: 18 },
];

export function mapTimeSlotId(buttonId: string): string {
  return TIME_SLOTS.find((s) => s.id === buttonId)?.value ?? buttonId;
}

const MAX_DELIVERY_WINDOW_DAYS = 14;

function startOfDay(date: Date): Date {
  const clone = new Date(date);
  clone.setHours(0, 0, 0, 0);
  return clone;
}

export function formatDateValue(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function parseDateValue(text: string): Date | null {
  const match = text.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]) - 1;
  const year = Number(match[3]);
  const candidate = new Date(year, month, day);
  if (candidate.getFullYear() !== year || candidate.getMonth() !== month || candidate.getDate() !== day) {
    return null;
  }
  const today = startOfDay(new Date());
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + MAX_DELIVERY_WINDOW_DAYS);
  candidate.setHours(0, 0, 0, 0);
  if (candidate < today || candidate > maxDate) {
    return null;
  }
  return candidate;
}

function getBaseSlotsForDate(date: Date) {
  if (date.getDay() === 0) {
    return TIME_SLOTS.filter((slot) => slot.id === 'TIME_MORNING');
  }
  return TIME_SLOTS;
}

export function getAvailableTimeSlots(dateInput?: string | Date | null) {
  const date = typeof dateInput === 'string'
    ? parseDateValue(dateInput)
    : dateInput instanceof Date
      ? dateInput
      : null;

  if (!date) {
    return TIME_SLOTS;
  }

  let slots = getBaseSlotsForDate(date);
  const today = startOfDay(new Date());
  if (startOfDay(date).getTime() === today.getTime()) {
    const currentHour = new Date().getHours();
    slots = slots.filter((slot) => (slot.startHour ?? 0) > currentHour);
  }
  return slots;
}

export function getAvailableDateOptions(count = 5): DateOption[] {
  const today = startOfDay(new Date());
  const options: DateOption[] = [];

  for (let offset = 0; offset <= MAX_DELIVERY_WINDOW_DAYS && options.length < count; offset += 1) {
    const candidate = new Date(today);
    candidate.setDate(candidate.getDate() + offset);
    if (getAvailableTimeSlots(candidate).length === 0) {
      continue;
    }
    options.push({
      id: `${DATE_OPTION_PREFIX}${candidate.getFullYear()}${(candidate.getMonth() + 1).toString().padStart(2, '0')}${candidate
        .getDate()
        .toString()
        .padStart(2, '0')}`,
      label: formatDateLabel(candidate),
      value: formatDateValue(candidate),
    });
  }

  return options;
}

// ─── Entry ────────────────────────────────────────────────────────────────────

export function startOrderFlow(productName: string): ChatbotResponse {
  return {
    messages: [
      {
        type: 'text',
        body: `🛒 ¡Perfecto! Vamos a crear tu pedido de:\n\n*${productName}*\n\nTe haré unas preguntas rápidas.\n\n¿Cuál es tu *nombre completo*?`,
      },
      {
        type: 'interactive_buttons',
        body: '¿Prefieres cancelar?',
        buttons: [{ id: 'ORDER_CANCEL', title: '❌ Cancelar pedido' }],
      },
    ],
  };
}

// ─── Delivery type ────────────────────────────────────────────────────────────

export function deliveryTypeFlow(): ChatbotResponse {
  return {
    messages: [
      {
        type: 'interactive_buttons',
        body: '🚚 ¿Cómo deseas recibir tu pedido?',
        buttons: [
          { id: 'PICKUP_TYPE',   title: '🏪 Pasar a recoger' },
          { id: 'DELIVERY_HOME', title: '🚚 Envío a domicilio' },
          { id: 'ORDER_CANCEL',  title: '❌ Cancelar' },
        ],
      },
    ],
  };
}

// ─── Per-field confirmation ───────────────────────────────────────────────────

export function confirmInputFlow(label: string, value: string): ChatbotResponse {
  return {
    messages: [
      {
        type: 'text',
        body: `✅ *Confirmar información:*\n\n*${label}:* ${value}\n\n¿Es correcto? Responde *"sí"* para continuar o escribe *"editar"* para corregir.`,
      },
      {
        type: 'interactive_buttons',
        body: 'Elige una opción:',
        buttons: [
          { id: 'CONFIRM_YES',  title: '✅ Sí, correcto' },
          { id: 'CONFIRM_EDIT', title: '✏️ Editar' },
        ],
      },
    ],
  };
}

/** Returns a standalone list of messages for a given address sub-step (used by CONFIRM_EDIT). */
export function confirmInputMessages(label: string, value: string): OutgoingMessage[] {
  return confirmInputFlow(label, value).messages;
}

// ─── Address steps ────────────────────────────────────────────────────────────

const ADDRESS_QUESTIONS: Record<string, string> = {
  recipient:    '¿Cuál es el *nombre completo* de quien *recibe* el arreglo?',
  phone:        '¿*Teléfono de contacto* del destinatario?\n(ej: 3312345678)',
  municipality: '¿*Municipio* de entrega?\n(ej: Guadalajara, Zapopan)',
  street:       '¿*Calle y número exterior*?\n(ej: Av. Hidalgo 123)',
  interior:     '¿*Número interior*?\n(Escribe "no" si no aplica)',
  neighborhood: '¿*Colonia*?\n(ej: Centro)',
  notes:        '¿Alguna *referencia* para localizar el domicilio?\n(Escribe "ninguna" si no hay)',
};

const MUNICIPALITY_SECTION_SIZE = 10;

function buildMunicipalitySections(options: string[]) {
  const rows = options.map((name, index) => ({ id: `MUNICIPALITY_${index}`, title: name }));
  const sections: Array<{ title: string; rows: typeof rows }> = [];
  for (let i = 0; i < rows.length; i += MUNICIPALITY_SECTION_SIZE) {
    sections.push({
      title: `Municipios ${Math.floor(i / MUNICIPALITY_SECTION_SIZE) + 1}`,
      rows:  rows.slice(i, i + MUNICIPALITY_SECTION_SIZE),
    });
  }
  return sections;
}

export function askAddressStep(subStep: string, config?: { municipalityOptions?: string[]; errorMessage?: string }): ChatbotResponse {
  const messages: ChatbotResponse['messages'] = [];

  if (config?.errorMessage) {
    messages.push({ type: 'text', body: config.errorMessage });
  }

  messages.push({ type: 'text', body: ADDRESS_QUESTIONS[subStep] ?? '¿Cuál es el siguiente dato de entrega?' });

  if (subStep === 'municipality' && config?.municipalityOptions?.length) {
    messages.push({
      type: 'interactive_list',
      body: 'Selecciona el municipio desde la lista:',
      buttonText: 'Elegir municipio',
      sections: buildMunicipalitySections(config.municipalityOptions.slice(0, 50)),
    });
  }

  messages.push({ type: 'interactive_buttons', body: ' ', buttons: [{ id: 'ORDER_CANCEL', title: '❌ Cancelar' }] });

  return { messages };
}

// ─── Card steps ───────────────────────────────────────────────────────────────

export function askCardFrom(): ChatbotResponse {
  return {
    messages: [
      { type: 'text', body: '💌 ¿*De parte de quién* va el arreglo?' },
      { type: 'interactive_buttons', body: ' ', buttons: [{ id: 'ORDER_CANCEL', title: '❌ Cancelar' }] },
    ],
  };
}

export function askCardMessage(): ChatbotResponse {
  return {
    messages: [
      { type: 'text', body: '💬 ¿Qué *mensaje* deseas en la tarjeta?\n(Escribe "sin mensaje" si no deseas tarjeta)' },
      { type: 'interactive_buttons', body: ' ', buttons: [{ id: 'ORDER_CANCEL', title: '❌ Cancelar' }] },
    ],
  };
}

// ─── Date ────────────────────────────────────────────────────────────────────

export const DATE_OPTION_PREFIX = 'DATE_OPTION_';

type DateOption = { id: string; label: string; value: string };

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit', month: 'short' });
}

export function resolveDateOptionId(id: string): string | null {
  if (!id.startsWith(DATE_OPTION_PREFIX)) return null;
  const payload = id.replace(DATE_OPTION_PREFIX, '');
  if (!/^\d{8}$/.test(payload)) return null;
  const year = parseInt(payload.slice(0, 4), 10);
  const month = parseInt(payload.slice(4, 6), 10) - 1;
  const day = parseInt(payload.slice(6, 8), 10);
  const candidate = new Date(year, month, day);
  if (candidate.getFullYear() !== year || candidate.getMonth() !== month || candidate.getDate() !== day) return null;
  const normalized = parseDateValue(formatDateValue(candidate));
  return normalized ? formatDateValue(normalized) : null;
}

export function askDeliveryDate(errorMessage?: string): ChatbotResponse {
  const options = getAvailableDateOptions(5);
  const messages: ChatbotResponse['messages'] = [];

  if (errorMessage) {
    messages.push({ type: 'text', body: errorMessage });
  }

  if (!options.length) {
    messages.push({ type: 'text', body: '⚠️ Por el momento ya no hay fechas con horarios disponibles. Un asesor te ayudará a programarla.' });
    messages.push({ type: 'interactive_buttons', body: ' ', buttons: [{ id: 'ORDER_CANCEL', title: '❌ Cancelar' }] });
    return { messages };
  }

  const firstGroup = options.slice(0, 3).map((option) => ({ id: option.id, title: option.label }));
  const secondGroup = options.slice(3).map((option) => ({ id: option.id, title: option.label }));

  messages.push({ type: 'text', body: '📅 Selecciona la fecha de entrega (o escribe DD/MM/AAAA):' });

  if (firstGroup.length) {
    messages.push({
      type: 'interactive_buttons',
      body: 'Fechas disponibles:',
      buttons: firstGroup,
    });
  }

  if (secondGroup.length) {
    messages.push({
      type: 'interactive_buttons',
      body: 'Más fechas:',
      buttons: secondGroup,
    });
  }

  messages.push({ type: 'interactive_buttons', body: ' ', buttons: [{ id: 'ORDER_CANCEL', title: '❌ Cancelar' }] });

  return { messages };
}

export function invalidDateFlow(): ChatbotResponse {
  return askDeliveryDate('⚠️ La fecha no es válida. Usa los botones o escribe DD/MM/AAAA.');
}

// ─── Time ────────────────────────────────────────────────────────────────────

export function askDeliveryTime(
  slots: typeof TIME_SLOTS,
  config?: { errorMessage?: string },
): ChatbotResponse {
  const messages: ChatbotResponse['messages'] = [];

  if (config?.errorMessage) {
    messages.push({ type: 'text', body: config.errorMessage });
  }

  if (!slots.length) {
    messages.push({ type: 'text', body: '⚠️ Ya no hay horarios disponibles para esa fecha. Elige otra fecha.' });
    messages.push({ type: 'interactive_buttons', body: '¿Deseas cancelar?', buttons: [{ id: 'ORDER_CANCEL', title: '❌ Cancelar' }] });
    return { messages };
  }

  const slotSummary = slots
    .map((slot) => `• ${slot.label.replace('h', ' hrs')} → ${slot.value}`)
    .join('\n');

  messages.push({
    type: 'text',
    body: `🕘 ¿En qué *horario* prefieres recibir el arreglo?\n\n${slotSummary}`,
  });
  messages.push({
    type: 'interactive_buttons',
    body: 'Elige un horario:',
    buttons: slots.map((s) => ({ id: s.id, title: s.label })),
  });
  messages.push({
    type: 'interactive_buttons',
    body: '¿Deseas cancelar el pedido?',
    buttons: [{ id: 'ORDER_CANCEL', title: '❌ Cancelar' }],
  });

  return { messages };
}

// ─── Upsell ───────────────────────────────────────────────────────────────────

export type UpsellProduct = { id: number; name: string; price: number };

export function upsellFlow(products: UpsellProduct[], opts?: { errorMessage?: string }): ChatbotResponse {
  const productButtons = products.slice(0, 2).map((p) => ({
    id: `UPSELL_P${p.id}`,
    title: `${p.name} $${p.price.toFixed(0)}`,
  }));
  const messages: ChatbotResponse['messages'] = [];

  if (opts?.errorMessage) {
    messages.push({ type: 'text', body: opts.errorMessage });
  }

  const intro = `🎁 ¿Deseas agregar algo más a tu pedido?\n\n${products
    .slice(0, 3)
    .map((p, i) => `${i + 1}. *${p.name}* — $${p.price.toFixed(2)} MXN`)
    .join('\n')}\n\nResponde con el número, elige un botón o escribe *"no"* para continuar sin extras.`;
  messages.push({ type: 'text', body: intro });
  messages.push({
    type: 'interactive_buttons',
    body: 'Elige una opción:',
    buttons: [
      ...productButtons,
      { id: 'UPSELL_SKIP', title: '⏭️ No gracias' },
    ],
  });

  return { messages };
}

// ─── Pickup summary ───────────────────────────────────────────────────────────

export function pickupSummaryFlow(draft: OrderDraft): ChatbotResponse {
  const price = draft.productPrice ?? 0;
  const upsellTotal = (draft.upsellItems ?? []).reduce((s, i) => s + i.price, 0);
  const total = price + upsellTotal;

  const card = draft.cardMessage
    ? `\n💌 *Tarjeta:* De "${draft.cardFrom ?? 'Anónimo'}"\n   "${draft.cardMessage}"`
    : '\n💌 *Tarjeta:* Sin mensaje';

  const extras = (draft.upsellItems ?? []).length > 0
    ? `\n🎁 *Extras:* ${(draft.upsellItems ?? []).map((i) => i.name).join(', ')}`
    : '';

  const body = [
    '📋 *Resumen de tu pedido (recolección en tienda):*',
    '',
    `🌺 *Arreglo:* ${draft.productName ?? '—'}`,
    `💰 *Precio:* $${price.toFixed(2)} MXN`,
    extras,
    `💳 *Total:* $${total.toFixed(2)} MXN`,
    card,
    '',
    `📅 *Fecha de recolección:* ${draft.deliveryDate ?? '—'}`,
    `🕘 *Horario:* ${draft.deliveryTimeSlot ?? '—'}`,
    '',
    '¿Cómo deseas pagar?',
  ].filter((l) => l !== null && l !== '').join('\n');

  return {
    messages: [
      { type: 'text', body },
      {
        type: 'interactive_buttons',
        body: 'Elige método de pago:',
        buttons: [
          { id: 'PAYMENT_ONLINE',   title: '💳 Pagar en línea' },
          { id: 'PAYMENT_TRANSFER', title: '🏦 Transferencia' },
          { id: 'ORDER_CANCEL',     title: '❌ Cancelar' },
        ],
      },
    ],
  };
}

// ─── Summary + Payment ───────────────────────────────────────────────────────

export function orderSummaryFlow(draft: OrderDraft): ChatbotResponse {
  const price        = draft.productPrice ?? 0;
  const shippingCost = draft.shippingCost ?? 0;
  const upsellTotal  = (draft.upsellItems ?? []).reduce((s, i) => s + i.price, 0);
  const total        = price + shippingCost + upsellTotal;

  const address = [
    draft.streetName, draft.streetNumber,
    draft.interiorNumber ? `Int. ${draft.interiorNumber}` : null,
    draft.neighborhood,
    draft.city, draft.state,
  ].filter(Boolean).join(', ');

  const card = draft.cardMessage
    ? `\n💌 *Tarjeta:* De "${draft.cardFrom ?? 'Anónimo'}"\n   "${draft.cardMessage}"`
    : '\n💌 *Tarjeta:* Sin mensaje';

  const extras = (draft.upsellItems ?? []).length > 0
    ? `\n🎁 *Extras:* ${(draft.upsellItems ?? []).map((i) => i.name).join(', ')}`
    : null;

  const body = [
    '📋 *Resumen de tu pedido:*',
    '',
    `🌺 *Arreglo:* ${draft.productName ?? '—'}`,
    `💰 *Precio:* $${price.toFixed(2)} MXN`,
    shippingCost > 0 ? `🚚 *Envío:* $${shippingCost.toFixed(2)} MXN` : null,
    extras,
    `💳 *Total:* $${total.toFixed(2)} MXN`,
    '',
    '📦 *Datos de entrega:*',
    `👤 *Recibe:* ${draft.recipientName ?? '—'}`,
    `📱 *Tel:* ${draft.recipientPhone ?? '—'}`,
    `📍 ${address || '—'}`,
    card,
    '',
    `📅 *Fecha:* ${draft.deliveryDate ?? '—'}`,
    `🕘 *Horario:* ${draft.deliveryTimeSlot ?? '—'}`,
    '',
    '¿Cómo deseas pagar?',
  ].filter((l) => l !== null).join('\n');

  return {
    messages: [
      { type: 'text', body },
      {
        type: 'interactive_buttons',
        body: 'Elige método de pago:',
        buttons: [
          { id: 'PAYMENT_ONLINE',   title: '💳 Pagar en línea' },
          { id: 'PAYMENT_TRANSFER', title: '🏦 Transferencia' },
          { id: 'ORDER_CANCEL',     title: '❌ Cancelar' },
        ],
      },
    ],
  };
}

// ─── Payment: bank transfer ───────────────────────────────────────────────────

export function bankTransferFlow(
  bankName: string, account: string, clabe: string, owner: string, orderId: number, total: number,
): ChatbotResponse {
  return {
    messages: [
      {
        type: 'text',
        body: [
          '🏦 *Datos para transferencia:*',
          '',
          `🏛️ *Banco:* ${bankName}`,
          `👤 *Titular:* ${owner}`,
          `💳 *Cuenta:* ${account}`,
          `🔢 *CLABE:* ${clabe}`,
          '',
          `📝 *Concepto:* Pedido #${String(orderId).padStart(4, '0')}`,
          `💰 *Monto:* $${total.toFixed(2)} MXN`,
          '',
          'Una vez realizada la transferencia, envía tu comprobante y un asesor confirmará tu pedido. 🌸',
        ].join('\n'),
      },
    ],
  };
}

// ─── Payment: online link ─────────────────────────────────────────────────────

export function onlinePaymentFlow(orderId: number, total: number, paymentUrl: string): ChatbotResponse {
  return {
    messages: [
      {
        type: 'text',
        body: `✅ *Pedido #${String(orderId).padStart(4, '0')} creado*\n\n💰 Total: *$${total.toFixed(2)} MXN*\n\nToca el botón para pagar de forma segura:`,
      },
      {
        type: 'cta_url',
        body: 'Pago seguro con Stripe',
        buttonText: '💳 Pagar ahora',
        url: paymentUrl,
      },
    ],
  };
}

// ─── Waiting for payment ──────────────────────────────────────────────────────

export function waitingPaymentFlow(): ChatbotResponse {
  return {
    messages: [
      {
        type: 'text',
        body: '⏳ Tu pedido está registrado. Un asesor confirmará el pago y te notificará cuando esté listo. 🌸',
      },
      {
        type: 'interactive_buttons',
        body: '¿Necesitas algo más?',
        buttons: [
          { id: 'BACK_TO_SHOP',  title: '🛒 Volver a comprar' },
          { id: 'HUMAN_SUPPORT', title: '👤 Hablar con asesor' },
          { id: 'FAREWELL',      title: '✅ Finalizar' },
        ],
      },
    ],
  };
}

// ─── Cancel ───────────────────────────────────────────────────────────────────

export function orderCancelledFlow(): ChatbotResponse {
  return {
    messages: [
      { type: 'text', body: '❌ Pedido cancelado. No te preocupes, puedes iniciar uno nuevo cuando quieras. 🌸' },
      {
        type: 'interactive_buttons',
        body: '¿Qué deseas hacer?',
        buttons: [
          { id: 'CATALOG',       title: '🌺 Ver catálogo' },
          { id: 'HUMAN_SUPPORT', title: '👤 Hablar con asesor' },
          { id: 'QUOTE',         title: '💰 Cotizar arreglo' },
        ],
      },
    ],
  };
}
