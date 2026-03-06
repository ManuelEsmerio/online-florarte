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

const WAITING_PAYMENT_EXIT_INTENTS = new Set<Intent>([
  Intent.CATALOG,
  Intent.CATALOG_WEB,
  Intent.ORDER_VIA_WA,
  Intent.HUMAN_SUPPORT,
  Intent.QUOTE,
  Intent.LOCATION,
  Intent.HOURS,
  Intent.FAREWELL,
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
      case Intent.GREETING:
        nextState = ConversationState.MAIN_MENU;
        response  = welcomeFlow();
        break;

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
        const occasions    = await chatbotCatalogService.getOccasions();
        const num          = parseInt(message.text.trim(), 10);
        const isOther      = num === occasions.length + 1;
        const occasion     = isOther ? null : occasions[num - 1];
        const occasionId   = occasion?.id;
        const occasionName = occasion?.name;

        const categories = await chatbotCatalogService.getCategories(occasionId);
        nextState      = ConversationState.VIEWING_CATEGORIES;
        persistMessage = `oid:${occasionId ?? 0}`;
        response       = await categoriesFlow(categories, occasionName);
        break;
      }

      // ── Category selected ─────────────────────────────────────────────────
      case Intent.CATEGORY_SELECT: {
        const upper = message.text.trim().toUpperCase();

        // BACK_CATEGORIES button or OCCASION_OTHER → re-show categories
        if (upper === 'BACK_CATEGORIES' || upper === 'OCCASION_OTHER') {
          const occasionId = readStoredOccasionId(session.lastMessage) ?? undefined;
          const categories = await chatbotCatalogService.getCategories(occasionId || undefined);
          nextState      = ConversationState.VIEWING_CATEGORIES;
          persistMessage = `oid:${occasionId ?? 0}`;
          response       = await categoriesFlow(categories);
          break;
        }

        const occasionId = readStoredOccasionId(session.lastMessage) ?? undefined;
        const categories = await chatbotCatalogService.getCategories(occasionId);
        const num        = parseInt(message.text.trim(), 10);
        const category   = categories[num - 1];

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
        response = await catalogWebFlow();
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
            response = await productSelectFlow(product.name, product.slug);
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
        break;

      // ── Cancel (outside order flow) ───────────────────────────────────────
      case Intent.ORDER_CANCEL:
        nextState = ConversationState.MAIN_MENU;
        response  = orderCancelledFlow();
        break;

      // ── Farewell ──────────────────────────────────────────────────────────
      case Intent.FAREWELL:
        nextState = ConversationState.MAIN_MENU;
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
          nextState = ConversationState.MAIN_MENU;
          response  = welcomeFlow();
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
