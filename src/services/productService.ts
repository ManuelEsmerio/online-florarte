
// src/services/productService.ts
import { productRepository } from '../repositories/productRepository';
import { categoryRepository } from '../repositories/categoryRepository';
import { occasionRepository } from '../repositories/occasionRepository';
import { tagRepository } from '../repositories/tagRepository';
import type { Product, ProductCategory, Occasion, ProductStatus, Tag } from '@/lib/definitions';
import { getPublicUrlForPath } from '@/utils/file-utils';

// Mock de dbWithAudit, ya que no hay transacciones reales
const dbWithAudit = async <T>(userId: number, fn: () => Promise<T>): Promise<T> => fn();

// Helper para enriquecer productos con sus relaciones
async function enrichProducts(dbProducts: Product[]): Promise<Product[]> {
    return dbProducts.map(p => ({
        ...p,
        image: getPublicUrlForPath(p.image),
        images: p.images?.map(img => ({...img, src: getPublicUrlForPath(img.src)})),
        variants: p.variants?.map(v => ({
            ...v,
            images: v.images?.map(img => ({...img, src: getPublicUrlForPath(img.src)}))
        }))
    }));
}

export const productService = {
  async getAdminProductList() {
    const [
      dbProducts, 
      dbCategories, 
      dbOccasions, 
      dbTags
    ] = await Promise.all([
      productRepository.findAllForAdmin(),
      categoryRepository.findAll(),
      occasionRepository.findAll(),
      tagRepository.findAll(),
    ]);

    const products = await enrichProducts(dbProducts);

    return { products, categories: dbCategories, occasions: dbOccasions, tags: dbTags };
  },

  async createProduct(productData: any, imageFiles: { main: File[], variants: { index: number, files: File[] }[] }, creatorId: number): Promise<any> {
    const enrichedData = {
        ...productData,
        images: imageFiles.main.map(file => ({
            src: URL.createObjectURL(file), alt: file.name, is_primary: true
        })),
        variants: productData.variants.map((v: any, index: number) => ({
            ...v,
            images: (imageFiles.variants.find(vf => vf.index === index)?.files || []).map(file => ({
                src: URL.createObjectURL(file), alt: file.name, is_primary: true
            }))
        }))
    }
    return dbWithAudit(creatorId, async () => {
      return productRepository.saveFull(enrichedData);
    });
  },

  async updateProduct(slug: string, productData: any, imageFiles: { main: File[], variants: { index: number, files: File[] }[] }, editorId: number): Promise<any> {
    const originalProduct = await this.getCompleteProductDetailsBySlug(slug);
    if (!originalProduct) throw new Error('Producto original no encontrado');

    return dbWithAudit(editorId, async () => {
        return productRepository.saveFull({ ...productData, id: originalProduct.id });
    });
  },
  
  async getRecommendedProducts(limit: number = 8, excludeSlug?: string): Promise<Product[]> {
    const dbProducts = await productRepository.findRecommended(limit, excludeSlug);
    return enrichProducts(dbProducts);
  },

  async findRelatedProducts(categoryId: number, excludeProductId: number, limit: number = 6): Promise<Product[]> {
    const dbProducts = await productRepository.findRelated(categoryId, excludeProductId, limit);
    return enrichProducts(dbProducts);
  },

  async findComplementProducts(mainProduct: Product): Promise<Product[]> {
    const allCategories = await categoryRepository.findAll();
    const complementSubs = allCategories.filter(c => c.parent_id === 5);
    
    const diverseComplements: Product[] = [];

    for (const sub of complementSubs) {
        const subProducts = await productRepository.findByCategoryId(sub.id);
        if (subProducts.length > 0) {
            const randomProduct = subProducts[Math.floor(Math.random() * subProducts.length)];
            diverseComplements.push(randomProduct);
        }
    }

    if (diverseComplements.length === 0) {
        const genericComplements = await productRepository.findComplements();
        return enrichProducts(genericComplements.slice(0, 10));
    }

    return enrichProducts(diverseComplements);
  },

  async getPublishedProducts(page: number = 1, limit: number = 25): Promise<{ products: Product[], total: number }> {
    const offset = (page - 1) * limit;
    const allPublished = await productRepository.findAllPublished();
    const products = await enrichProducts(allPublished.slice(offset, offset + limit));
    return { products, total: allPublished.length };
  },
  
  async getProductsByIds(productIds: number[]): Promise<Product[]> {
    if (productIds.length === 0) return [];
    const dbProducts = await productRepository.findProductsByIds(productIds);
    return enrichProducts(dbProducts);
  },

  async getPublishedProductsByCategory(categorySlug: string, page: number = 1, limit: number = 25): Promise<{ products: Product[], total: number }> {
    const offset = (page - 1) * limit;
    const allProducts = await productRepository.findByCategorySlug(categorySlug);
    const products = await enrichProducts(allProducts.slice(offset, offset + limit));
    return { products, total: allProducts.length };
  },
  
  async getCompleteProductDetailsBySlug(slug: string): Promise<Product | null> {
    const dbProduct = await productRepository.findBySlug(slug);
    if (!dbProduct) return null;
    const [enrichedProduct] = await enrichProducts([dbProduct]);
    return enrichedProduct;
  },
  
  async getCompleteProductDetailsById(id: number): Promise<Product | null> {
    const dbProduct = await productRepository.findById(id);
    if (!dbProduct) return null;
    const [enrichedProduct] = await enrichProducts([dbProduct]);
    return enrichedProduct;
  },

  async getComplementProducts(): Promise<Product[]> {
    const dbRows = await productRepository.findComplements();
    return enrichProducts(dbRows);
  },

  async updateProductStatus(slug: string, status: ProductStatus, editorId: number): Promise<boolean> {
    return dbWithAudit(editorId, () => productRepository.updateStatus(slug, status));
  },

  async softDeleteProduct(slug: string, deleterId: number): Promise<boolean> {
    const product = await productRepository.findBySlug(slug);
    if (!product) throw new Error('Producto no encontrado.');
    return dbWithAudit(deleterId, () => productRepository.softDelete(product.id));
  },
};
