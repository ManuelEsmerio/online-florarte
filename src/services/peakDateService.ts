// src/services/peakDateService.ts
import { prisma } from '@/lib/prisma';
import { UserFacingError } from '@/utils/errors';
import type { PeakDate } from '@/lib/definitions';
import { z } from 'zod';
import { addYears, format, isValid, parseISO } from 'date-fns';
import { parseToUTCDate } from '@/lib/utils';

const peakDateSchema = z.object({
  name: z.string().min(3, 'El nombre del evento es requerido.'),
  peak_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "El formato de fecha debe ser YYYY-MM-DD."),
  is_coupon_restricted: z.boolean(),
  repeat_annually: z.boolean().optional(),
});

const dbWithAudit = async <T>(userId: number, fn: () => Promise<T>): Promise<T> => fn();

function mapToPeakDate(row: { id: number; name: string; peakDate: Date; isCouponRestricted: boolean; createdAt?: Date; updatedAt?: Date }): PeakDate {
  return {
    id: row.id,
    name: row.name,
    peakDate: row.peakDate,
    isCouponRestricted: row.isCouponRestricted,
    createdAt: row.createdAt || new Date(),
    updatedAt: row.updatedAt || new Date(),
  };
}

export const peakDateService = {
  async getAllPeakDates(): Promise<PeakDate[]> {
    const rows = await prisma.peakDate.findMany({ orderBy: { peakDate: 'desc' } });
    return rows.map(mapToPeakDate);
  },

  async isPeakDay(date: string): Promise<boolean> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
    const targetDate = parseISO(date);
    if (!isValid(targetDate)) return false;

    const start = new Date(date + 'T00:00:00.000Z');
    const end = new Date(date + 'T23:59:59.999Z');

    const count = await prisma.peakDate.count({
      where: { peakDate: { gte: start, lte: end } },
    });
    return count > 0;
  },

  async createPeakDate(data: any, creatorId: number): Promise<PeakDate> {
    const validatedData = peakDateSchema.parse(data);

    if (validatedData.repeat_annually) {
      const baseDate = parseToUTCDate(validatedData.peak_date);
      if (!baseDate) throw new UserFacingError("Fecha base inválida para repetición.");

      for (let i = 0; i < 5; i++) {
        const nextDate = addYears(baseDate, i);
        await dbWithAudit(creatorId, () =>
          prisma.peakDate.create({
            data: {
              name: validatedData.name,
              peakDate: nextDate,
              isCouponRestricted: validatedData.is_coupon_restricted,
            },
          })
        );
      }
    } else {
      await dbWithAudit(creatorId, () =>
        prisma.peakDate.create({
          data: {
            name: validatedData.name,
            peakDate: new Date(validatedData.peak_date),
            isCouponRestricted: validatedData.is_coupon_restricted,
          },
        })
      );
    }

    const allDates = await this.getAllPeakDates();
    const newPeakDate = allDates.find(
      p => p.name === validatedData.name && p.peakDate.toISOString().slice(0, 10) === validatedData.peak_date
    );
    if (!newPeakDate) throw new UserFacingError('No se pudo crear el registro.');
    return newPeakDate;
  },

  async updatePeakDate(id: number, data: any, editorId: number): Promise<PeakDate> {
    const validatedData = peakDateSchema.partial().parse(data);

    const exists = await prisma.peakDate.findUnique({ where: { id } });
    if (!exists) throw new UserFacingError('Fecha pico no encontrada');

    const updated = await dbWithAudit(editorId, () =>
      prisma.peakDate.update({
        where: { id },
        data: {
          ...(validatedData.name !== undefined && { name: validatedData.name }),
          ...(validatedData.peak_date !== undefined && { peakDate: new Date(validatedData.peak_date) }),
          ...(validatedData.is_coupon_restricted !== undefined && { isCouponRestricted: validatedData.is_coupon_restricted }),
        },
      })
    );

    return mapToPeakDate(updated);
  },

  async deletePeakDate(id: number, deleterId: number): Promise<void> {
    await dbWithAudit(deleterId, () =>
      prisma.peakDate.delete({ where: { id } })
    );
  },
};
