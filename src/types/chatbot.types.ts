// src/types/chatbot.types.ts

// ─── Intents ────────────────────────────────────────────────────────────────

export enum Intent {
  GREETING        = 'GREETING',
  CATALOG         = 'CATALOG',
  CATALOG_MORE    = 'CATALOG_MORE',
  CATALOG_WEB      = 'CATALOG_WEB',       // redirect to website catalog
  PRODUCT_SELECT   = 'PRODUCT_SELECT',
  OCCASION_SELECT  = 'OCCASION_SELECT',   // user picks an occasion by number
  CATEGORY_SELECT  = 'CATEGORY_SELECT',   // user picks a category by number
  QUOTE            = 'QUOTE',
  LOCATION         = 'LOCATION',
  HOURS            = 'HOURS',
  HUMAN_SUPPORT    = 'HUMAN_SUPPORT',
  FAREWELL         = 'FAREWELL',          // end conversation
  // Catalog back-navigation
  BACK_OCCASIONS   = 'BACK_OCCASIONS',   // from categories → back to occasions
  BACK_CATEGORIES  = 'BACK_CATEGORIES',  // from catalog → back to categories
  // WhatsApp order flow
  ORDER_VIA_WA     = 'ORDER_VIA_WA',
  PAYMENT_TRANSFER = 'PAYMENT_TRANSFER',
  PAYMENT_ONLINE   = 'PAYMENT_ONLINE',
  ORDER_CANCEL     = 'ORDER_CANCEL',
  UNKNOWN          = 'UNKNOWN',
}

// ─── Conversation states ─────────────────────────────────────────────────────

export enum ConversationState {
  WELCOME           = 'WELCOME',
  MAIN_MENU         = 'MAIN_MENU',
  VIEWING_OCCASIONS = 'VIEWING_OCCASIONS', // browsing occasions list
  VIEWING_CATEGORIES = 'VIEWING_CATEGORIES', // browsing categories (optionally by occasion)
  VIEWING_CATALOG   = 'VIEWING_CATALOG',  // browsing products (optionally filtered)
  // WhatsApp order capture flow
  ORDER_WHATSAPP   = 'ORDER_WHATSAPP',    // captures customer name
  DELIVERY_TYPE    = 'DELIVERY_TYPE',     // pickup vs delivery selection
  CONFIRMING_INPUT = 'CONFIRMING_INPUT',  // per-field confirmation step
  CAPTURE_ADDRESS  = 'CAPTURE_ADDRESS',   // address multi-step (delivery only)
  CAPTURE_CARD_MSG = 'CAPTURE_CARD_MSG',  // card info multi-step
  CAPTURE_DATE     = 'CAPTURE_DATE',      // delivery/pickup date
  CAPTURE_TIME     = 'CAPTURE_TIME',      // time slot (buttons)
  UPSELL           = 'UPSELL',            // complementary products
  PAYMENT_METHOD   = 'PAYMENT_METHOD',    // payment selection
  WAITING_PAYMENT  = 'WAITING_PAYMENT',   // order created, awaiting payment
  // Other
  QUOTE_FLOW       = 'QUOTE_FLOW',
  HUMAN_SUPPORT    = 'HUMAN_SUPPORT',
}

// ─── WhatsApp order draft ────────────────────────────────────────────────────

/** Pending per-field confirmation data — stored while in CONFIRMING_INPUT state. */
export interface ConfirmPending {
  label:        string;
  displayValue: string;
  /** Draft WITH the new field applied and sub-step already advanced to next. */
  pendingDraft: Omit<OrderDraft, 'confirmPending'>;
  /** Draft as it was before the change — used when user clicks "Editar". */
  revertDraft:  Omit<OrderDraft, 'confirmPending'>;
  returnState:  string; // ConversationState to go back to on EDIT
  nextState:    string; // ConversationState to advance to on YES
}

export interface OrderDraft {
  // Product
  productId?:    number;
  productName?:  string;
  productSlug?:  string;
  productPrice?: number;
  // Customer
  customerName?:  string;
  customerPhone?: string;
  // Delivery type
  deliveryType?: 'PICKUP' | 'DELIVERY';
  // Address (for DELIVERY — captured step by step)
  recipientName?:    string;
  recipientPhone?:   string;
  municipalityName?: string;
  streetName?:       string;
  streetNumber?:     string;
  interiorNumber?:   string;
  neighborhood?:     string;
  postalCode?:       string;
  city?:             string;
  state?:            string;
  addressNotes?:     string;
  /** Current sub-step within CAPTURE_ADDRESS */
  addressSubStep?:   'recipient' | 'phone' | 'municipality' | 'street' | 'interior' | 'neighborhood' | 'notes';
  // Shipping cost (resolved when municipality is entered)
  shippingCost?: number;
  // Card
  cardFrom?:    string;
  cardMessage?: string;
  cardSubStep?: 'from' | 'message';
  // Delivery / pickup date & time
  deliveryDate?:     string; // DD/MM/YYYY
  deliveryTimeSlot?: string;
  // Upsell extras added to order
  upsellItems?: Array<{ id: number; name: string; price: number }>;
  // Cached upsell product options (fetched once when entering UPSELL state)
  upsellOptions?: Array<{ id: number; name: string; price: number }>;
  // Per-field confirmation sub-state
  confirmPending?: ConfirmPending;
  // Result
  orderId?:    number;
  paymentUrl?: string;
}

// ─── Messages ────────────────────────────────────────────────────────────────

export interface IncomingMessage {
  /** WhatsApp phone number (e.g. "521234567890") */
  phone: string;
  text: string;
  messageId: string;
}

export type OutgoingMessage =
  | TextMessage
  | InteractiveButtonMessage
  | InteractiveListMessage
  | CtaUrlMessage
  | LocationMessage
  | ImageMessage;

export interface TextMessage {
  type: 'text';
  body: string;
}

/** Up to 3 buttons — WhatsApp API limit */
export interface InteractiveButtonMessage {
  type: 'interactive_buttons';
  body: string;
  buttons: Array<{ id: string; title: string }>;
}

export interface InteractiveListMessage {
  type: 'interactive_list';
  body: string;
  buttonText: string;
  sections: Array<{
    title: string;
    rows: Array<{ id: string; title: string; description?: string }>;
  }>;
}

/** Single call-to-action button that opens a URL */
export interface CtaUrlMessage {
  type: 'cta_url';
  body: string;
  buttonText: string;
  url: string;
}

/** Native WhatsApp location pin */
export interface LocationMessage {
  type: 'location';
  latitude: number;
  longitude: number;
  name: string;
  address: string;
}

/** Product image message (Cloudinary URL) */
export interface ImageMessage {
  type: 'image';
  url: string;
  caption?: string;
}

// ─── Chatbot response ────────────────────────────────────────────────────────

export interface ChatbotResponse {
  messages: OutgoingMessage[];
}

// ─── Session (used from Phase 2 onward) ─────────────────────────────────────

export interface ChatSession {
  id: number;
  phone: string;
  userId: number | null;
  currentState: ConversationState;
  lastIntent: Intent | null;
  lastMessage: string | null;
  updatedAt: Date;
}
