// src/repositories/shippingZoneRepository.ts
import { allShippingZones } from '@/lib/data/shipping-zones';
import type { DbShippingZone } from '@/lib/definitions';
import type { PoolConnection } from '@/lib/db';

export const shippingZoneRepository = {
  /**
   * Obtiene todas las zonas de envío de la base de datos,
   * ordenadas por código postal.
   * @returns Una promesa que resuelve a un array de DbShippingZone.
   */
  async findAll(): Promise<DbShippingZone[]> {
    const zones = [...allShippingZones].sort((a, b) => a.postal_code.localeCompare(b.postal_code));
    return Promise.resolve(zones as unknown as DbShippingZone[]);
  },

  /**
   * Busca una zona de envío específica por su código postal.
   */
  async findByPostalCode(postalCode: string): Promise<DbShippingZone | null> {
    const zone = allShippingZones.find(z => z.postal_code === postalCode);
    return Promise.resolve((zone as unknown as DbShippingZone) || null);
  },

  /**
   * Busca una zona de envío específica por su ID.
   */
  async findById(id: number): Promise<DbShippingZone | null> {
    const zone = allShippingZones.find(z => z.id === id);
    return Promise.resolve((zone as unknown as DbShippingZone) || null);
  },
  
  /**
   * Crea una nueva zona de envío.
   */
  async create(connection: PoolConnection, data: Omit<DbShippingZone, 'id'>): Promise<number> {
    const newId = Math.max(...allShippingZones.map(z => z.id), 0) + 1;
    const newZone = { ...data, id: newId };
    allShippingZones.push(newZone);
    return Promise.resolve(newId);
  },

  /**
   * Actualiza una zona de envío existente.
   */
  async update(connection: PoolConnection, id: number, data: Partial<Omit<DbShippingZone, 'id'>>): Promise<boolean> {
    const index = allShippingZones.findIndex(z => z.id === id);
    if (index === -1) return Promise.resolve(false);
    
    allShippingZones[index] = { ...allShippingZones[index], ...data } as any;
    return Promise.resolve(true);
  },

  /**
   * Elimina una zona de envío.
   */
  async delete(connection: PoolConnection, id: number): Promise<boolean> {
    const index = allShippingZones.findIndex(z => z.id === id);
    if (index === -1) return Promise.resolve(false);
    
    allShippingZones.splice(index, 1);
    return Promise.resolve(true);
  }
};
