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
  mapTimeSlotId,
  timeSlots as TIME_SLOTS?,
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

// ─── Date validation (not in past, max 2 weeks ahead) ────────────────────────

function isValidDate(text: string): boolean {
  const match = text.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return false;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return false;
  const dt = new Date(year, month - 1, day);
  if (dt.getFullYear() !== year || dt.getMonth() !== month - 1 || dt.getDate() !== day) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 14);
  dt.setHours(0, 0, 0, 0);

  return dt >= today && dt <= maxDate;
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
    case ConversationState.CAPTURE_TIME:
      return askDeliveryTime();
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
        return { nextState: ConversationState.MAIN_MENU, draft, response: waitingPaymentFlow() };
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
        const numericMatch = trimmedInput.match(/^\d+$/);
        let resolvedMunicipality = trimmedInput;

        if (numericMatch) {
          const idx = Math.max(0, parseInt(numericMatch[0], 10) - 1);
          if (options[idx]) {
            resolvedMunicipality = options[idx];
          }
        } else {
          const directMatch = options.find((option) => option.toLowerCase() === trimmedInput.toLowerCase());
          if (directMatch) {
            resolvedMunicipality = directMatch;
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
              errorMessage: 'Selecciona un municipio con el botón "Elegir municipio".',
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

      if (!isValidDate(candidateDate)) {
        return {
          nextState: ConversationState.CAPTURE_DATE,
          draft,
          response: buildDatePrompt('Selecciona una fecha con los botones o escribe DD/MM/AAAA válido.'),
        };
      }

      const revertDraft  = { ...draft };
      const pendingDraft = { ...draft, deliveryDate: candidateDate };
      return buildConfirmStep(
        draft.deliveryType === 'PICKUP' ? 'Fecha de recolección' : 'Fecha de entrega',
        candidateDate,
        pendingDraft, revertDraft,
        ConversationState.CAPTURE_DATE,
        ConversationState.CAPTURE_TIME,
      );
    }

    // ── CAPTURE_TIME ──────────────────────────────────────────────────────
    if (currentState === ConversationState.CAPTURE_TIME) {
      const isTimeButton = TIME_SLOTS.some((s) => s.id === upper);
      const slot    = isTimeButton ? mapTimeSlotId(upper) : TIME_SLOTS[0].value;
      const updated = { ...draft, deliveryTimeSlot: slot };

      const upsellProducts = await fetchUpsellProducts(draft.productId);
      if (upsellProducts.length > 0) {
        return { nextState: ConversationState.UPSELL, draft: updated, response: upsellFlow(upsellProducts) };
      }
      return {
        nextState: ConversationState.PAYMENT_METHOD,
        draft:     updated,
        response:  updated.deliveryType === 'PICKUP' ? pickupSummaryFlow(updated) : orderSummaryFlow(updated),
      };
    }

    // ── UPSELL ────────────────────────────────────────────────────────────
    if (currentState === ConversationState.UPSELL) {
      if (upper === 'UPSELL_SKIP') {
        return {
          nextState: ConversationState.PAYMENT_METHOD,
          draft,
          response:  draft.deliveryType === 'PICKUP' ? pickupSummaryFlow(draft) : orderSummaryFlow(draft),
        };
      }
      const upsellMatch = upper.match(/^UPSELL_P(\d+)$/);
      if (upsellMatch) {
        const productId = parseInt(upsellMatch[1], 10);
        const product   = await prisma.product.findUnique({
          where:  { id: productId },
          select: { id: true, name: true, price: true, salePrice: true },
        });
        if (product) {
          const price   = Number(product.salePrice && product.salePrice < product.price ? product.salePrice : product.price);
          const updated = {
            ...draft,
            upsellItems: [...(draft.upsellItems ?? []), { id: product.id, name: product.name, price }],
          };
          return {
            nextState: ConversationState.PAYMENT_METHOD,
            draft:     updated,
            response:  updated.deliveryType === 'PICKUP' ? pickupSummaryFlow(updated) : orderSummaryFlow(updated),
          };
        }
      }
      const products = await fetchUpsellProducts(draft.productId);
      return { nextState: ConversationState.UPSELL, draft, response: upsellFlow(products) };
    }

    // ── PAYMENT_METHOD ────────────────────────────────────────────────────
    if (currentState === ConversationState.PAYMENT_METHOD) {
      if (upper === 'PAYMENT_TRANSFER') {
        const meta  = await companyService.getAll();
        const total = (draft.productPrice ?? 0)
                    + (draft.shippingCost ?? 0)
                    + (draft.upsellItems ?? []).reduce((s, i) => s + i.price, 0);
        const orderId = Date.now();
        return {
          nextState: ConversationState.WAITING_PAYMENT,
          draft,
          response:  bankTransferFlow(
            meta['bank_name']    ?? 'BBVA',
            meta['bank_account'] ?? 'xxxx xxxx xxxx',
            meta['bank_clabe']   ?? 'xxxxxxxxxxxxxxxxxx',
            meta['bank_owner']   ?? 'Florarte',
            orderId, total,
          ),
        };
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
