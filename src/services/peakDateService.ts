// src/services/peakDateService.ts
import { peakDateRepository } from '../repositories/peakDateRepository';
import type { PeakDate } from '@/lib/definitions';
import { z } from 'zod';
// import { dbWithAudit } from '@/lib/db';
import { addYears, getYear, format, isValid, parseISO } from 'date-fns';
import { parseToUTCDate } from '@/lib/utils';


const peakDateSchema = z.object({
  name: z.string().min(3, 'El nombre del evento es requerido.'),
  peak_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "El formato de fecha debe ser YYYY-MM-DD."),
  is_coupon_restricted: z.boolean(),
  repeat_annually: z.boolean().optional(),
});

const dbWithAudit = async <T>(userId: number, fn: () => Promise<T>): Promise<T> => fn();

export const peakDateService = {
  async getAllPeakDates(): Promise<PeakDate[]> {
    const dbDates = await peakDateRepository.findAll();
    return dbDates.map(d => ({
        ...d,
        peak_date: parseToUTCDate(d.peak_date) || new Date(),
        is_coupon_restricted: Boolean(d.is_coupon_restricted)
    }));
  },

  async isPeakDay(date: string): Promise<boolean> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return false;
    }
    const targetDate = parseISO(date);
    if(!isValid(targetDate)) return false;

    const dbDates = await peakDateRepository.findByDate(date);
    return dbDates.length > 0;
  },
  
  async createPeakDate(data: any, creatorId: number): Promise<PeakDate> {
    const validatedData = peakDateSchema.parse(data);
    
    if (validatedData.repeat_annually) {
        const baseDate = parseToUTCDate(validatedData.peak_date);
        if (!baseDate) throw new Error("Fecha base inválida para repetición.");

        for (let i = 0; i < 5; i++) {
            const nextDate = addYears(baseDate, i);
            await dbWithAudit(creatorId, () =>
              peakDateRepository.create({
                ...validatedData,
                peak_date: format(nextDate, 'yyyy-MM-dd'),
              })
            );
        }
        
    } else {
        await dbWithAudit(creatorId, () =>
          peakDateRepository.create(validatedData)
        );
    }
    
    const newPeakDates = await this.getAllPeakDates();
    const newPeakDate = newPeakDates.find(p => p.name === validatedData.name && format(p.peak_date, 'yyyy-MM-dd') === validatedData.peak_date);

    if(!newPeakDate) throw new Error('No se pudo crear el registro.');

    return newPeakDate;
  },
  
  async updatePeakDate(id: number, data: any, editorId: number): Promise<PeakDate> {
    const validatedData = peakDateSchema.partial().parse(data);
    const originalPeakDate = await peakDateRepository.findById(id);
    if (!originalPeakDate) throw new Error('Fecha pico no encontrada');
    
    const updatedPeakDateRaw = await dbWithAudit(editorId, () =>
      peakDateRepository.update(id, validatedData)
    );
    
    if(!updatedPeakDateRaw) throw new Error('No se pudo actualizar el registro.');

    return {
        ...updatedPeakDateRaw, 
        peak_date: parseToUTCDate(updatedPeakDateRaw.peak_date) || new Date(),
        is_coupon_restricted: Boolean(updatedPeakDateRaw.is_coupon_restricted)
    };
  },
  
  async deletePeakDate(id: number, deleterId: number): Promise<void> {
    await dbWithAudit(deleterId, () =>
      peakDateRepository.delete(id)
    );
  }
};
