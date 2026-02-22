// src/services/occasionService.ts
import { occasionRepository } from '../repositories/occasionRepository';
import type { Occasion } from '@/lib/definitions';
import slugify from 'slugify';
import { z } from 'zod';
// import { dbWithAudit } from '@/lib/db';
import { saveOccasionImage, deleteLocalFile } from './file.service';
import { getPublicUrlForPath } from '@/utils/file-utils';

const occasionSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres.'),
  show_on_home: z.boolean().default(false),
});

const dbWithAudit = async <T>(userId: number, fn: () => Promise<T>): Promise<T> => fn();

export const occasionService = {
  async getAllOccasions(): Promise<Occasion[]> {
    const dbOccasions = await occasionRepository.findAll();
    return dbOccasions.map(o => {
        const imageUrl = getPublicUrlForPath(o.image_url);
        return {
            ...o,
            image_url: imageUrl || '/placehold.webp',
            show_on_home: !!o.show_on_home,
        }
    });
  },
  
  async createOccasion(data: any, imageFile: File | null, creatorId: number): Promise<Occasion> {
    const validatedData = occasionSchema.parse(data);
    const slug = slugify(validatedData.name, { lower: true, strict: true });
    
    const existing = await occasionRepository.findBySlug(slug);
    if(existing) throw new Error('Ya existe una ocasión con este nombre/slug.');
    
    const newId = Date.now();
    let imageUrl: string | null = null;
    if (imageFile) {
        imageUrl = await saveOccasionImage(imageFile, newId);
    }

    const dataToCreate: Occasion = {
        id: newId,
        name: validatedData.name,
        slug,
        description: validatedData.description,
        image_url: imageUrl || '',
        show_on_home: validatedData.show_on_home,
    };

    const newOccasion = await dbWithAudit(creatorId, () =>
      occasionRepository.create(dataToCreate)
    );

    if(!newOccasion) throw new Error('No se pudo crear la ocasión.');

    return {...newOccasion, image_url: getPublicUrlForPath(newOccasion.image_url), show_on_home: !!newOccasion.show_on_home};
  },
  
  async updateOccasion(id: number, data: any, imageFile: File | null, editorId: number): Promise<Occasion> {
    const existing = await occasionRepository.findById(id);
    if (!existing) throw new Error('Ocasión no encontrada.');

    const validatedData = occasionSchema.parse(data);
    const slug = slugify(validatedData.name, { lower: true, strict: true });

    const existingSlug = await occasionRepository.findBySlug(slug);
    if(existingSlug && existingSlug.id !== id) {
        throw new Error('Ya existe otra ocasión con este nombre/slug.');
    }
    
    let imageUrl = existing.image_url;
    if (imageFile) {
        if(imageUrl) await deleteLocalFile(imageUrl);
        imageUrl = await saveOccasionImage(imageFile, id);
    }
    
    const dataToUpdate: Partial<Omit<Occasion, 'id'>> & { image_url?: string | null } = {
        name: validatedData.name,
        slug,
        description: validatedData.description,
        image_url: imageUrl,
        show_on_home: validatedData.show_on_home,
    };
    
    const updatedOccasion = await dbWithAudit(editorId, () =>
      occasionRepository.update(id, dataToUpdate)
    );
    if(!updatedOccasion) throw new Error('No se pudo actualizar la ocasión.');

    return {...updatedOccasion, image_url: getPublicUrlForPath(updatedOccasion.image_url), show_on_home: !!updatedOccasion.show_on_home};
  },
  
  async deleteOccasion(id: number, deleterId: number): Promise<void> {
    const existing = await occasionRepository.findById(id);

    const hasProducts = await occasionRepository.hasProducts(id);
    if(hasProducts) throw new Error('No se puede eliminar la ocasión porque tiene productos asociados.');
    
    await dbWithAudit(deleterId, () =>
      occasionRepository.delete(id)
    );

    if (existing?.image_url) {
      await deleteLocalFile(existing.image_url);
    }
  }
};
