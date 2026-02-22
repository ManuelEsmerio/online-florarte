// src/services/categoryService.ts
import { categoryRepository } from '../repositories/categoryRepository';
import type { ProductCategory } from '@/lib/definitions';
import { getPublicUrlForPath } from '@/utils/file-utils';
import { saveCategoryImage, deleteLocalFile } from './file.service';
import { z } from 'zod';
import slugify from 'slugify';
import { dbWithAudit } from '@/lib/db';

const categorySchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  description: z.string().min(10, 'La descripción es muy corta.'),
  parent_id: z.coerce.number().optional().nullable(),
  show_on_home: z.boolean().default(false),
});

export const categoryService = {
  async getHomePageCategories(): Promise<ProductCategory[]> {
    const dbCategories = await categoryRepository.findAll();
    return dbCategories
      .filter(c => c.show_on_home)
      .map(c => ({
        ...c,
        image_url: getPublicUrlForPath(c.image_url) || '/placehold.webp',
        show_on_home: !!c.show_on_home,
    }));
  },

  async getAllCategories(): Promise<ProductCategory[]> {
    const dbCategories = await categoryRepository.findAll();
    return dbCategories.map(c => ({
        ...c,
        image_url: getPublicUrlForPath(c.image_url) || '/placehold.webp',
        show_on_home: !!c.show_on_home,
    }));
  },
  
  async createCategory(data: any, imageFile: File | null, creatorId: number): Promise<ProductCategory> {
    const validatedData = categorySchema.parse(data);
    const slug = slugify(validatedData.name, { lower: true, strict: true });
    
    const existing = await categoryRepository.findByName(validatedData.name);
    if(existing) throw new Error('Ya existe una categoría con este nombre.');
    
    const newCategoryId = await dbWithAudit(creatorId, async (connection) => {
      const createParams = { ...validatedData, slug, prefix: validatedData.name.substring(0,3).toUpperCase() };
      return await categoryRepository.create(connection, createParams);
    });

    if (!newCategoryId) {
      throw new Error("No se pudo crear la categoría");
    }
    
    let imageUrl: string | null = null;
    if (imageFile) {
        imageUrl = await saveCategoryImage(imageFile, newCategoryId);
        await dbWithAudit(creatorId, async (connection) => {
            await categoryRepository.update(connection, newCategoryId, { image_url: imageUrl });
        });
    }

    const newCategory = await categoryRepository.findById(newCategoryId);
    if (!newCategory) throw new Error("No se pudo recuperar la categoría creada.");
    
    return { ...newCategory, image_url: getPublicUrlForPath(imageUrl), show_on_home: !!newCategory.show_on_home };
  },
  
  async updateCategory(id: number, data: any, imageFile: File | null, editorId: number): Promise<ProductCategory> {
    const existing = await categoryRepository.findById(id);
    if(!existing) throw new Error('Categoría no encontrada.');
    
    const validatedData = categorySchema.parse(data);
    const slug = slugify(validatedData.name, { lower: true, strict: true });

    const existingSlug = await categoryRepository.findByName(validatedData.name);
    if(existingSlug && existingSlug.id !== id) {
        throw new Error('Ya existe otra categoría con este nombre.');
    }
    
    const dataToUpdate: any = { ...validatedData, slug };
    
    if (imageFile) {
        if(existing.image_url) await deleteLocalFile(existing.image_url);
        dataToUpdate.image_url = await saveCategoryImage(imageFile, id);
    }
    
    await dbWithAudit(editorId, async (connection) => {
        await categoryRepository.update(connection, id, dataToUpdate);
    });

    const updatedCategory = await categoryRepository.findById(id);
    if(!updatedCategory) throw new Error('No se pudo actualizar la categoría.');

    return {...updatedCategory, image_url: getPublicUrlForPath(updatedCategory.image_url), show_on_home: !!updatedCategory.show_on_home};
  },
  
  async toggleCategoryShowOnHome(categoryId: number, showOnHome: boolean, editorId: number): Promise<void> {
    await dbWithAudit(editorId, (connection) => 
      categoryRepository.update(connection, categoryId, { show_on_home: showOnHome })
    );
  },

  async deleteCategory(id: number, deleterId: number): Promise<void> {
    const hasProducts = await categoryRepository.hasProducts(id);
    if(hasProducts) throw new Error('No se puede eliminar la categoría porque tiene productos asociados.');
    
    const hasSubcategories = await categoryRepository.hasSubcategories(id);
    if(hasSubcategories) throw new Error('No se puede eliminar la categoría porque tiene subcategorías asociadas.');
    
    await dbWithAudit(deleterId, (connection) => 
        categoryRepository.delete(connection, id)
    );
  }
};
