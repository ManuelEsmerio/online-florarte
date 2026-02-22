// src/services/shippingZoneService.ts
import { shippingZoneRepository } from '../repositories/shippingZoneRepository';
import { mapDbShippingZoneToShippingZone } from '../mappers/shippingZoneMapper';
import type { ShippingZone, DbShippingZone } from '@/lib/definitions';
import { z } from 'zod';
// import { dbWithAudit } from '@/lib/db';

const shippingZoneSchema = z.object({
  postal_code: z.string().length(5, 'El código postal debe tener 5 dígitos.'),
  locality: z.string().min(3, 'La localidad es requerida.'),
  shipping_cost: z.number().int().min(0, 'El costo no puede ser negativo.'),
});

const dbWithAudit = async <T>(userId: number, fn: () => Promise<T>): Promise<T> => fn();

export const shippingZoneService = {
  async getAllShippingZones(): Promise<ShippingZone[]> {
    const dbZones = await shippingZoneRepository.findAll();
    return dbZones.map(mapDbShippingZoneToShippingZone);
  },

  async getZoneById(id: number): Promise<ShippingZone | null> {
    const dbZone = await shippingZoneRepository.findById(id);
    if (!dbZone) return null;
    return mapDbShippingZoneToShippingZone(dbZone);
  },

  async getZoneByPostalCode(postalCode: string): Promise<ShippingZone | null> {
    const dbZone = await shippingZoneRepository.findByPostalCode(postalCode);
    if (!dbZone) return null;
    return mapDbShippingZoneToShippingZone(dbZone);
  },
  
  async createShippingZone(data: any, creatorId: number): Promise<ShippingZone> {
    const validatedData = shippingZoneSchema.parse(data);
    
    const existing = await shippingZoneRepository.findByPostalCode(validatedData.postal_code);
    if (existing) {
        throw new Error('Ya existe una zona con este código postal.');
    }

    const newZone = await dbWithAudit(creatorId, () =>
      shippingZoneRepository.create(validatedData)
    );
    if (!newZone) throw new Error('Error al crear la zona de envío.');

    return mapDbShippingZoneToShippingZone(newZone);
  },

  async updateShippingZone(id: number, data: any, editorId: number): Promise<ShippingZone> {
    const validatedData = shippingZoneSchema.partial().parse(data);

    if (validatedData.postal_code) {
        const existing = await shippingZoneRepository.findByPostalCode(validatedData.postal_code);
        if (existing && existing.id !== id) {
            throw new Error('Ya existe otra zona con este código postal.');
        }
    }
    
    const updatedZone = await dbWithAudit(editorId, () =>
      shippingZoneRepository.update(id, validatedData)
    );
    if (!updatedZone) throw new Error('Zona no encontrada después de actualizar.');

    return mapDbShippingZoneToShippingZone(updatedZone);
  },

  async deleteShippingZone(id: number, deleterId: number): Promise<boolean> {
    return dbWithAudit(deleterId, () =>
      shippingZoneRepository.delete(id)
    );
  }
};
