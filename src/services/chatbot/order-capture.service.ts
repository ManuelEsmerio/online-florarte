// src/services/chatbot/order-capture.service.ts
// Handles each capture step of the WhatsApp order flow.

import { ConversationState, ChatbotResponse, OrderDraft, ConfirmPending } from '@/types/chatbot.types';
import { prisma } from '@/lib/prisma';
import { companyService } from './company.service';
import { whatsappOrderService } from './whatsapp-order.service';
import {
  startOrderFlow,
  deliveryTypeFlow,
  askAddressStep,
  askCardFrom,
  askCardMessage,
  askDeliveryDate,
  askDeliveryTime,
  confirmInputFlow,
  upsellFlow,
  orderSummaryFlow,
  pickupSummaryFlow,
  bankTransferFlow,
  onlinePaymentFlow,
  waitingPaymentFlow,
  resolveDateOptionId,
  getAvailableTimeSlots,
  formatDateValue,
  parseDateValue,
  UpsellProduct,
} from '@/lib/chatbot/flows/order.flow';

export interface CaptureResult {
  nextState: ConversationState;
  response:  ChatbotResponse;
  draft:     OrderDraft;
}

// ─── Address sub-step chain (DELIVERY) ───────────────────────────────────────

const DELIVERY_ADDRESS_STEPS = ['recipient', 'phone', 'municipality', 'street', 'interior', 'neighborhood', 'notes'] as const;
type AddressSubStep = typeof DELIVERY_ADDRESS_STEPS[number];

const normalizeKeyword = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z]/g, '');

const CONFIRM_YES_KEYWORDS = new Set([
  'si', 's', 'yes', 'ok', 'vale', 'listo', 'correcto', 'afirmativo', 'claro', 'perfecto',
]);

const CONFIRM_EDIT_KEYWORDS = new Set([
  'no', 'editar', 'corregir', 'cambiar', 'modificar', 'volver', 'regresar', 'ajustar',
]);

const UPSELL_SKIP_KEYWORDS = new Set([
  'no', 'nogracias', 'sinextra', 'sinextras', 'ninguno', 'ninguna', 'ningun', 'ningunaopcion', 'skip', 'continuar', 'seguir', 'nada', 'nose',
]);

const MUNICIPALITY_CACHE_TTL = 1000 * 60 * 10; // 10 minutes
let cachedMunicipalities: { expiresAt: number; values: string[] } | null = null;

async function getMunicipalitySuggestions(): Promise<string[]> {
  const now = Date.now();
  if (cachedMunicipalities && cachedMunicipalities.expiresAt > now) {
    return cachedMunicipalities.values;
  }

  const rows = await prisma.shippingZone.findMany({
    where: { isActive: true },
    select: { municipality: true, locality: true },
    orderBy: [{ municipality: 'asc' }, { locality: 'asc' }],
  });

  const unique = Array.from(
    new Set(
      rows
        .map((row) => (row.municipality?.trim() || row.locality?.trim() || '').replace(/\s+/g, ' ').trim())
        .filter((name) => Boolean(name)),
    ),
  );

  const limited = unique.slice(0, 50);
  cachedMunicipalities = { expiresAt: now + MUNICIPALITY_CACHE_TTL, values: limited };
  return limited;
}

async function buildAddressPrompt(subStep: string, opts?: { errorMessage?: string }): Promise<ChatbotResponse> {
  if (subStep === 'municipality') {
    const options = await getMunicipalitySuggestions();
    return askAddressStep(subStep, {
      municipalityOptions: options,
      errorMessage: opts?.errorMessage,
    });
  }
  return askAddressStep(subStep, { errorMessage: opts?.errorMessage });
}

function buildDatePrompt(errorMessage?: string): ChatbotResponse {
  return askDeliveryDate(errorMessage);
}

function nextAddressSubStep(current: AddressSubStep): AddressSubStep | null {
  const idx = DELIVERY_ADDRESS_STEPS.indexOf(current);
  return idx >= 0 && idx < DELIVERY_ADDRESS_STEPS.length - 1 ? DELIVERY_ADDRESS_STEPS[idx + 1] : null;
}

function applyAddressField(draft: OrderDraft, subStep: AddressSubStep, text: string): OrderDraft {
  const t = text.trim();
  switch (subStep) {
    case 'recipient': return { ...draft, recipientName: t };
    case 'phone':     return { ...draft, recipientPhone: t };
    case 'municipality': return { ...draft, municipalityName: t };
    case 'street': {
      const match = t.match(/^(.+?)\s+(\d+\w*)$/);
      return match
        ? { ...draft, streetName: match[1], streetNumber: match[2] }
        : { ...draft, streetName: t, streetNumber: 'S/N' };
    }
    case 'interior':
      return ['no', 'ninguno', 'n/a', 'na', 's/n'].includes(t.toLowerCase())
        ? draft
        : { ...draft, interiorNumber: t };
    case 'neighborhood': return { ...draft, neighborhood: t };
    case 'notes':
      return ['ninguna', 'ninguno', 'no', 'n/a'].includes(t.toLowerCase())
        ? draft
        : { ...draft, addressNotes: t };
    default: return draft;
  }
}

// ─── Municipality shipping lookup ─────────────────────────────────────────────

async function lookupShipping(municipality: string): Promise<{ cost: number; city: string; state: string }> {
  const zone = await prisma.shippingZone.findFirst({
    where: {
      municipality: { contains: municipality },
      isActive: true,
    },
    orderBy: { shippingCost: 'asc' },
    select: { shippingCost: true, municipality: true, state: true },
  });
  return {
    cost:  zone ? Number(zone.shippingCost) : 0,
    city:  zone?.municipality ?? municipality,
    state: zone?.state ?? '',
  };
}

// ─── Upsell product fetch ─────────────────────────────────────────────────────

async function fetchUpsellProducts(excludeId?: number): Promise<UpsellProduct[]> {
  const rows = await prisma.product.findMany({
    where: {
      status: 'PUBLISHED',
      isDeleted: false,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 3,
    select: { id: true, name: true, price: true, salePrice: true },
  });
  return rows.map((r) => ({
    id:    r.id,
    name:  r.name,
    price: Number(r.salePrice && r.salePrice < r.price ? r.salePrice : r.price),
  }));
}

async function appendUpsellProduct(draft: OrderDraft, productId: number): Promise<OrderDraft | null> {
  const product = await prisma.product.findUnique({
    where:  { id: productId },
    select: { id: true, name: true, price: true, salePrice: true },
  });
  if (!product) return null;
  const price = Number(product.salePrice && product.salePrice < product.price ? product.salePrice : product.price);
  return {
    ...draft,
    upsellItems: [...(draft.upsellItems ?? []), { id: product.id, name: product.name, price }],
  };
}

// ─── Confirmation builder ─────────────────────────────────────────────────────

function buildConfirmStep(
  label:        string,
  displayValue: string,
  pendingDraft: Omit<OrderDraft, 'confirmPending'>,
  revertDraft:  Omit<OrderDraft, 'confirmPending'>,
  returnState:  ConversationState,
  nextState:    ConversationState,
): CaptureResult {
  const confirmPending: ConfirmPending = {
    label, displayValue,
    pendingDraft: pendingDraft as OrderDraft,
    revertDraft:  revertDraft  as OrderDraft,
    returnState,
    nextState,
  };
  return {
    nextState: ConversationState.CONFIRMING_INPUT,
    draft:     { ...pendingDraft, confirmPending } as OrderDraft,
    response:  confirmInputFlow(label, displayValue),
  };
}

// ─── Response helper (called after CONFIRM_YES / CONFIRM_EDIT) ────────────────

async function getResponseForState(state: ConversationState, draft: OrderDraft): Promise<ChatbotResponse> {
  switch (state) {
    case ConversationState.ORDER_WHATSAPP:
      return startOrderFlow(draft.productName ?? 'tu arreglo');
    case ConversationState.DELIVERY_TYPE:
      return deliveryTypeFlow();
    case ConversationState.CAPTURE_ADDRESS:
      return buildAddressPrompt(draft.addressSubStep ?? 'recipient');
    case ConversationState.CAPTURE_CARD_MSG:
      return draft.cardSubStep === 'from' ? askCardFrom() : askCardMessage();
    case ConversationState.CAPTURE_DATE:
      return buildDatePrompt();
    case ConversationState.CAPTURE_TIME: {
      const slots = getAvailableTimeSlots(draft.deliveryDate ?? null);
      return askDeliveryTime(slots);
    }
    case ConversationState.PAYMENT_METHOD:
      return draft.deliveryType === 'PICKUP' ? pickupSummaryFlow(draft) : orderSummaryFlow(draft);
    default:
      return deliveryTypeFlow();
  }
}

// ─── Main processor ───────────────────────────────────────────────────────────

export const orderCaptureService = {
  async process(
    phone:        string,
    text:         string,
    currentState: ConversationState,
    draft:        OrderDraft,
  ): Promise<CaptureResult> {
    const upper = text.trim().toUpperCase();

    // ── ORDER_WHATSAPP: capture customer name ─────────────────────────────
    if (currentState === ConversationState.ORDER_WHATSAPP) {
      const revertDraft  = { ...draft };
      const pendingDraft = { ...draft, customerName: text.trim() };
      return buildConfirmStep(
        'Nombre', text.trim(),
        pendingDraft, revertDraft,
        ConversationState.ORDER_WHATSAPP,
        ConversationState.DELIVERY_TYPE,
      );
    }

    // ── CONFIRMING_INPUT ──────────────────────────────────────────────────
    if (currentState === ConversationState.CONFIRMING_INPUT) {
      const cp = draft.confirmPending;
      if (!cp) {
        // Defensive fallback: confirmPending lost — reset to main menu with welcome message
        return {
          nextState: ConversationState.MAIN_MENU,
          draft:     {},
          response:  {
            messages: [
              { type: 'text', body: '🌸 Hubo un problema con tu sesión. ¡No te preocupes! Empecemos de nuevo.' },
              {
                type: 'interactive_buttons',
                body: '¿En qué puedo ayudarte?',
                buttons: [
                  { id: 'CATALOG',       title: '🌺 Ver catálogo' },
                  { id: 'QUOTE',         title: '💰 Cotizar arreglo' },
                  { id: 'HUMAN_SUPPORT', title: '👤 Hablar con asesor' },
                ],
              },
            ],
          },
        };
      }

      const normalizedInput = normalizeKeyword(text);
      const isAffirmative = CONFIRM_YES_KEYWORDS.has(normalizedInput);
      const isEditRequest = CONFIRM_EDIT_KEYWORDS.has(normalizedInput);

      if (upper === 'CONFIRM_YES' || isAffirmative) {
        const cleanDraft = { ...cp.pendingDraft, confirmPending: undefined } as OrderDraft;
        const nextState  = cp.nextState as ConversationState;
        return {
          nextState: nextState,
          draft:     cleanDraft,
          response:  await getResponseForState(nextState, cleanDraft),
        };
      }

      if (upper === 'CONFIRM_EDIT' || isEditRequest) {
        const restoreDraft = { ...cp.revertDraft, confirmPending: undefined } as OrderDraft;
        const returnState  = cp.returnState as ConversationState;
        return {
          nextState: returnState,
          draft:     restoreDraft,
          response:  await getResponseForState(returnState, restoreDraft),
        };
      }

      // Unknown input — re-show confirmation
      return {
        nextState: ConversationState.CONFIRMING_INPUT,
        draft,
        response:  confirmInputFlow(cp.label, cp.displayValue),
      };
    }

    // ── DELIVERY_TYPE ─────────────────────────────────────────────────────
    if (currentState === ConversationState.DELIVERY_TYPE) {
      if (upper === 'PICKUP_TYPE') {
        const updated = { ...draft, deliveryType: 'PICKUP' as const, cardSubStep: 'from' as const };
        return { nextState: ConversationState.CAPTURE_CARD_MSG, draft: updated, response: askCardFrom() };
      }
      if (upper === 'DELIVERY_HOME') {
        const updated = { ...draft, deliveryType: 'DELIVERY' as const, addressSubStep: 'recipient' as const };
        return { nextState: ConversationState.CAPTURE_ADDRESS, draft: updated, response: await buildAddressPrompt('recipient') };
      }
      return { nextState: ConversationState.DELIVERY_TYPE, draft, response: deliveryTypeFlow() };
    }

    // ── CAPTURE_ADDRESS ───────────────────────────────────────────────────
    if (currentState === ConversationState.CAPTURE_ADDRESS) {
      const subStep     = (draft.addressSubStep ?? 'recipient') as AddressSubStep;
      const revertDraft = { ...draft };

      // Municipality: lookup shipping cost before confirmation
      if (subStep === 'municipality') {
        const options = await getMunicipalitySuggestions();
        const trimmedInput = text.trim();
        let resolvedMunicipality = trimmedInput;

        // Interactive list reply: button ID format is "MUNICIPALITY_0", "MUNICIPALITY_1", etc. (0-based)
        const listButtonMatch = trimmedInput.toUpperCase().match(/^MUNICIPALITY_(\d+)$/);
        if (listButtonMatch) {
          const idx = parseInt(listButtonMatch[1], 10);
          if (options[idx]) resolvedMunicipality = options[idx];
        } else {
          // Numbered text reply (1-based) or free-text municipality name
          const numericMatch = trimmedInput.match(/^\d+$/);
          if (numericMatch) {
            const idx = Math.max(0, parseInt(numericMatch[0], 10) - 1);
            if (options[idx]) resolvedMunicipality = options[idx];
          } else {
            const directMatch = options.find((option) => option.toLowerCase() === trimmedInput.toLowerCase());
            if (directMatch) resolvedMunicipality = directMatch;
          }
        }

        const isKnownMunicipality = options.some(
          (option) => option.toLowerCase() === resolvedMunicipality.toLowerCase(),
        );

        if (!isKnownMunicipality) {
          return {
            nextState: ConversationState.CAPTURE_ADDRESS,
            draft,
            response: await buildAddressPrompt('municipality', {
              errorMessage: '⚠️ No encontramos ese municipio. Selecciónalo de la lista o escribe el nombre exacto (ej: Guadalajara, Zapopan).',
            }),
          };
        }

        const { cost, city, state } = await lookupShipping(resolvedMunicipality);
        const costLabel = cost > 0
          ? `${resolvedMunicipality}\nCosto de envío: $${cost.toFixed(2)} MXN`
          : `${resolvedMunicipality}\n⚠️ Costo de envío a confirmar por asesor`;
        const nextSub     = nextAddressSubStep('municipality')!;
        const pendingDraft = {
          ...draft,
          municipalityName: resolvedMunicipality,
          city, state,
          shippingCost:   cost,
          addressSubStep: nextSub,
        };
        return buildConfirmStep(
          'Municipio de entrega', costLabel,
          pendingDraft, revertDraft,
          ConversationState.CAPTURE_ADDRESS,
          ConversationState.CAPTURE_ADDRESS,
        );
      }

      const updated    = applyAddressField(draft, subStep, text);
      const nextSub    = nextAddressSubStep(subStep);
      const fieldLabel = ADDRESS_LABELS[subStep] ?? subStep;

      if (nextSub) {
        const pendingDraft = { ...updated, addressSubStep: nextSub };
        return buildConfirmStep(
          fieldLabel, text.trim(),
          pendingDraft, revertDraft,
          ConversationState.CAPTURE_ADDRESS,
          ConversationState.CAPTURE_ADDRESS,
        );
      }

      // Last address sub-step → move to card
      const pendingDraft = { ...updated, addressSubStep: undefined, cardSubStep: 'from' as const };
      return buildConfirmStep(
        fieldLabel, text.trim(),
        pendingDraft, revertDraft,
        ConversationState.CAPTURE_ADDRESS,
        ConversationState.CAPTURE_CARD_MSG,
      );
    }

    // ── CAPTURE_CARD_MSG ──────────────────────────────────────────────────
    if (currentState === ConversationState.CAPTURE_CARD_MSG) {
      const revertDraft = { ...draft };

      if (draft.cardSubStep === 'from') {
        const pendingDraft = { ...draft, cardFrom: text.trim(), cardSubStep: 'message' as const };
        return buildConfirmStep(
          'De parte de', text.trim(),
          pendingDraft, revertDraft,
          ConversationState.CAPTURE_CARD_MSG,
          ConversationState.CAPTURE_CARD_MSG,
        );
      }

      // message step
      const noMsg = ['sin mensaje', 'ninguno', 'no', 'n/a'].includes(text.trim().toLowerCase());
      const pendingDraft = {
        ...draft,
        ...(noMsg ? {} : { cardMessage: text.trim() }),
        cardSubStep: undefined,
      };
      return buildConfirmStep(
        'Mensaje en tarjeta', noMsg ? 'Sin mensaje' : text.trim(),
        pendingDraft, revertDraft,
        ConversationState.CAPTURE_CARD_MSG,
        ConversationState.CAPTURE_DATE,
      );
    }

    // ── CAPTURE_DATE ──────────────────────────────────────────────────────
    if (currentState === ConversationState.CAPTURE_DATE) {
      const buttonDate = resolveDateOptionId(upper);
      const candidateDate = buttonDate ?? text.trim();
      const parsedDate = parseDateValue(candidateDate);

      if (!parsedDate) {
        return {
          nextState: ConversationState.CAPTURE_DATE,
          draft,
          response: buildDatePrompt('Selecciona una fecha con los botones o escribe DD/MM/AAAA válido.'),
        };
      }

      const availableSlots = getAvailableTimeSlots(parsedDate);
      if (availableSlots.length === 0) {
        return {
          nextState: ConversationState.CAPTURE_DATE,
          draft,
          response: buildDatePrompt('Ya no tenemos horarios disponibles para esa fecha. Elige otra fecha.'),
        };
      }

      const normalizedDate = formatDateValue(parsedDate);
      const revertDraft  = { ...draft };
      const pendingDraft = { ...draft, deliveryDate: normalizedDate };
      return buildConfirmStep(
        draft.deliveryType === 'PICKUP' ? 'Fecha de recolección' : 'Fecha de entrega',
        normalizedDate,
        pendingDraft, revertDraft,
        ConversationState.CAPTURE_DATE,
        ConversationState.CAPTURE_TIME,
      );
    }

    // ── CAPTURE_TIME ──────────────────────────────────────────────────────
    if (currentState === ConversationState.CAPTURE_TIME) {
      const availableSlots = getAvailableTimeSlots(draft.deliveryDate ?? null);

      if (availableSlots.length === 0) {
        return {
          nextState: ConversationState.CAPTURE_DATE,
          draft,
          response: buildDatePrompt('Ya no hay horarios disponibles para esa fecha. Selecciona una nueva fecha.'),
        };
      }

      const buttonMatch = availableSlots.find((slot) => slot.id === upper);
      let resolvedSlot = buttonMatch?.value ?? null;

      if (!resolvedSlot) {
        const normalizedInput = text.trim().toLowerCase();
        resolvedSlot = availableSlots.find((slot) =>
          slot.value.toLowerCase() === normalizedInput || slot.label.toLowerCase() === normalizedInput,
        )?.value;
      }

      if (!resolvedSlot) {
        return {
          nextState: ConversationState.CAPTURE_TIME,
          draft,
          response: askDeliveryTime(availableSlots, {
            errorMessage: 'Selecciona un horario disponible usando los botones.',
          }),
        };
      }

      const updated = { ...draft, deliveryTimeSlot: resolvedSlot };

      const upsellProducts = await fetchUpsellProducts(draft.productId);
      if (upsellProducts.length > 0) {
        const withOptions = { ...updated, upsellOptions: upsellProducts };
        return { nextState: ConversationState.UPSELL, draft: withOptions, response: upsellFlow(upsellProducts) };
      }
      return {
        nextState: ConversationState.PAYMENT_METHOD,
        draft:     updated,
        response:  updated.deliveryType === 'PICKUP' ? pickupSummaryFlow(updated) : orderSummaryFlow(updated),
      };
    }

    // ── UPSELL ────────────────────────────────────────────────────────────
    if (currentState === ConversationState.UPSELL) {
      const normalizedInput = normalizeKeyword(text);
      if (upper === 'UPSELL_SKIP' || UPSELL_SKIP_KEYWORDS.has(normalizedInput)) {
        return {
          nextState: ConversationState.PAYMENT_METHOD,
          draft,
          response: draft.deliveryType === 'PICKUP' ? pickupSummaryFlow(draft) : orderSummaryFlow(draft),
        };
      }

      const proceedToPayment = (updatedDraft: OrderDraft) => ({
        nextState: ConversationState.PAYMENT_METHOD,
        draft:     updatedDraft,
        response:  updatedDraft.deliveryType === 'PICKUP' ? pickupSummaryFlow(updatedDraft) : orderSummaryFlow(updatedDraft),
      });

      const upsellMatch = upper.match(/^UPSELL_P(\d+)$/);
      if (upsellMatch) {
        const productId = parseInt(upsellMatch[1], 10);
        const updated   = await appendUpsellProduct(draft, productId);
        if (updated) {
          return proceedToPayment(updated);
        }
      }

      // Use cached options from draft to avoid repeated DB queries
      const products = draft.upsellOptions ?? await fetchUpsellProducts(draft.productId);

      const numericMatch = text.trim().match(/^(\d+)$/);
      if (numericMatch) {
        const index = parseInt(numericMatch[1], 10) - 1;
        if (index >= 0 && index < products.length) {
          const option  = products[index];
          const updated = await appendUpsellProduct(draft, option.id);
          if (updated) {
            return proceedToPayment(updated);
          }
        }
        return {
          nextState: ConversationState.UPSELL,
          draft,
          response: upsellFlow(products, { errorMessage: 'Selecciona un número válido o escribe "no" para continuar sin extras.' }),
        };
      }

      return {
        nextState: ConversationState.UPSELL,
        draft,
        response: upsellFlow(products, { errorMessage: 'Usa los botones, responde con el número del producto o escribe "no" para omitir.' }),
      };
    }

    // ── PAYMENT_METHOD ────────────────────────────────────────────────────
    if (currentState === ConversationState.PAYMENT_METHOD) {
      if (upper === 'PAYMENT_TRANSFER') {
        try {
          const [meta, orderResult] = await Promise.all([
            companyService.getAll(),
            whatsappOrderService.createOrderOnly(phone, draft),
          ]);
          return {
            nextState: ConversationState.WAITING_PAYMENT,
            draft:     { ...draft, orderId: orderResult.orderId },
            response:  bankTransferFlow(
              meta['bank_name']    ?? 'BBVA',
              meta['bank_account'] ?? 'xxxx xxxx xxxx',
              meta['bank_clabe']   ?? 'xxxxxxxxxxxxxxxxxx',
              meta['bank_owner']   ?? 'Florarte',
              orderResult.orderId,
              orderResult.total,
            ),
          };
        } catch (err) {
          console.error('[ORDER_CAPTURE] Failed to create bank transfer order', err);
          return {
            nextState: ConversationState.PAYMENT_METHOD,
            draft,
            response: {
              messages: [
                { type: 'text', body: '⚠️ Hubo un problema al registrar tu pedido. ¿Deseas intentar de nuevo?' },
                {
                  type: 'interactive_buttons',
                  body: 'Elige método de pago:',
                  buttons: [
                    { id: 'PAYMENT_TRANSFER', title: '🏦 Reintentar transferencia' },
                    { id: 'PAYMENT_ONLINE',   title: '💳 Pagar en línea' },
                    { id: 'ORDER_CANCEL',     title: '❌ Cancelar' },
                  ],
                },
              ],
            },
          };
        }
      }

      if (upper === 'PAYMENT_ONLINE') {
        try {
          const result = await whatsappOrderService.createOrderAndPaymentLink(phone, draft);
          return {
            nextState: ConversationState.WAITING_PAYMENT,
            draft:     { ...draft, orderId: result.orderId, paymentUrl: result.paymentUrl },
            response:  onlinePaymentFlow(result.orderId, result.total, result.paymentUrl),
          };
        } catch (err) {
          console.error('[ORDER_CAPTURE] Failed to create order', err);
          return {
            nextState: ConversationState.PAYMENT_METHOD,
            draft,
            response: {
              messages: [
                { type: 'text', body: '⚠️ Hubo un problema al generar el link de pago. ¿Deseas intentar de nuevo?' },
                {
                  type: 'interactive_buttons',
                  body: 'Elige método de pago:',
                  buttons: [
                    { id: 'PAYMENT_ONLINE',   title: '💳 Reintentar en línea' },
                    { id: 'PAYMENT_TRANSFER', title: '🏦 Transferencia' },
                    { id: 'ORDER_CANCEL',     title: '❌ Cancelar' },
                  ],
                },
              ],
            },
          };
        }
      }

      // Unrecognized — re-show summary
      return {
        nextState: ConversationState.PAYMENT_METHOD,
        draft,
        response:  draft.deliveryType === 'PICKUP' ? pickupSummaryFlow(draft) : orderSummaryFlow(draft),
      };
    }

    // ── WAITING_PAYMENT ───────────────────────────────────────────────────
    if (currentState === ConversationState.WAITING_PAYMENT) {
      return { nextState: ConversationState.WAITING_PAYMENT, draft, response: waitingPaymentFlow() };
    }

    return { nextState: currentState, draft, response: waitingPaymentFlow() };
  },
};

// ─── Field label map ──────────────────────────────────────────────────────────

const ADDRESS_LABELS: Partial<Record<string, string>> = {
  recipient:    'Nombre del destinatario',
  phone:        'Teléfono de contacto',
  municipality: 'Municipio',
  street:       'Calle y número',
  interior:     'Número interior',
  neighborhood: 'Colonia',
  notes:        'Referencia',
};
