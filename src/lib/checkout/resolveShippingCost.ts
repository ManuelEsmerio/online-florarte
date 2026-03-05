// src/lib/checkout/resolveShippingCost.ts
// Calculates shipping cost server-side from the DB, never trusting client input.
import { prisma } from '@/lib/prisma';

/**
 * Resolves the shipping cost from the database.
 * Priority: addressId (look up saved address) > guestPostalCode.
 * Returns 0 if no matching shipping zone is found.
 */
export async function resolveShippingCost(
  addressId?: number | null,
  guestPostalCode?: string | null,
): Promise<number> {
  let postalCode: string | null | undefined = guestPostalCode?.trim() || null;

  // If a saved address is provided, use its postal code (overrides guest value)
  if (addressId) {
    const address = await prisma.address.findUnique({
      where: { id: addressId },
      select: { postalCode: true },
    });
    if (address?.postalCode) {
      postalCode = address.postalCode;
    }
  }

  if (!postalCode) return 0;

  const zone = await prisma.shippingZone.findFirst({
    where: { postalCode, isActive: true },
    select: { shippingCost: true },
  });

  return zone ? Number(zone.shippingCost) : 0;
}
