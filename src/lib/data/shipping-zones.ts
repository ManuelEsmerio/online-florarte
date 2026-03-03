// src/lib/data/shipping-zones.ts

import type { ShippingZone } from '../definitions';

type SeedShippingZone = Omit<ShippingZone, 'createdAt' | 'updatedAt'>;

const baseMeta = {
  state: 'Jalisco',
  stateCode: '14',
  municipality: 'Tequila',
  municipalityCode: '084',
  settlementType: 'Colonia',
  postalOfficeCode: '47600',
  zone: 'urbana',
  isActive: true,
} as const;

export const allShippingZones: SeedShippingZone[] = [
  { id: 1, postalCode: '46400', locality: 'Tequila Centro', shippingCost: 80, ...baseMeta },
  { id: 2, postalCode: '46403', locality: 'Santo Toribio', shippingCost: 50, ...baseMeta },
  { id: 3, postalCode: '46404', locality: 'El Medineño', shippingCost: 60, ...baseMeta },
  { id: 4, postalCode: '46405', locality: 'Santa Teresa', shippingCost: 70, ...baseMeta },
  { id: 5, postalCode: '45350', locality: 'El Arenal', shippingCost: 100, ...baseMeta },
  { id: 6, postalCode: '45380', locality: 'Amatitán', shippingCost: 80, ...baseMeta },
  { id: 7, postalCode: '46770', locality: 'Magdalena', shippingCost: 120, ...baseMeta },
  { id: 8, postalCode: '46530', locality: 'Hostotipaquillo', shippingCost: 150, ...baseMeta },
];
