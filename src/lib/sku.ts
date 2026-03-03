type VariantSpecification = { key?: string | null; value?: string | null };

type VariantCodeInput = {
  name?: string | null;
  specifications?: VariantSpecification[] | null;
  existingCodes?: Iterable<string>;
};

const COLOR_KEYWORDS = [
  'rojo', 'roja', 'blanco', 'blanca', 'rosa', 'rosa pastel', 'azul', 'verde', 'amarillo', 'amarilla',
  'morado', 'morada', 'lila', 'naranja', 'negro', 'negra', 'dorado', 'dorada', 'plateado', 'plateada',
  'fucsia', 'vino', 'beige', 'crema', 'coral', 'turquesa', 'cafe', 'café',
] as const;

const normalizeText = (value: unknown): string => {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
};

const toPrefix = (value: unknown, fallback = 'GEN'): string => {
  const normalized = normalizeText(value).replace(/[^A-Z]/g, '');
  if (!normalized) return fallback;
  if (normalized.length >= 3) return normalized.slice(0, 3);
  return normalized.padEnd(3, 'X');
};

const getSequentialSuffix = (productCode: string, existingCodes: Set<string>): string => {
  const pattern = new RegExp(`^${productCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-([0-9]{4})$`);
  let max = 0;

  for (const code of existingCodes) {
    const match = pattern.exec(code);
    if (!match) continue;
    const value = Number(match[1]);
    if (Number.isFinite(value) && value > max) {
      max = value;
    }
  }

  let next = max + 1;
  while (existingCodes.has(`${productCode}-${String(next).padStart(4, '0')}`)) {
    next += 1;
  }

  return String(next).padStart(4, '0');
};

const findQuantitySuffix = (input: VariantCodeInput): string | null => {
  const parts: string[] = [];
  if (input.name) parts.push(String(input.name));
  if (Array.isArray(input.specifications)) {
    for (const spec of input.specifications) {
      if (spec?.key) parts.push(String(spec.key));
      if (spec?.value) parts.push(String(spec.value));
    }
  }

  const haystack = parts.join(' ');
  const match = haystack.match(/\d+/);
  if (!match) return null;
  const quantity = Number(match[0]);
  if (!Number.isFinite(quantity) || quantity <= 0) return null;
  return String(quantity);
};

const findColorSuffix = (input: VariantCodeInput): string | null => {
  const parts: string[] = [];
  if (input.name) parts.push(String(input.name));
  if (Array.isArray(input.specifications)) {
    for (const spec of input.specifications) {
      if (spec?.key) parts.push(String(spec.key));
      if (spec?.value) parts.push(String(spec.value));
    }
  }

  const haystack = normalizeText(parts.join(' '));
  if (!haystack) return null;

  const detected = COLOR_KEYWORDS.find((keyword) => {
    const token = normalizeText(keyword);
    return token.length > 0 && haystack.includes(token);
  });

  if (!detected) return null;
  return toPrefix(detected);
};

export function generateProductCode(category: string | null | undefined, productId: number): string {
  const prefix = toPrefix(category, 'GEN');
  const numericId = Number.isFinite(productId) && productId > 0 ? Math.trunc(productId) : 0;
  return `${prefix}-${String(numericId).padStart(4, '0')}`;
}

export function generateVariantCode(productCode: string, variantData: VariantCodeInput): string {
  const existingCodes = new Set<string>(Array.from(variantData.existingCodes ?? []));

  const quantitySuffix = findQuantitySuffix(variantData);
  if (quantitySuffix) {
    const candidate = `${productCode}-${quantitySuffix}`;
    if (!existingCodes.has(candidate)) return candidate;
  }

  const colorSuffix = findColorSuffix(variantData);
  if (colorSuffix) {
    const candidate = `${productCode}-${colorSuffix}`;
    if (!existingCodes.has(candidate)) return candidate;
  }

  const sequence = getSequentialSuffix(productCode, existingCodes);
  return `${productCode}-${sequence}`;
}
