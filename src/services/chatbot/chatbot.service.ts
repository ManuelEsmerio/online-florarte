// src/services/chatbot/chatbot.service.ts
// Main chatbot orchestrator — routes intents and states.

import { IncomingMessage, Intent, ConversationState, ChatbotResponse } from '@/types/chatbot.types';
import { intentService } from './intent.service';
import { sessionService } from './session.service';
import { aiService } from './ai.service';
import { chatbotCatalogService } from './catalog.service';
import { orderCaptureService } from './order-capture.service';
import {
  welcomeFlow,
  occasionsFlow,
  categoriesFlow,
  catalogFlow,
  catalogWebFlow,
  quoteFlow,
  locationFlow,
  hoursFlow,
  humanSupportFlow,
  productSelectFlow,
  aiResponseFlow,
  unknownFlow,
} from '@/lib/chatbot/flows/welcome.flow';
import { startOrderFlow, orderCancelledFlow } from '@/lib/chatbot/flows/order.flow';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { companyService } from './company.service';
import { whatsappContactService } from './whatsapp-contact.service';

// ─── Staff notification helper ────────────────────────────────────────────────

/** Fire-and-forget: sends a WhatsApp alert to the business `support_phone` (company meta). */
function notifyHumanSupportRequested(userPhone: string, userMessage: string): void {
  companyService.get('support_phone').then((supportPhone) => {
    if (!supportPhone) return;
    const time = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
    sendWhatsAppMessage(supportPhone, {
      type: 'text',
      body: `🔔 *Solicitud de asesor*\n\n📱 Cliente: ${userPhone}\n🕐 ${time}\n💬 "${userMessage.slice(0, 100)}"`,
    }).catch((err) => console.error('[HUMAN_SUPPORT_NOTIFY_ERROR]', err));
  }).catch(() => {});
}

const WAITING_PAYMENT_EXIT_INTENTS = new Set<Intent>([
  Intent.CATALOG,
  Intent.CATALOG_WEB,
  Intent.ORDER_VIA_WA,
  Intent.HUMAN_SUPPORT,
  Intent.QUOTE,
  Intent.LOCATION,
  Intent.HOURS,
  Intent.FAREWELL,
  Intent.BACK_OCCASIONS,
  Intent.BACK_CATEGORIES,
]);

// ─── Catalog/navigation context helpers ──────────────────────────────────────

/** Parses lastMessage for catalog filters: offset, categoryId, occasionId */
function parseCatalogContext(lastMessage: string | null): { offset: number; categoryId?: number; occasionId?: number } {
  if (!lastMessage) return { offset: 0 };
  const offsetM = lastMessage.match(/catalogOffset:(\d+)/);
  const cidM    = lastMessage.match(/cid:(\d+)/);
  const oidM    = lastMessage.match(/oid:(\d+)/);
  return {
    offset:     offsetM ? parseInt(offsetM[1], 10) : 0,
    categoryId: cidM ? parseInt(cidM[1], 10) : undefined,
    occasionId: oidM ? parseInt(oidM[1], 10) : undefined,
  };
}

/** Builds lastMessage string for catalog state */
function buildCatalogMessage(offset: number, categoryId?: number, occasionId?: number): string {
  return [
    `catalogOffset:${offset}`,
    categoryId ? `:cid:${categoryId}` : '',
    occasionId ? `:oid:${occasionId}` : '',
  ].join('');
}

/** Parses the offset from a CATALOG_MORE button ID (supports format CATALOG_MORE_6:cid:3:oid:5) */
function extractCatalogMore(text: string): { offset: number; categoryId?: number; occasionId?: number } {
  const upper  = text.trim().toUpperCase();
  const baseM  = upper.match(/^CATALOG_MORE_(\d+)/);
  const offset = baseM ? parseInt(baseM[1], 10) : 0;
  const cidM   = upper.match(/:CID:(\d+)/);
  const oidM   = upper.match(/:OID:(\d+)/);
  return {
    offset,
    categoryId: cidM ? parseInt(cidM[1], 10) : undefined,
    occasionId: oidM ? parseInt(oidM[1], 10) : undefined,
  };
}

/** Reads stored occasionId from session.lastMessage ("oid:5") */
function readStoredOccasionId(lastMessage: string | null): number | undefined {
  if (!lastMessage) return undefined;
  const m = lastMessage.match(/oid:(\d+)/);
  return m ? parseInt(m[1], 10) : undefined;
}

// ─── Main orchestrator ────────────────────────────────────────────────────────

export const chatbotService = {
  async process(message: IncomingMessage): Promise<ChatbotResponse> {
    // 1. Load (or create) conversation session
    const session      = await sessionService.getOrCreate(message.phone);
    const currentState = session.currentState as ConversationState;

    // 2. State-aware intent detection
    const intent = intentService.detect(message.text, currentState);

    console.info('[CHATBOT]', { phone: message.phone, state: currentState, intent, text: message.text });

    // 2b. Session timeout — if user abandoned an order flow and returns after 2 hours, reset
    const ORDER_INACTIVITY_MS = 2 * 60 * 60 * 1000; // 2 hours
    const SESSION_IDLE_MS     = 24 * 60 * 60 * 1000; // 24 hours for browsing states
    const ORDER_FLOW_STATES = new Set<ConversationState>([
      ConversationState.ORDER_WHATSAPP,
      ConversationState.DELIVERY_TYPE,
      ConversationState.CONFIRMING_INPUT,
      ConversationState.CAPTURE_ADDRESS,
      ConversationState.CAPTURE_CARD_MSG,
      ConversationState.CAPTURE_DATE,
      ConversationState.CAPTURE_TIME,
      ConversationState.UPSELL,
      ConversationState.PAYMENT_METHOD,
    ]);
    const sessionAge        = Date.now() - new Date(session.updatedAt).getTime();
    const isInOrderFlow     = ORDER_FLOW_STATES.has(currentState);
    const isSessionTimedOut = (isInOrderFlow && sessionAge > ORDER_INACTIVITY_MS)
                           || (!isInOrderFlow && sessionAge > SESSION_IDLE_MS
                               && currentState !== ConversationState.WAITING_PAYMENT
                               && currentState !== ConversationState.HUMAN_SUPPORT);

    if (isSessionTimedOut) {
      await sessionService.clearContext(message.phone);
      await sessionService.update(message.phone, {
        currentState: ConversationState.MAIN_MENU,
        lastIntent:   null,
        lastMessage:  null,
      });
      return {
        messages: [
          { type: 'text', body: '🌸 Tu sesión expiró por inactividad. ¡No te preocupes, empecemos de nuevo!' },
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
      };
    }

    // 3. Check if we are inside a WhatsApp order capture flow
    const isOrderState = [
      ConversationState.ORDER_WHATSAPP,
      ConversationState.DELIVERY_TYPE,
      ConversationState.CONFIRMING_INPUT,
      ConversationState.CAPTURE_ADDRESS,
      ConversationState.CAPTURE_CARD_MSG,
      ConversationState.CAPTURE_DATE,
      ConversationState.CAPTURE_TIME,
      ConversationState.UPSELL,
      ConversationState.PAYMENT_METHOD,
      ConversationState.WAITING_PAYMENT,
    ].includes(currentState);
    const isWaitingPayment = currentState === ConversationState.WAITING_PAYMENT;
    const shouldExitWaitingPayment = isWaitingPayment && WAITING_PAYMENT_EXIT_INTENTS.has(intent);

    // 3a. Cancel order from anywhere inside the order flow
    if (isOrderState && intent === Intent.ORDER_CANCEL) {
      // If the order was already created (WAITING_PAYMENT + orderId), warn the user
      // before clearing context — the DB record won't disappear automatically.
      if (currentState === ConversationState.WAITING_PAYMENT) {
        const draft = await sessionService.getContext(message.phone);
        await sessionService.clearContext(message.phone);
        await sessionService.update(message.phone, {
          currentState: ConversationState.MAIN_MENU,
          lastIntent:   intent,
          lastMessage:  message.text.slice(0, 500),
        });
        if (draft.orderId) {
          return {
            messages: [
              {
                type: 'text',
                body: `⚠️ Tu pedido *#${String(draft.orderId).padStart(4, '0')}* ya fue registrado en nuestro sistema.\n\nSi deseas cancelarlo, contáctanos directamente con ese número y un asesor te ayudará. 🌸`,
              },
              {
                type: 'interactive_buttons',
                body: '¿Qué deseas hacer?',
                buttons: [
                  { id: 'HUMAN_SUPPORT', title: '👤 Hablar con asesor' },
                  { id: 'CATALOG',       title: '🌺 Ver catálogo' },
                  { id: 'FAREWELL',      title: '✅ Finalizar' },
                ],
              },
            ],
          };
        }
        return orderCancelledFlow();
      }
      await sessionService.clearContext(message.phone);
      await sessionService.update(message.phone, {
        currentState: ConversationState.MAIN_MENU,
        lastIntent:   intent,
        lastMessage:  message.text.slice(0, 500),
      });
      return orderCancelledFlow();
    }

    if (shouldExitWaitingPayment) {
      await sessionService.clearContext(message.phone);
    }

    // 3b. Delegate all capture states to orderCaptureService
    if (isOrderState && !shouldExitWaitingPayment) {
      const draft  = await sessionService.getContext(message.phone);
      const result = await orderCaptureService.process(
        message.phone, message.text, currentState, draft,
      );

      // Persist confirmed customer name to WhatsappContact (fire-and-forget)
      if (result.draft.customerName && !draft.customerName) {
        whatsappContactService.upsert(message.phone, result.draft.customerName)
          .catch((err) => console.error('[WA_CONTACT_UPSERT_ERROR]', err));
      }

      await sessionService.setContext(message.phone, result.draft);
      await sessionService.update(message.phone, {
        currentState: result.nextState,
        lastIntent:   intent,
        lastMessage:  message.text.slice(0, 500),
      });
      return result.response;
    }

    // 4. Standard intent routing
    let response: ChatbotResponse;
    let nextState: ConversationState = currentState;
    let persistMessage = message.text.slice(0, 500);

    switch (intent) {

      // ── Welcome ──────────────────────────────────────────────────────────
      case Intent.GREETING: {
        const contact = await whatsappContactService.get(message.phone);
        nextState = ConversationState.MAIN_MENU;
        response  = welcomeFlow(contact?.name);
        break;
      }

      // ── Catalog: show occasions first ─────────────────────────────────────
      case Intent.CATALOG: {
        const occasions = await chatbotCatalogService.getOccasions();
        if (occasions.length > 0) {
          nextState      = ConversationState.VIEWING_OCCASIONS;
          persistMessage = 'occ:';
          response       = await occasionsFlow(occasions);
        } else {
          // No occasions → skip directly to categories
          nextState      = ConversationState.VIEWING_CATEGORIES;
          persistMessage = 'oid:0';
          response       = await categoriesFlow();
        }
        break;
      }

      // ── Occasion selected ─────────────────────────────────────────────────
      case Intent.OCCASION_SELECT: {
        const occasions  = await chatbotCatalogService.getOccasions();
        const upperText  = message.text.trim().toUpperCase();
        const btnMatch   = upperText.match(/^OCCASION_(\d+)$/);
        // Interactive list reply (0-based) or plain number (1-based)
        const num        = btnMatch ? parseInt(btnMatch[1], 10) + 1 : parseInt(message.text.trim(), 10);
        const isOther    = !btnMatch && num === occasions.length + 1;
        const occasion   = isOther ? null : occasions[num - 1];

        // Out-of-range number → re-show occasions list
        if (!isOther && !occasion) {
          nextState      = ConversationState.VIEWING_OCCASIONS;
          persistMessage = 'occ:';
          response       = await occasionsFlow(occasions);
          break;
        }

        const occasionId   = occasion?.id;
        const occasionName = occasion?.name;
        const categories   = await chatbotCatalogService.getCategories(occasionId);
        nextState      = ConversationState.VIEWING_CATEGORIES;
        persistMessage = `oid:${occasionId ?? 0}`;
        response       = await categoriesFlow(categories, occasionName);
        break;
      }

      // ── Back to occasions list ────────────────────────────────────────────
      case Intent.BACK_OCCASIONS: {
        const occasions = await chatbotCatalogService.getOccasions();
        nextState      = ConversationState.VIEWING_OCCASIONS;
        persistMessage = 'occ:';
        response       = await occasionsFlow(occasions);
        break;
      }

      // ── Back to categories (from catalog) ─────────────────────────────────
      case Intent.BACK_CATEGORIES: {
        const occasionId = readStoredOccasionId(session.lastMessage) ?? undefined;
        const categories = await chatbotCatalogService.getCategories(occasionId || undefined);
        nextState      = ConversationState.VIEWING_CATEGORIES;
        persistMessage = `oid:${occasionId ?? 0}`;
        response       = await categoriesFlow(categories);
        break;
      }

      // ── Category selected ─────────────────────────────────────────────────
      case Intent.CATEGORY_SELECT: {
        const occasionId = readStoredOccasionId(session.lastMessage) ?? undefined;
        const categories = await chatbotCatalogService.getCategories(occasionId);
        const upperText  = message.text.trim().toUpperCase();
        const btnMatch   = upperText.match(/^CATEGORY_(\d+)$/);
        // Interactive list reply (0-based) or plain number (1-based)
        const idx        = btnMatch ? parseInt(btnMatch[1], 10) : parseInt(message.text.trim(), 10) - 1;
        const category   = categories[idx];

        if (category) {
          nextState      = ConversationState.VIEWING_CATALOG;
          persistMessage = buildCatalogMessage(0, category.id, occasionId);
          response       = await catalogFlow(0, category.id, occasionId);
        } else {
          response = await categoriesFlow(categories);
        }
        break;
      }

      // ── Catalog web redirect ───────────────────────────────────────────
      case Intent.CATALOG_WEB:
        nextState = ConversationState.MAIN_MENU;
        response  = await catalogWebFlow();
        break;

      // ── Catalog pagination ────────────────────────────────────────────────
      case Intent.CATALOG_MORE: {
        const { offset, categoryId, occasionId } = extractCatalogMore(message.text);
        nextState      = ConversationState.VIEWING_CATALOG;
        persistMessage = buildCatalogMessage(offset, categoryId, occasionId);
        response       = await catalogFlow(offset, categoryId, occasionId);
        break;
      }

      // ── Product selection ─────────────────────────────────────────────────
      case Intent.PRODUCT_SELECT: {
        const digit = message.text.trim();
        if (/^[123]$/.test(digit)) {
          const { offset, categoryId, occasionId } = parseCatalogContext(session.lastMessage);
          const page    = await chatbotCatalogService.getPage(offset, categoryId, occasionId);
          const product = page.products[parseInt(digit, 10) - 1];
          if (product) {
            await sessionService.setContext(message.phone, {
              productId:    product.id,
              productName:  product.name,
              productSlug:  product.slug,
              productPrice: product.price,
            });
            response = await productSelectFlow(product.name, product.slug, product.imageUrl ?? undefined);
          } else {
            response = await catalogFlow(offset, categoryId, occasionId);
          }
        } else {
          response = await productSelectFlow(message.text);
        }
        break;
      }

      // ── Start WhatsApp order ──────────────────────────────────────────────
      case Intent.ORDER_VIA_WA: {
        const draft       = await sessionService.getContext(message.phone);
        const productName = draft.productName ?? 'tu arreglo';
        nextState         = ConversationState.ORDER_WHATSAPP;
        response          = startOrderFlow(productName);
        break;
      }

      // ── Quote ─────────────────────────────────────────────────────────────
      case Intent.QUOTE:
        nextState = ConversationState.QUOTE_FLOW;
        response  = await quoteFlow();
        break;

      // ── Location / Hours ──────────────────────────────────────────────────
      case Intent.LOCATION:
        response = await locationFlow();
        break;

      case Intent.HOURS:
        response = await hoursFlow();
        break;

      // ── Human support ─────────────────────────────────────────────────────
      case Intent.HUMAN_SUPPORT:
        nextState = ConversationState.HUMAN_SUPPORT;
        response  = humanSupportFlow();
        console.warn('[HUMAN_SUPPORT_ALERT]', { phone: message.phone, state: currentState });
        notifyHumanSupportRequested(message.phone, message.text);
        break;

      // ── Cancel (outside order flow) ───────────────────────────────────────
      case Intent.ORDER_CANCEL:
        nextState = ConversationState.MAIN_MENU;
        response  = orderCancelledFlow();
        break;

      // ── Farewell ──────────────────────────────────────────────────────────
      case Intent.FAREWELL:
        nextState = ConversationState.MAIN_MENU;
        await sessionService.clearContext(message.phone);
        response  = {
          messages: [{
            type: 'text',
            body: '¡Hasta pronto! 🌸 Si necesitas algo más, escríbenos cuando quieras. ¡Fue un placer atenderte!',
          }],
        };
        break;

      // ── Unknown ───────────────────────────────────────────────────────────
      case Intent.UNKNOWN:
      default: {
        if (currentState === ConversationState.WELCOME) {
          const contact = await whatsappContactService.get(message.phone);
          nextState = ConversationState.MAIN_MENU;
          response  = welcomeFlow(contact?.name);
          break;
        }
        // In HUMAN_SUPPORT state: user may be writing freely to the advisor.
        // Don't trigger AI or menu — just reassure them and stay in state.
        if (currentState === ConversationState.HUMAN_SUPPORT) {
          response = {
            messages: [{ type: 'text', body: '⏳ Un asesor revisará tu mensaje y te responderá pronto. ¡Gracias por tu paciencia! 🌸' }],
          };
          break;
        }
        // In QUOTE_FLOW: re-show the quote info if user sends something unrecognised.
        if (currentState === ConversationState.QUOTE_FLOW) {
          response = await quoteFlow();
          break;
        }
        if (aiService.isEnabled()) {
          try {
            const aiText = await aiService.respond(message.text);
            response = aiResponseFlow(aiText);
          } catch {
            response = unknownFlow();
          }
        } else {
          response = unknownFlow();
        }
        break;
      }
    }

    // 5. Persist session update
    await sessionService.update(message.phone, {
      currentState: nextState,
      lastIntent:   intent,
      lastMessage:  persistMessage,
    });

    return response;
  },
};
