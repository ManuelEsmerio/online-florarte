// src/services/shippingZoneService.ts
import { prisma } from '@/lib/prisma';
import type { ShippingZone } from '@/lib/definitions';
import { z } from 'zod';

const shippingZoneSchema = z.object({
  postal_code: z.string().length(5, 'El código postal debe tener 5 dígitos.'),
  locality: z.string().min(3, 'La localidad es requerida.'),
  shipping_cost: z.number().int().min(0, 'El costo no puede ser negativo.'),
});

const dbWithAudit = async <T>(userId: number, fn: () => Promise<T>): Promise<T> => fn();

function mapToShippingZone(zone: {
  id: number;
  postalCode: string;
  locality: string;
  shippingCost: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): ShippingZone {
  return {
    id: zone.id,
    postalCode: zone.postalCode,
    locality: zone.locality,
    shippingCost: Number(zone.shippingCost),
    isActive: zone.isActive,
    createdAt: zone.createdAt,
    updatedAt: zone.updatedAt,
  };
}

export const shippingZoneService = {
  async getAllShippingZones(): Promise<ShippingZone[]> {
    const zones = await prisma.shippingZone.findMany({
      where: { isActive: true },
      orderBy: { postalCode: 'asc' },
    });
    return zones.map(mapToShippingZone);
  },

  async getZoneById(id: number): Promise<ShippingZone | null> {
    const zone = await prisma.shippingZone.findUnique({ where: { id } });
    return zone ? mapToShippingZone(zone) : null;
  },

  async getZoneByPostalCode(postalCode: string): Promise<ShippingZone | null> {
    const zone = await prisma.shippingZone.findUnique({ where: { postalCode } });
    return zone ? mapToShippingZone(zone) : null;
  },

  async createShippingZone(data: any, creatorId: number): Promise<ShippingZone> {
    const validatedData = shippingZoneSchema.parse(data);

    const existing = await prisma.shippingZone.findUnique({
      where: { postalCode: validatedData.postal_code },
    });
    if (existing) {
      throw new Error('Ya existe una zona con este código postal.');
    }

    const newZone = await dbWithAudit(creatorId, () =>
      prisma.shippingZone.create({
        data: {
          postalCode: validatedData.postal_code,
          locality: validatedData.locality,
          shippingCost: validatedData.shipping_cost,
          isActive: true,
        },
      })
    );

    return mapToShippingZone(newZone);
  },

  async updateShippingZone(id: number, data: any, editorId: number): Promise<ShippingZone> {
    const validatedData = shippingZoneSchema.partial().parse(data);

    if (validatedData.postal_code) {
      const existing = await prisma.shippingZone.findUnique({
        where: { postalCode: validatedData.postal_code },
      });
      if (existing && existing.id !== id) {
        throw new Error('Ya existe otra zona con este código postal.');
      }
    }

    const updatedZone = await dbWithAudit(editorId, () =>
      prisma.shippingZone.update({
        where: { id },
        data: {
          postalCode: validatedData.postal_code,
          locality: validatedData.locality,
          shippingCost: validatedData.shipping_cost,
        },
      })
    );

    return mapToShippingZone(updatedZone);
  },

  async deleteShippingZone(id: number, deleterId: number): Promise<boolean> {
    return dbWithAudit(deleterId, async () => {
      try {
        await prisma.shippingZone.delete({ where: { id } });
        return true;
      } catch {
        return false;
      }
    });
  },
};
