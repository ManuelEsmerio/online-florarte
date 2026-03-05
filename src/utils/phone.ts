export const PHONE_CODES = ['+52', '+1'] as const;
export type PhoneCountryCode = (typeof PHONE_CODES)[number];

export const sanitizePhoneDigits = (value?: string | null) => {
  return String(value ?? '').replace(/\D/g, '').slice(0, 10);
};

export const parsePhoneValue = (
  value?: string | null,
  fallbackCode: PhoneCountryCode = '+52',
): { code: PhoneCountryCode; digits: string } => {
  const normalized = String(value ?? '').trim();
  if (!normalized) {
    return { code: fallbackCode, digits: '' };
  }

  if (normalized.startsWith('+52')) {
    return { code: '+52', digits: sanitizePhoneDigits(normalized.replace('+52', '')) };
  }

  if (normalized.startsWith('+1')) {
    return { code: '+1', digits: sanitizePhoneDigits(normalized.replace('+1', '')) };
  }

  const digits = normalized.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    return { code: '+1', digits: sanitizePhoneDigits(digits.slice(1)) };
  }

  return { code: fallbackCode, digits: sanitizePhoneDigits(digits) };
};

export const formatPhoneDigits = (digits?: string | null) => {
  const safeDigits = sanitizePhoneDigits(digits);
  if (!safeDigits) return '';
  const part1 = safeDigits.slice(0, 2);
  const part2 = safeDigits.slice(2, 6);
  const part3 = safeDigits.slice(6, 10);
  return [part1, part2, part3].filter(Boolean).join(' ');
};

export const formatPhoneDisplay = (code: string, digits?: string | null) => {
  const formattedDigits = formatPhoneDigits(digits);
  if (!formattedDigits) return '';
  return `${code} ${formattedDigits}`.trim();
};
