
// src/repositories/productRepository.ts
import type { Product, ProductStatus } from '@/lib/definitions';
import { allProducts } from '@/lib/data/product-data';
import { productCategories } from '@/lib/data/categories-data';

/**
 * Repositorio de Productos (Modo Mock)
 * Gestiona el acceso a los datos de prueba definidos en src/lib/data/product-data.ts.
 */
export const productRepository = {
  async findAllForAdmin(): Promise<Product[]> {
    return Promise.resolve([...allProducts]);
  },

  async findAllPublished(limit?: number, offset?: number): Promise<Product[]> {
    const published = allProducts.filter(p => p.status === 'publicado' && !p.is_deleted);
    if (limit !== undefined && offset !== undefined) {
      return Promise.resolve(published.slice(offset, offset + limit));
    }
    return Promise.resolve(published);
  },

  async countAllPublished(): Promise<number> {
    return Promise.resolve(allProducts.filter(p => p.status === 'publicado' && !p.is_deleted).length);
  },
  
  async findRecommended(limit: number = 8, excludeSlug?: string): Promise<Product[]> {
    const recommended = allProducts
      .filter(p => p.status === 'publicado' && !p.is_deleted && p.slug !== excludeSlug)
      .sort((a, b) => {
          const aIsBest = a.tags?.some(t => t.id === 1) ? 1 : 0;
          const bIsBest = b.tags?.some(t => t.id === 1) ? 1 : 0;
          return bIsBest - aIsBest;
      });
    return Promise.resolve(recommended.slice(0, limit));
  },

  async findRelated(categoryId: number, excludeProductId: number, limit: number = 6): Promise<Product[]> {
    return Promise.resolve(allProducts
      .filter(p => p.category.id === categoryId && p.id !== excludeProductId && p.status === 'publicado' && !p.is_deleted)
      .slice(0, limit));
  },

  async findById(id: number): Promise<Product | null> {
    const product = allProducts.find(p => p.id === id && !p.is_deleted);
    return Promise.resolve(product || null);
  },

  async findBySlug(slug: string): Promise<Product | null> {
    const product = allProducts.find(p => p.slug === slug && !p.is_deleted);
    return Promise.resolve(product || null);
  },
  
  async findByCategorySlug(categorySlug: string): Promise<Product[]> {
    const category = productCategories.find(c => c.slug === categorySlug);
    if (!category) return Promise.resolve([]);

    const subcategoryIds = productCategories
        .filter(c => c.parent_id === category.id)
        .map(c => c.id);
    
    const targetCategoryIds = [category.id, ...subcategoryIds];

    const results = allProducts.filter(p => 
        targetCategoryIds.includes(p.category.id) && 
        p.status === 'publicado' &&
        !p.is_deleted
    );
    return Promise.resolve(results);
  },

  async findByCategoryId(categoryId: number): Promise<Product[]> {
    const results = allProducts.filter(p => 
        p.category.id === categoryId && 
        p.status === 'publicado' &&
        !p.is_deleted
    );
    return Promise.resolve(results);
  },
  
  async findComplements(): Promise<Product[]> {
    return Promise.resolve(allProducts.filter(p => 
        (p.category.id === 5 || p.category.parent_id === 5 || (p.category.id >= 11 && p.category.id <= 15)) &&
        p.status === 'publicado' &&
        !p.is_deleted
    ));
  },
  
  async findProductsByIds(productIds: number[]): Promise<Product[]> {
    return Promise.resolve(allProducts.filter(p => productIds.includes(p.id) && !p.is_deleted));
  },
  
  async saveFull(productData: any): Promise<any> {
    const isEditing = !!productData.id;
    if (isEditing) {
      const index = allProducts.findIndex(p => p.id === productData.id);
      if (index > -1) {
        allProducts[index] = { ...allProducts[index], ...productData, updated_at: new Date().toISOString() };
        return Promise.resolve({ id: productData.id, result: '1' });
      }
    }
    const newId = Math.max(...allProducts.map(p => p.id), 0) + 1;
    const newProduct = { ...productData, id: newId, created_at: new Date().toISOString() };
    allProducts.push(newProduct);
    return Promise.resolve({ id: newId, result: '1' });
  },

  async updateStatus(slug: string, status: ProductStatus): Promise<boolean> {
    const product = allProducts.find(p => p.slug === slug);
    if (product) {
      product.status = status;
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  },

  async softDelete(productId: number): Promise<boolean> {
    const product = allProducts.find(p => p.id === productId);
    if (product) {
      product.is_deleted = true;
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }
};
