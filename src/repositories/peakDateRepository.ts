// src/repositories/peakDateRepository.ts
import { peakDatesData as peakDates } from '@/lib/data/peak-date-data';
import type { DbPeakDate } from '@/lib/definitions';
import type { PoolConnection } from '@/lib/db';

export const peakDateRepository = {
  /**
   * Obtiene todas las fechas pico de la base de datos.
   */
  async findAll(): Promise<DbPeakDate[]> {
    return Promise.resolve(peakDates.filter(d => !(d as any).is_deleted).sort((a, b) => new Date(b.peak_date).getTime() - new Date(a.peak_date).getTime()));
  },

  async findById(id: number): Promise<DbPeakDate | null> {
    const d = peakDates.find(d => d.id === id);
    return Promise.resolve(d || null);
  },
  
  async findByDate(date: string): Promise<DbPeakDate[]> {
    const d = peakDates.filter(d => d.peak_date.toISOString().split('T')[0] === date && !(d as any).is_deleted);
    return Promise.resolve(d);
  },

  async findByName(name: string): Promise<DbPeakDate[]> {
    const d = peakDates.filter(d => d.name === name && !(d as any).is_deleted);
    return Promise.resolve(d);
  },
  
  async create(connection: PoolConnection, data: Omit<DbPeakDate, 'id'>): Promise<number> {
    const newId = Math.max(...peakDates.map(d => d.id), 0) + 1;
    peakDates.push({ ...data, id: newId });
    return Promise.resolve(newId);
  },
  
  async update(connection: PoolConnection, id: number, data: Partial<Omit<DbPeakDate, 'id'>>): Promise<boolean> {
    const index = peakDates.findIndex(d => d.id === id);
    if (index === -1) return Promise.resolve(false);
    
    peakDates[index] = { ...peakDates[index], ...data } as any;
    return Promise.resolve(true);
  },


  async createOrUpdateByNameAndYear(connection: PoolConnection, data: Omit<DbPeakDate, 'id'>): Promise<void> {
    const year = new Date(data.peak_date).getFullYear();
    const existingIndex = peakDates.findIndex(d => d.name === data.name && d.peak_date.getFullYear() === year);

    if (existingIndex !== -1) {
        peakDates[existingIndex] = { ...peakDates[existingIndex], ...data, id: peakDates[existingIndex].id };
    } else {
        const newId = Math.max(...peakDates.map(d => d.id), 0) + 1;
        peakDates.push({ ...data, id: newId });
    }
  },
  
  async delete(connection: PoolConnection, id: number): Promise<boolean> {
    const index = peakDates.findIndex(d => d.id === id);
    if (index === -1) return Promise.resolve(false);
    (peakDates[index] as any).is_deleted = true;
    (peakDates[index] as any).deleted_at = new Date().toISOString();
    return Promise.resolve(true);
  },
};

    
