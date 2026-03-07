// src/services/chatbot/intent.service.ts
// Keyword-based intent detection — no AI, no DB, pure logic.
// Phase 4: accepts current ConversationState to resolve ambiguous inputs.

import { Intent, ConversationState } from '@/types/chatbot.types';

type KeywordMap = Partial<Record<Intent, string[]>>;

const KEYWORD_MAP: KeywordMap = {
  [Intent.GREETING]: [
    'hola', 'buenos días', 'buenas tardes', 'buenas noches',
    'hey', 'saludos', 'hi', 'buenas', 'buen día', 'qué tal',
  ],
  [Intent.CATALOG]: [
    'catálogo', 'catalogo', 'flores', 'arreglo', 'arreglos', 'ramo', 'ramos',
    'ver', 'productos', 'qué tienen', 'que tienen', 'qué venden', 'que venden',
    'opciones', 'mostrar', 'bouquet',
  ],
  [Intent.QUOTE]: [
    'precio', 'precios', 'cuánto', 'cuanto', 'cuesta', 'cuestan', 'costo',
    'cotizar', 'cotización', 'cotizacion', 'presupuesto', 'cuánto cuesta',
    'cuánto cobran', 'tarifa',
  ],
  [Intent.LOCATION]: [
    'dirección', 'direccion', 'dónde', 'donde', 'ubicación', 'ubicacion',
    'cómo llegar', 'como llegar', 'mapa', 'local', 'tienda', 'sucursal',
  ],
  [Intent.HOURS]: [
    'horario', 'horarios', 'abren', 'cierran', 'abierto', 'cerrado',
    'a qué hora', 'a que hora', 'cuando abren', 'cuándo abren', 'atienden',
  ],
  [Intent.HUMAN_SUPPORT]: [
    'asesor', 'persona', 'humano', 'hablar con alguien', 'ayuda',
    'soporte', 'agente', 'vendedor', 'operador', 'representante',
  ],
  [Intent.ORDER_CANCEL]: [
    'cancelar pedido', 'cancela el pedido', 'no quiero', 'olvidalo', 'olvídalo',
  ],
};

// Quick-reply button IDs sent from the WhatsApp interactive buttons
const BUTTON_ID_MAP: Record<string, Intent> = {
  CATALOG:          Intent.CATALOG,
  CATALOG_WEB:      Intent.CATALOG_WEB,   // redirects to website catalog
  QUOTE:            Intent.QUOTE,
  LOCATION:         Intent.LOCATION,
  HUMAN_SUPPORT:    Intent.HUMAN_SUPPORT,
  HOURS:            Intent.HOURS,
  ORDER_WA:         Intent.ORDER_VIA_WA,
  PAYMENT_TRANSFER: Intent.PAYMENT_TRANSFER,
  PAYMENT_ONLINE:   Intent.PAYMENT_ONLINE,
  ORDER_CANCEL:     Intent.ORDER_CANCEL,
  // Navigation buttons
  BACK_TO_SHOP:     Intent.CATALOG,
  OCCASION_OTHER:   Intent.BACK_CATEGORIES, // "Otro" occasion → show all categories (no occasion filter)
  BACK_OCCASIONS:   Intent.BACK_OCCASIONS,  // from categories → back to occasions list
  BACK_CATEGORIES:  Intent.BACK_CATEGORIES, // from catalog → back to categories
  FAREWELL:         Intent.FAREWELL,
};

// Numeric shortcut from plain-text menus
const NUMERIC_MAP: Record<string, Intent> = {
  '1': Intent.CATALOG,
  '2': Intent.QUOTE,
  '3': Intent.LOCATION,
  '4': Intent.HUMAN_SUPPORT,
};

// State-aware overrides: when the user is in a specific state, ambiguous
// inputs ("sí", "si", "más", "ok") resolve to the contextually correct intent.
const STATE_CONTINUATION_MAP: Partial<Record<ConversationState, Intent>> = {
  [ConversationState.VIEWING_CATALOG]: Intent.CATALOG,
  [ConversationState.QUOTE_FLOW]:      Intent.QUOTE,
};

const AFFIRMATIVE = new Set(['si', 'sí', 'sí!', 'si!', 'ok', 'dale', 'ver más', 'ver mas', 'más', 'mas']);

export const intentService = {
  detect(text: string, state?: ConversationState): Intent {
    const normalized = text.toLowerCase().trim();

    // 1. Exact match against button IDs (upper-case)
    const upper = text.trim().toUpperCase();
    if (BUTTON_ID_MAP[upper]) return BUTTON_ID_MAP[upper];

    // 1b. Paginated catalog button: "CATALOG_MORE_6", "CATALOG_MORE_9:cid:3:oid:5", etc.
    if (/^CATALOG_MORE_\d+/.test(upper)) return Intent.CATALOG_MORE;

    // 2a. When viewing occasions, any number selects an occasion
    if (state === ConversationState.VIEWING_OCCASIONS && /^\d+$/.test(normalized)) {
      return Intent.OCCASION_SELECT;
    }

    // 2b. When viewing categories, any number selects a category
    if (state === ConversationState.VIEWING_CATEGORIES && /^\d+$/.test(normalized)) {
      return Intent.CATEGORY_SELECT;
    }

    // 2c. When viewing catalog, 1/2/3 selects a product — takes priority over numeric menu
    if (state === ConversationState.VIEWING_CATALOG && /^[123]$/.test(normalized)) {
      return Intent.PRODUCT_SELECT;
    }

    // 2b. Numeric shortcut for main menu
    if (NUMERIC_MAP[normalized]) return NUMERIC_MAP[normalized];

    // 3. State-aware continuation — affirmative replies carry the current flow forward
    if (state && AFFIRMATIVE.has(normalized)) {
      const continuation = STATE_CONTINUATION_MAP[state];
      if (continuation) return continuation;
    }

    // 4. Keyword scan
    for (const [intent, keywords] of Object.entries(KEYWORD_MAP) as [Intent, string[]][]) {
      if (keywords.some((kw) => normalized.includes(kw))) {
        return intent;
      }
    }

    return Intent.UNKNOWN;
  },
};
