import type { DbShippingZone, ShippingZone } from '@/lib/definitions';

/**
 * Mapea una fila de la BD a un objeto ShippingZone limpio.
 */
export function mapDbShippingZoneToShippingZone(row: DbShippingZone): ShippingZone {
  return {
    id: row.id,
    postalCode: row.postal_code,
    locality: row.locality,
    shippingCost: Number(row.shipping_cost),
  };
}
