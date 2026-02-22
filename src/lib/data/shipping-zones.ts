// src/lib/data/shipping-zones.ts

import type { ShippingZone } from '../definitions';

export const allShippingZones: ShippingZone[] = [
  { id: 1, postal_code: '46400', locality: 'Tequila Centro', shipping_cost: 80 },
  { id: 2, postal_code: '46403', locality: 'Santo Toribio', shipping_cost: 50 },
  { id: 3, postal_code: '46404', locality: 'El Medineño', shipping_cost: 60 },
  { id: 4, postal_code: '46405', locality: 'Santa Teresa', shipping_cost: 70 },
  { id: 5, postal_code: '45350', locality: 'El Arenal', shipping_cost: 100 },
  { id: 6, postal_code: '45380', locality: 'Amatitán', shipping_cost: 80 },
  { id: 7, postal_code: '46770', locality: 'Magdalena', shipping_cost: 120 },
  { id: 8, postal_code: '46530', locality: 'Hostotipaquillo', shipping_cost: 150 },
];
