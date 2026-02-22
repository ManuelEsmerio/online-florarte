// src/repositories/tagRepository.ts
import { allTags } from '@/lib/data/tag-data';
import type { Tag } from '@/lib/definitions';
import type { PoolConnection } from 'mysql2/promise';

// Repositorio Mock para gestionar etiquetas en memoria
export const tagRepository = {
  async findAll(): Promise<Tag[]> {
    return Promise.resolve([...allTags]);
  },

  async findById(id: number): Promise<Tag | null> {
    const tag = allTags.find(t => t.id === id);
    return Promise.resolve(tag || null);
  },

  async findByName(name: string): Promise<Tag | null> {
    const tag = allTags.find(t => t.name.toLowerCase() === name.toLowerCase());
    return Promise.resolve(tag || null);
  },

  async create(connection: PoolConnection, data: Omit<Tag, 'id'>): Promise<number> {
    const newId = Math.max(...allTags.map(t => t.id)) + 1;
    const newTag: Tag = { id: newId, ...data };
    allTags.push(newTag);
    return Promise.resolve(newId);
  },

  async update(connection: PoolConnection, id: number, data: Partial<Omit<Tag, 'id'>>): Promise<boolean> {
    const index = allTags.findIndex(t => t.id === id);
    if (index === -1) return Promise.resolve(false);
    allTags[index] = { ...allTags[index], ...data };
    return Promise.resolve(true);
  },

  async delete(connection: PoolConnection, id: number): Promise<boolean> {
    const index = allTags.findIndex(t => t.id === id);
    if (index === -1) return Promise.resolve(false);
    allTags.splice(index, 1);
    return Promise.resolve(true);
  },
  
  async hasProducts(id: number): Promise<boolean> {
    // Simplified mock
    return Promise.resolve(false);
  }
};
