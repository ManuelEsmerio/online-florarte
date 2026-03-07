// src/lib/chatbot/flows/welcome.flow.ts
// All chatbot flows. Company data from companyService (DB). Products from chatbotCatalogService.

import { ChatbotResponse } from '@/types/chatbot.types';
import { companyService } from '@/services/chatbot/company.service';
import { chatbotCatalogService, CatalogPage, CatalogOccasion, CatalogCategory } from '@/services/chatbot/catalog.service';

// ─── Format helpers ───────────────────────────────────────────────────────────

function formatPrice(price: number, salePrice: number | null): string {
  if (salePrice && salePrice < price) return `~~$${price}~~ *$${salePrice}*`;
  return `*$${price}*`;
}

const EMOJIS = ['1️⃣', '2️⃣', '3️⃣'];

// ─── Welcome / Menu ───────────────────────────────────────────────────────────

export function welcomeFlow(contactName?: string): ChatbotResponse {
  const greeting = contactName
    ? `🌸 ¡Hola de nuevo, *${contactName}*! 💐\n\nQué gusto tenerte aquí. ¿En qué puedo ayudarte hoy?`
    : '🌸 ¡Hola! Bienvenido a *Florarte* 💐\n\nSoy tu asistente floral. ¿En qué puedo ayudarte hoy?';

  return {
    messages: [
      { type: 'text', body: greeting },
      {
        type: 'interactive_buttons',
        body: 'Elige una opción:',
        buttons: [
          { id: 'CATALOG',       title: '🌺 Ver catálogo' },
          { id: 'QUOTE',         title: '💰 Cotizar arreglo' },
          { id: 'HUMAN_SUPPORT', title: '👤 Hablar con asesor' },
        ],
      },
    ],
  };
}

// ─── Occasions list ────────────────────────────────────────────────────────────

export async function occasionsFlow(occasions?: CatalogOccasion[]): Promise<ChatbotResponse> {
  const list = occasions ?? await chatbotCatalogService.getOccasions();

  if (list.length === 0) {
    // No occasions configured — fall through to categories
    return categoriesFlow();
  }

  const rows = [
    ...list.map((o, i) => ({ id: `OCCASION_${i}`, title: o.name.slice(0, 24) })),
    { id: 'OCCASION_OTHER', title: '🌸 Otra ocasión' },
  ];

  return {
    messages: [
      {
        type: 'interactive_list',
        body: '🌸 *¿Para qué ocasión buscas flores?*\n\nSelecciona una opción de la lista:',
        buttonText: 'Ver ocasiones',
        sections: [{ title: 'Ocasiones', rows }],
      },
      {
        type: 'interactive_buttons',
        body: ' ',
        buttons: [
          { id: 'CATALOG_WEB',   title: '🌐 Ver tienda completa' },
          { id: 'HUMAN_SUPPORT', title: '👤 Hablar con asesor' },
        ],
      },
    ],
  };
}

// ─── Categories list ───────────────────────────────────────────────────────────

export async function categoriesFlow(
  categories?: CatalogCategory[],
  occasionName?: string,
): Promise<ChatbotResponse> {
  const list = categories ?? await chatbotCatalogService.getCategories();

  if (list.length === 0) {
    return catalogFlow(0);
  }

  const contextText = occasionName ? ` para *${occasionName}*` : '';
  const rows        = list.map((c, i) => ({ id: `CATEGORY_${i}`, title: c.name.slice(0, 24) }));

  return {
    messages: [
      {
        type: 'interactive_list',
        body: `📦 *Selecciona una categoría${contextText}:*`,
        buttonText: 'Ver categorías',
        sections: [{ title: 'Categorías', rows }],
      },
      {
        type: 'interactive_buttons',
        body: ' ',
        buttons: [
          { id: 'BACK_OCCASIONS', title: '⬅️ Ocasiones' },
          { id: 'CATALOG_WEB',    title: '🌐 Tienda completa' },
          { id: 'HUMAN_SUPPORT',  title: '👤 Hablar con asesor' },
        ],
      },
    ],
  };
}

// ─── Product catalog with pagination (optionally filtered) ────────────────────

export async function catalogFlow(
  offset = 0,
  categoryId?: number,
  occasionId?: number,
): Promise<ChatbotResponse> {
  const siteUrl = await companyService.get('site_url') ?? 'https://online-florarte.vercel.app';
  const page: CatalogPage = await chatbotCatalogService.getPage(offset, categoryId, occasionId);

  if (page.products.length === 0) {
    return {
      messages: [
        {
          type: 'text',
          body: `🌺 No encontramos productos disponibles en esta categoría.\n\nVisita nuestra tienda en línea:`,
        },
        {
          type: 'interactive_buttons',
          body: 'Explorar más:',
          buttons: [
            { id: 'BACK_CATEGORIES', title: '⬅️ Categorías' },
            { id: 'CATALOG_WEB',     title: '🌐 Tienda completa' },
          ],
        },
      ],
    };
  }

  // Build product list text
  const pageNum  = Math.floor(offset / 3) + 1;
  const listText = page.products
    .map((p, i) =>
      `${EMOJIS[i]} *${p.name}* — ${formatPrice(p.price, p.salePrice)}`,
    )
    .join('\n\n');

  const headerText = `🌺 *Productos disponibles* (pág. ${pageNum})\n\n${listText}\n\n_Escribe el *número* del arreglo que te interesa._`;

  // Encode filter in button ID for "Ver más" pagination
  const moreId = [
    `CATALOG_MORE_${page.nextOffset}`,
    categoryId ? `:cid:${categoryId}` : '',
    occasionId ? `:oid:${occasionId}` : '',
  ].join('');

  // Build navigation buttons (max 3)
  const buttons: Array<{ id: string; title: string }> = [];
  if (page.hasMore) {
    buttons.push({ id: moreId, title: '➡️ Ver más' });
  }
  buttons.push({ id: 'BACK_CATEGORIES', title: '⬅️ Categorías' });
  if (buttons.length < 3) {
    buttons.push({ id: 'CATALOG_WEB', title: '🌐 Tienda completa' });
  }

  return {
    messages: [
      { type: 'text', body: headerText },
      { type: 'interactive_buttons', body: '¿Qué deseas hacer?', buttons },
    ],
  };
}

// ─── Phase 6 — Product interest → direct purchase link ────────────────────────

export async function productSelectFlow(
  productName: string,
  slug?: string,
  imageUrl?: string,
): Promise<ChatbotResponse> {
  const siteUrl    = await companyService.get('site_url') ?? 'https://online-florarte.vercel.app';
  const productUrl = slug ? `${siteUrl}/products/${slug}` : `${siteUrl}/catalog`;

  const messages: ChatbotResponse['messages'] = [];

  // WhatsApp requires a publicly accessible HTTPS URL.
  // Convert relative paths (/sample/...) to absolute using siteUrl.
  const absoluteImageUrl = imageUrl
    ? /^https?:\/\//i.test(imageUrl)
      ? imageUrl                    // already absolute (Cloudinary, CDN)
      : `${siteUrl}${imageUrl}`     // relative → prepend site domain
    : undefined;

  if (absoluteImageUrl) {
    messages.push({ type: 'image', url: absoluteImageUrl, caption: `🌸 ${productName}` });
  }

  messages.push({
    type: 'text',
    body: `💐 ¡Excelente elección!\n\n*${productName}*\n\n¿Cómo deseas realizar tu pedido?`,
  });
  messages.push({
    type: 'interactive_buttons',
    body: 'Elige una opción:',
    buttons: [
      { id: 'ORDER_WA',      title: '📲 Pedir por WhatsApp' },
      { id: 'CATALOG',       title: '🌺 Ver más arreglos' },
      { id: 'HUMAN_SUPPORT', title: '👤 Hablar con asesor' },
    ],
  });
  messages.push({
    type: 'cta_url',
    body: 'O compra directamente desde nuestra tienda:',
    buttonText: '🛒 Ordenar en sitio web',
    url: productUrl,
  });

  return { messages };
}

export async function catalogWebFlow(): Promise<ChatbotResponse> {
  const siteUrl = await companyService.get('site_url') ?? 'https://online-florarte.vercel.app';
  return {
    messages: [
      {
        type: 'cta_url',
        body: '🌺 Explora nuestro catálogo completo en la tienda en línea:',
        buttonText: '🛍️ Ver catálogo completo',
        url: `${siteUrl}/catalog`,
      },
    ],
  };
}

// ─── Other flows ──────────────────────────────────────────────────────────────

export async function locationFlow(): Promise<ChatbotResponse> {
  const meta    = await companyService.getAll();
  const name    = meta['name']    ?? 'Florarte';
  const address = meta['address'] ?? 'Consulta nuestra dirección en la web';
  const hours   = meta['hours']   ?? 'Lun–Sáb 9am–7pm';
  const lat     = parseFloat(meta['latitude']  ?? '0');
  const lng     = parseFloat(meta['longitude'] ?? '0');

  const messages: ChatbotResponse['messages'] = [];

  // Native WhatsApp location pin (if coordinates are available)
  if (lat && lng) {
    messages.push({ type: 'location', latitude: lat, longitude: lng, name, address });
  }

  // Text with hours + map link
  const mapsUrl = lat && lng
    ? `https://maps.google.com/?q=${lat},${lng}`
    : null;

  messages.push({
    type: 'text',
    body: `🕘 *Horario:* ${hours}${mapsUrl ? `\n\n📍 ${address}` : `\n\n📬 ${address}`}`,
  });

  if (mapsUrl) {
    messages.push({
      type: 'cta_url',
      body: '¿Cómo llegar?',
      buttonText: '🗺️ Abrir en Maps',
      url: mapsUrl,
    });
  }

  messages.push({
    type: 'interactive_buttons',
    body: '¿En qué más puedo ayudarte?',
    buttons: [
      { id: 'CATALOG',  title: '🌺 Ver catálogo' },
      { id: 'HOURS',    title: '🕘 Ver horarios' },
      { id: 'FAREWELL', title: '✅ Finalizar' },
    ],
  });

  return { messages };
}

export async function hoursFlow(): Promise<ChatbotResponse> {
  const hours = await companyService.get('hours') ?? 'Lun–Sáb 9am–7pm, Dom 10am–3pm';
  return {
    messages: [
      { type: 'text', body: `🕘 *Horarios de atención:*\n${hours}\n\n¡Te esperamos! 🌸` },
      {
        type: 'interactive_buttons',
        body: '¿En qué más puedo ayudarte?',
        buttons: [
          { id: 'CATALOG',       title: '🌺 Ver catálogo' },
          { id: 'LOCATION',      title: '📍 Cómo llegar' },
          { id: 'HUMAN_SUPPORT', title: '👤 Hablar con asesor' },
        ],
      },
    ],
  };
}

export async function quoteFlow(): Promise<ChatbotResponse> {
  const siteUrl = await companyService.get('site_url') ?? 'https://online-florarte.vercel.app';
  return {
    messages: [
      {
        type: 'text',
        body: '💰 Cuéntame qué tipo de arreglo necesitas y con gusto te ayudo. También puedes explorar precios en nuestra tienda: 🌸',
      },
      {
        type: 'cta_url',
        body: 'Explora opciones y precios:',
        buttonText: '🛍️ Ver catálogo y precios',
        url: `${siteUrl}/catalog`,
      },
      {
        type: 'interactive_buttons',
        body: '¿O prefieres que te asesore?',
        buttons: [
          { id: 'HUMAN_SUPPORT', title: '👤 Hablar con asesor' },
          { id: 'ORDER_WA',      title: '📲 Pedir por WhatsApp' },
        ],
      },
    ],
  };
}

export function humanSupportFlow(): ChatbotResponse {
  return {
    messages: [
      {
        type: 'text',
        body: '👤 En un momento un asesor se comunicará contigo.\n\nMientras tanto puedes explorar nuestro catálogo 🌺',
      },
      {
        type: 'interactive_buttons',
        body: 'Mientras te atendemos:',
        buttons: [
          { id: 'CATALOG',  title: '🌺 Ver catálogo' },
          { id: 'FAREWELL', title: '✅ Finalizar chat' },
        ],
      },
    ],
  };
}

export function aiResponseFlow(aiText: string): ChatbotResponse {
  return {
    messages: [
      { type: 'text', body: aiText },
      {
        type: 'interactive_buttons',
        body: '¿En qué más puedo ayudarte?',
        buttons: [
          { id: 'CATALOG',       title: '🌺 Ver catálogo' },
          { id: 'QUOTE',         title: '💰 Cotizar' },
          { id: 'HUMAN_SUPPORT', title: '👤 Asesor' },
        ],
      },
    ],
  };
}

export function unknownFlow(): ChatbotResponse {
  return {
    messages: [
      { type: 'text', body: 'Lo siento, no entendí tu mensaje 😅\n\n¿En qué puedo ayudarte?' },
      {
        type: 'interactive_buttons',
        body: 'Elige una opción:',
        buttons: [
          { id: 'CATALOG',  title: '🌺 Ver catálogo' },
          { id: 'QUOTE',    title: '💰 Cotizar arreglo' },
          { id: 'LOCATION', title: '📍 Ubicación' },
        ],
      },
    ],
  };
}
