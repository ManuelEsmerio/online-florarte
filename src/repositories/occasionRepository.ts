// src/repositories/occasionRepository.ts
import { allOccasions } from '@/lib/data/occasion-data';
import type { Occasion } from '@/lib/definitions';
import slugify from 'slugify';
import type { PoolConnection } from 'mysql2/promise';

// Repositorio Mock para gestionar ocasiones en memoria
export const occasionRepository = {
  async findAll(): Promise<Occasion[]> {
    return Promise.resolve([...allOccasions]);
  },

  async findById(id: number): Promise<Occasion | null> {
    const occasion = allOccasions.find(o => o.id === id);
    return Promise.resolve(occasion || null);
  },

  async findBySlug(slug: string): Promise<Occasion | null> {
    const occasion = allOccasions.find(o => o.slug === slug);
    return Promise.resolve(occasion || null);
  },

  async create(connection: PoolConnection, data: any): Promise<number> {
    const newId = Math.max(...allOccasions.map(o => o.id)) + 1;
    const slug = slugify(data.name, { lower: true, strict: true });
    
    const newOccasion: Occasion = {
      id: newId,
      name: data.name,
      slug: slug,
      description: data.description,
      image_url: data.image_url,
      show_on_home: data.show_on_home,
    };
    
    allOccasions.push(newOccasion);
    return Promise.resolve(newId);
  },

  async update(connection: PoolConnection, id: number, data: any): Promise<boolean> {
    const index = allOccasions.findIndex(o => o.id === id);
    if (index === -1) return Promise.resolve(false);

    const slug = slugify(data.name, { lower: true, strict: true });

    allOccasions[index] = {
      ...allOccasions[index],
      ...data,
      slug: slug,
    };
    
    return Promise.resolve(true);
  },

  async delete(connection: PoolConnection, id: number): Promise<boolean> {
    const index = allOccasions.findIndex(o => o.id === id);
    if (index === -1) return Promise.resolve(false);
    
    // In a real app, this would be a soft delete
    allOccasions.splice(index, 1);
    
    return Promise.resolve(true);
  },
  
  async hasProducts(id: number): Promise<boolean> {
    // This is a simplified mock. A real implementation would check the product_occasions join table.
    return Promise.resolve(false);
  },
};
