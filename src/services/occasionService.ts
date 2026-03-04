// src/services/occasionService.ts
import { prisma } from '@/lib/prisma';
import { UserFacingError } from '@/utils/errors';
import type { Occasion } from '@/lib/definitions';
import slugify from 'slugify';
import { z } from 'zod';
import { saveOccasionImage, deleteManagedFile } from './file.service';
import { getPublicUrlForPath } from '@/utils/file-utils';

const occasionSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres.'),
  show_on_home: z.boolean().default(false),
});

const dbWithAudit = async <T>(userId: number, fn: () => Promise<T>): Promise<T> => fn();

const formatOccasion = (occasion: any): Occasion => {
  const publicUrl = getPublicUrlForPath(occasion.imageUrl);
  return {
    ...occasion,
    imageUrl: publicUrl || '/placehold.webp',
    showOnHome: occasion.showOnHome,
    products: [],
  } as Occasion;
};

export const occasionService = {
  async getAllOccasions(): Promise<Occasion[]> {
    const dbOccasions = await prisma.occasion.findMany({
      orderBy: { name: 'asc' }
    });
    
    return dbOccasions.map(formatOccasion);
  },

  async getHomePageOccasions(): Promise<Occasion[]> {
    const dbOccasions = await prisma.occasion.findMany({
      where: { showOnHome: true },
      orderBy: { name: 'asc' }
    });

    return dbOccasions.map(formatOccasion);
  },
  
  async createOccasion(data: any, imageFile: File | null, creatorId: number): Promise<Occasion> {
    const validatedData = occasionSchema.parse(data);
    const slug = slugify(validatedData.name, { lower: true, strict: true });
    
    const existing = await prisma.occasion.findUnique({
      where: { slug }
    });
    if(existing) throw new UserFacingError('Ya existe una ocasión con este nombre/slug.');
    
    const newOccasion = await dbWithAudit(creatorId, async () => {
         return await prisma.occasion.create({
            data: {
                name: validatedData.name,
                slug,
                description: validatedData.description,
                imageUrl: null, 
                showOnHome: validatedData.show_on_home, 
            }
        });
    });

    if(!newOccasion) throw new UserFacingError('No se pudo crear la ocasión.');
    const newId = newOccasion.id;

    let imageUrl: string | null = null;
    if (imageFile) {
        try {
            imageUrl = await saveOccasionImage(imageFile, newId);
            // Update the record with the image URL
            await prisma.occasion.update({
                where: { id: newId },
                data: { imageUrl }
            });
            newOccasion.imageUrl = imageUrl;
        } catch (e) {
            console.error("Error saving image", e);
        }
    }

    return formatOccasion(newOccasion);
  },
  
  async updateOccasion(id: number, data: any, imageFile: File | null, editorId: number): Promise<Occasion> {
    const existing = await prisma.occasion.findUnique({ where: { id } });
    if (!existing) throw new UserFacingError('Ocasión no encontrada.');

    const validatedData = occasionSchema.parse(data);
    const slug = slugify(validatedData.name, { lower: true, strict: true });

    const existingSlug = await prisma.occasion.findUnique({ where: { slug } });
    if(existingSlug && existingSlug.id !== id) {
        throw new UserFacingError('Ya existe otra ocasión con este nombre/slug.');
    }
    
    let imageUrl = existing.imageUrl;
    if (imageFile) {
      if(imageUrl) await deleteManagedFile(imageUrl);
        imageUrl = await saveOccasionImage(imageFile, id);
    }
    
    const updatedOccasion = await dbWithAudit(editorId, () =>
      prisma.occasion.update({
        where: { id },
        data: {
            name: validatedData.name,
            slug,
            description: validatedData.description,
            imageUrl: imageUrl,
            showOnHome: validatedData.show_on_home,
        }
      })
    );
    
    return formatOccasion(updatedOccasion);
  },
  
  async deleteOccasion(id: number, deleterId: number): Promise<void> {
    const existing = await prisma.occasion.findUnique({ where: { id } });
    if (!existing) return;

    // Check relations
    // Assuming Relation name follows naming convention or explicitly checked in schema
    // In schema: products ProductOccasion[]
    const hasProducts = await prisma.productOccasion.findFirst({
        where: { occasionId: id }
    });
    
    if(hasProducts) throw new UserFacingError('No se puede eliminar la ocasión porque tiene productos asociados.');
    
    await dbWithAudit(deleterId, async () => {
        await prisma.occasion.delete({ where: { id } });
    });

    if (existing?.imageUrl) {
      await deleteManagedFile(existing.imageUrl);
    }
  },

  async getOccasionBySlug(slug: string): Promise<Occasion | null> {
    const occasion = await prisma.occasion.findUnique({ where: { slug } });
    if (!occasion) return null;
    
    return formatOccasion(occasion);
  },
    
  async getOccasionById(id: number): Promise<Occasion | null> {
    const occasion = await prisma.occasion.findUnique({ where: { id } });
    if (!occasion) return null;
    
    return formatOccasion(occasion);
  }
};
