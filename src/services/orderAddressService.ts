import { AddressType } from '@prisma/client';

export interface OrderAddressSnapshotInput {
  sourceAddressId?: number | null;
  alias?: string | null;
  recipientName: string;
  recipientPhone?: string | null;
  streetName?: string | null;
  streetNumber?: string | null;
  interiorNumber?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  addressType?: AddressType | null;
  referenceNotes?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  googlePlaceId?: string | null;
  formattedAddress?: string | null;
  isGuestAddress: boolean;
}

function cleanText(value: unknown): string | null {
  const normalized = String(value ?? '').trim().replace(/\s+/g, ' ');
  return normalized || null;
}

function composeFormattedAddress(input: OrderAddressSnapshotInput): string {
  if (input.formattedAddress && input.formattedAddress.trim().length > 0) {
    return input.formattedAddress.trim();
  }

  const streetLine = [
    cleanText(input.streetName),
    cleanText(input.streetNumber),
    input.interiorNumber ? `Int. ${cleanText(input.interiorNumber)}` : null,
  ].filter(Boolean).join(' ');

  const addressSegments = [
    streetLine || null,
    cleanText(input.neighborhood),
    cleanText(input.city),
    cleanText(input.state),
    input.postalCode ? `CP ${cleanText(input.postalCode)}` : null,
    cleanText(input.country) || 'México',
  ].filter(Boolean);

  if (addressSegments.length === 0) {
    return 'Dirección por confirmar';
  }

  return addressSegments.join(', ');
}

export const orderAddressService = {
  normalizeSnapshot(input: OrderAddressSnapshotInput) {
    const recipientName = cleanText(input.recipientName) || 'Cliente';

    return {
      sourceAddressId: input.sourceAddressId ?? null,
      alias: cleanText(input.alias),
      recipientName,
      recipientPhone: cleanText(input.recipientPhone),
      streetName: cleanText(input.streetName),
      streetNumber: cleanText(input.streetNumber),
      interiorNumber: cleanText(input.interiorNumber),
      neighborhood: cleanText(input.neighborhood),
      city: cleanText(input.city),
      state: cleanText(input.state),
      country: cleanText(input.country) || 'México',
      postalCode: cleanText(input.postalCode),
      addressType: input.addressType ?? null,
      referenceNotes: cleanText(input.referenceNotes),
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      googlePlaceId: cleanText(input.googlePlaceId),
      formattedAddress: composeFormattedAddress(input),
      isGuestAddress: Boolean(input.isGuestAddress),
    };
  },
};
