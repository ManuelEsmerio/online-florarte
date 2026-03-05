// src/services/tagService.ts
import { prisma } from '@/lib/prisma';
import { UserFacingError } from '@/utils/errors';
import type { Tag } from '@/lib/definitions';
import { z } from 'zod';

const tagSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
});

const dbWithAudit = async <T>(userId: number, fn: () => Promise<T>): Promise<T> => fn();

export const tagService = {
  async getAllTags(): Promise<Tag[]> {
    return prisma.tag.findMany({ orderBy: { name: 'asc' } });
  },

  async createTag(data: any, creatorId: number): Promise<Tag> {
    const validatedData = tagSchema.parse(data);

    const existing = await prisma.tag.findFirst({
      where: { name: { equals: validatedData.name } },
    });
    if (existing) throw new Error('Ya existe una etiqueta con este nombre.');

    return dbWithAudit(creatorId, () =>
      prisma.tag.create({ data: { name: validatedData.name } })
    );
  },

  async updateTag(id: number, data: any, editorId: number): Promise<Tag> {
    const validatedData = tagSchema.parse(data);

    const existingName = await prisma.tag.findFirst({
      where: { name: { equals: validatedData.name } },
    });
    if (existingName && existingName.id !== id) {
      throw new Error('Ya existe otra etiqueta con este nombre.');
    }

    return dbWithAudit(editorId, () =>
      prisma.tag.update({ where: { id }, data: { name: validatedData.name } })
    );
  },

  async deleteTag(id: number, deleterId: number): Promise<void> {
    const hasProducts = await prisma.productTag.findFirst({ where: { tagId: id } });
    if (hasProducts) throw new Error('No se puede eliminar la etiqueta porque tiene productos asociados.');

    await dbWithAudit(deleterId, () =>
      prisma.tag.delete({ where: { id } })
    );
  },
};
