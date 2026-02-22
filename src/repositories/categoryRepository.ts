
// src/repositories/categoryRepository.ts
import { productCategories } from '@/lib/data/categories-data';
import type { ProductCategory as DbCategory } from '@/lib/definitions';
import type { PoolConnection } from 'mysql2/promise';

// Usamos el estado global para persistencia en desarrollo si es necesario
const globalForCats = global as unknown as { categories: DbCategory[] };
let categoriesList = globalForCats.categories || [...productCategories];

if (process.env.NODE_ENV !== 'production') {
  globalForCats.categories = categoriesList;
}

export const categoryRepository = {
  async findAll(): Promise<DbCategory[]> {
    return Promise.resolve(categoriesList.filter(c => !(c as any).is_deleted));
  },

  async findById(id: number): Promise<DbCategory | null> {
    const category = categoriesList.find(c => c.id === id && !(c as any).is_deleted);
    return Promise.resolve(category || null);
  },
  
  async findBySlug(slug: string): Promise<DbCategory | null> {
    const category = categoriesList.find(c => c.slug === slug && !(c as any).is_deleted);
    return Promise.resolve(category || null);
  },

  async findByName(name: string): Promise<DbCategory | null> {
    const category = categoriesList.find(c => c.name.toLowerCase() === name.toLowerCase() && !(c as any).is_deleted);
    return Promise.resolve(category || null);
  },

  async create(connection: PoolConnection, data: any): Promise<number> {
    const newId = Math.max(...categoriesList.map(c => c.id), 0) + 1;
    const newCategory: DbCategory = { ...data, id: newId };
    categoriesList.push(newCategory);
    return Promise.resolve(newId);
  },

  async update(connection: PoolConnection, id: number, data: any): Promise<boolean> {
    const index = categoriesList.findIndex(c => c.id === id);
    if (index === -1) return Promise.resolve(false);
    categoriesList[index] = { ...categoriesList[index], ...data };
    return Promise.resolve(true);
  },
  
  async delete(connection: PoolConnection, id: number): Promise<boolean> {
    const index = categoriesList.findIndex(c => c.id === id);
    if (index === -1) return Promise.resolve(false);
    (categoriesList[index] as any).is_deleted = true;
    (categoriesList[index] as any).deleted_at = new Date().toISOString();
    return Promise.resolve(true);
  },

  async hasProducts(id: number): Promise<boolean> {
    // Referenciaría a productRepository en un caso real
    return Promise.resolve(false);
  },

  async hasSubcategories(id: number): Promise<boolean> {
    const sub = categoriesList.find(c => c.parent_id === id && !(c as any).is_deleted);
    return Promise.resolve(!!sub);
  },
};
