// src/repositories/announcementRepository.ts
import { announcementsData } from '@/lib/data/announcement-data';
import type { Announcement } from '@/lib/definitions';
import type { PoolConnection } from '@/lib/db';

export const announcementRepository = {
  async findAll(): Promise<Announcement[]> {
    return Promise.resolve(
        announcementsData
            .filter(a => !(a as any).is_deleted)
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    );
  },

  async findById(id: number): Promise<Announcement | null> {
    const ann = announcementsData.find(a => a.id === id && !(a as any).is_deleted);
    return Promise.resolve(ann || null);
  },

  async create(connection: PoolConnection, data: Omit<Announcement, 'id'>): Promise<number> {
    const newId = Math.max(...announcementsData.map(a => a.id), 0) + 1;
    announcementsData.push({ ...data, id: newId, created_at: new Date().toISOString() });
    return Promise.resolve(newId);
  },

  async update(connection: PoolConnection, id: number, data: Partial<Omit<Announcement, 'id'>>): Promise<boolean> {
    const index = announcementsData.findIndex(a => a.id === id);
    if (index === -1) return Promise.resolve(false);
    
    announcementsData[index] = { ...announcementsData[index], ...data };
    return Promise.resolve(true);
  },

  async delete(connection: PoolConnection, id: number): Promise<boolean> {
    const index = announcementsData.findIndex(a => a.id === id);
    if (index === -1) return Promise.resolve(false);
    
    (announcementsData[index] as any).is_deleted = true;
    (announcementsData[index] as any).deleted_at = new Date().toISOString();
    return Promise.resolve(true);
  },
};
