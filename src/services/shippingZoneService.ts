// src/services/shippingZoneService.ts
import { prisma } from '@/lib/prisma';
import type { ShippingZone } from '@/lib/definitions';
import { z } from 'zod';

const normalizeOptionalString = (max: number) =>
  z
    .preprocess((val) => {
      if (typeof val === 'string') {
        const trimmed = val.trim();
        return trimmed.length === 0 ? undefined : trimmed;
      }
      return val ?? undefined;
    }, z.string().max(max))
    .optional()
    .nullable();

const shippingZoneSchema = z.object({
  postalCode: z
    .string()
    .min(3, 'El código postal es requerido.')
    .max(10, 'El código postal no puede exceder 10 caracteres.'),
  locality: z.string().min(2, 'La localidad es requerida.').max(150),
  shippingCost: z.coerce.number().nonnegative('El costo no puede ser negativo.'),
  isActive: z.boolean().optional().default(true),
  settlementType: normalizeOptionalString(100),
  municipality: normalizeOptionalString(150),
  state: normalizeOptionalString(100),
  stateCode: normalizeOptionalString(5),
  municipalityCode: normalizeOptionalString(5),
  postalOfficeCode: normalizeOptionalString(10),
  zone: normalizeOptionalString(50),
});

const shippingZoneUpdateSchema = shippingZoneSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debes proporcionar al menos un campo para actualizar.',
  });

const bulkSchema = z.array(shippingZoneSchema);

const dbWithAudit = async <T>(userId: number, fn: () => Promise<T>): Promise<T> => fn();

function mapToShippingZone(zone: any): ShippingZone {
  return {
    id: zone.id,
    postalCode: zone.postalCode,
    locality: zone.locality,
    shippingCost: Number(zone.shippingCost),
    isActive: zone.isActive,
    settlementType: zone.settlementType,
    municipality: zone.municipality,
    state: zone.state,
    stateCode: zone.stateCode,
    municipalityCode: zone.municipalityCode,
    postalOfficeCode: zone.postalOfficeCode,
    zone: zone.zone,
    createdAt: zone.createdAt,
    updatedAt: zone.updatedAt,
  };
}

async function ensureUniqueCombination(postalCode?: string, locality?: string, excludeId?: number) {
  if (!postalCode || !locality) return;
  const existing = await prisma.shippingZone.findFirst({
    where: { postalCode, locality },
  });
  if (existing && existing.id !== excludeId) {
    throw new Error('Ya existe una zona con este código postal y localidad.');
  }
}

export const shippingZoneService = {
  async getAllShippingZones(): Promise<ShippingZone[]> {
    const zones = await prisma.shippingZone.findMany({
      orderBy: [{ postalCode: 'asc' }, { locality: 'asc' }],
    });
    return zones.map(mapToShippingZone);
  },

  async getZoneById(id: number): Promise<ShippingZone | null> {
    const zone = await prisma.shippingZone.findUnique({ where: { id } });
    return zone ? mapToShippingZone(zone) : null;
  },

  async getZoneByPostalCode(postalCode: string): Promise<ShippingZone | null> {
    const zone = await prisma.shippingZone.findFirst({ where: { postalCode } });
    return zone ? mapToShippingZone(zone) : null;
  },

  async createShippingZone(data: any, creatorId: number): Promise<ShippingZone> {
    const validatedData = shippingZoneSchema.parse(data);
    await ensureUniqueCombination(validatedData.postalCode, validatedData.locality);

    const newZone = await dbWithAudit(creatorId, () =>
      prisma.shippingZone.create({
        data: validatedData,
      })
    );

    return mapToShippingZone(newZone);
  },

  async updateShippingZone(id: number, data: any, editorId: number): Promise<ShippingZone> {
    const validatedData = shippingZoneUpdateSchema.parse(data);
    await ensureUniqueCombination(
      validatedData.postalCode,
      validatedData.locality,
      id
    );

    const updatedZone = await dbWithAudit(editorId, () =>
      prisma.shippingZone.update({
        where: { id },
        data: validatedData,
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

  async replaceAllShippingZones(data: any[], adminId: number) {
    const parsed = bulkSchema.parse(data);
    await dbWithAudit(adminId, () =>
      prisma.$transaction([
        prisma.shippingZone.deleteMany({}),
        prisma.shippingZone.createMany({ data: parsed }),
      ])
    );
    return { inserted: parsed.length };
  },
};
