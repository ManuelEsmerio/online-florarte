// src/services/tagService.ts
import { tagRepository } from '../repositories/tagRepository';
import type { Tag } from '@/lib/definitions';
import { z } from 'zod';
// import { dbWithAudit } from '@/lib/db';

const tagSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
});

const dbWithAudit = async <T>(userId: number, fn: () => Promise<T>): Promise<T> => fn();

export const tagService = {
  async getAllTags(): Promise<Tag[]> {
    return tagRepository.findAll();
  },
  
  async createTag(data: any, creatorId: number): Promise<Tag> {
    const validatedData = tagSchema.parse(data);
    
    const existing = await tagRepository.findByName(validatedData.name);
    if(existing) throw new Error('Ya existe una etiqueta con este nombre.');
    
    const newTag = await dbWithAudit(creatorId, () =>
      tagRepository.create(validatedData)
    );
    if(!newTag) throw new Error('No se pudo crear la etiqueta.');

    return newTag;
  },
  
  async updateTag(id: number, data: any, editorId: number): Promise<Tag> {
    const validatedData = tagSchema.parse(data);

    const existingName = await tagRepository.findByName(validatedData.name);
    if(existingName && existingName.id !== id) {
        throw new Error('Ya existe otra etiqueta con este nombre.');
    }
    
    const updatedTag = await dbWithAudit(editorId, () =>
      tagRepository.update(id, validatedData)
    );
    if(!updatedTag) throw new Error('No se pudo actualizar la etiqueta.');

    return updatedTag;
  },
  
  async deleteTag(id: number, deleterId: number): Promise<void> {
    const hasProducts = await tagRepository.hasProducts(id);
    if(hasProducts) throw new Error('No se puede eliminar la etiqueta porque tiene productos asociados.');
    
    await dbWithAudit(deleterId, () =>
      tagRepository.delete(id)
    );
  }
};
