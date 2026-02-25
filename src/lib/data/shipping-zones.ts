// src/lib/data/shipping-zones.ts

import type { ShippingZone } from '../definitions';

export const allShippingZones: ShippingZone[] = [
  { id: 1, postalCode: '46400', locality: 'Tequila Centro', shippingCost: 80 },
  { id: 2, postalCode: '46403', locality: 'Santo Toribio', shippingCost: 50 },
  { id: 3, postalCode: '46404', locality: 'El Medineño', shippingCost: 60 },
  { id: 4, postalCode: '46405', locality: 'Santa Teresa', shippingCost: 70 },
  { id: 5, postalCode: '45350', locality: 'El Arenal', shippingCost: 100 },
  { id: 6, postalCode: '45380', locality: 'Amatitán', shippingCost: 80 },
  { id: 7, postalCode: '46770', locality: 'Magdalena', shippingCost: 120 },
  { id: 8, postalCode: '46530', locality: 'Hostotipaquillo', shippingCost: 150 },
];
