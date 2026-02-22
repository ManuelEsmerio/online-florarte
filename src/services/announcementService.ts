// src/services/announcementService.ts
'use server';

import { announcementRepository } from '../repositories/announcementRepository';
import type { Announcement } from '@/lib/definitions';
import { z } from 'zod';
// import { dbWithAudit } from '@/lib/db';
import { saveAnnouncementImage, deleteLocalFile } from './file.service';
import { getPublicUrlForPath } from '@/utils/file-utils';

const announcementSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(3),
  description: z.string().optional().nullable(),
  button_text: z.string().optional().nullable(),
  button_link: z.string().optional().nullable(),
  image_url: z.string().optional(),
  image_mobile_url: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
  start_at: z.coerce.date().optional().nullable(),
  end_at: z.coerce.date().optional().nullable(),
  sort_order: z.coerce.number().int().default(0),
});

const dbWithAudit = async <T>(userId: number, fn: () => Promise<T>): Promise<T> => fn();

/**
 * Obtiene todos los anuncios para el panel de administración.
 */
export async function getAllAnnouncements(): Promise<Announcement[]> {
  const dbAnnouncements = await announcementRepository.findAll();
  return dbAnnouncements.map(ad => ({
    ...ad,
    is_active: Boolean(ad.is_active),
    image_url: getPublicUrlForPath(ad.image_url),
    image_mobile_url: ad.image_mobile_url ? getPublicUrlForPath(ad.image_mobile_url) : null,
    start_at: ad.start_at ? new Date(ad.start_at).toISOString() : null,
    end_at: ad.end_at ? new Date(ad.end_at).toISOString() : null,
  }));
}

/**
 * Obtiene solo los anuncios activos y vigentes para mostrar en la tienda.
 */
export async function getActiveAnnouncements(): Promise<Omit<Announcement, 'is_active' | 'sort_order' | 'created_at' | 'updated_at'>[]> {
  const allAnnouncements = await announcementRepository.findAll();
  const now = new Date();

  return allAnnouncements
    .filter(ad => {
      if (!ad.is_active) return false;
      const startDate = ad.start_at ? new Date(ad.start_at) : null;
      const endDate = ad.end_at ? new Date(ad.end_at) : null;
      if (startDate && now < startDate) return false;
      if (endDate && now > endDate) return false;
      return true;
    })
    .map(ad => ({
        id: ad.id,
        title: ad.title,
        description: ad.description,
        button_text: ad.button_text,
        button_link: ad.button_link,
        image_url: getPublicUrlForPath(ad.image_url),
        image_mobile_url: ad.image_mobile_url ? getPublicUrlForPath(ad.image_mobile_url) : null,
    }));
}


export async function create(data: any, images: { desktop?: File, mobile?: File }, creatorId: number): Promise<Announcement> {
  const validatedData = announcementSchema.omit({id: true, image_url: true, image_mobile_url: true}).parse(data);
  
  // En modo mock, no necesitamos el ID para guardar, pero lo simulamos
  const newId = Date.now();

  if (!images.desktop) throw new Error("La imagen de escritorio es requerida.");

  const desktopPath = await saveAnnouncementImage(images.desktop, newId);
  let mobilePath: string | null = null;
  if (images.mobile) {
      mobilePath = await saveAnnouncementImage(images.mobile, newId);
  }
  
  const newAnnouncementData: Announcement = {
      ...validatedData,
      id: newId,
      image_url: desktopPath,
      image_mobile_url: mobilePath,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
  };

  const createdAd = await dbWithAudit(creatorId, async () => {
      return await announcementRepository.create(newAnnouncementData);
  });
  
  return { ...createdAd, is_active: Boolean(createdAd.is_active) };
}

export async function update(id: number, data: any, images: { desktop?: File, mobile?: File }, editorId: number): Promise<Announcement> {
  const existing = await announcementRepository.findById(id);
  if (!existing) throw new Error("Anuncio no encontrado.");

  const validatedData = announcementSchema.partial().parse(data);

  if (images.desktop) {
      if(existing.image_url) await deleteLocalFile(existing.image_url);
      validatedData.image_url = await saveAnnouncementImage(images.desktop, id);
  }
  
  if (images.mobile) {
      if(existing.image_mobile_url) await deleteLocalFile(existing.image_mobile_url);
      validatedData.image_mobile_url = await saveAnnouncementImage(images.mobile, id);
  } else if (data.image_mobile_url === '') { // Check if user wants to remove mobile image
      if(existing.image_mobile_url) await deleteLocalFile(existing.image_mobile_url);
      validatedData.image_mobile_url = null;
  }
  
  const updatedAd = await dbWithAudit(editorId, () => announcementRepository.update(id, validatedData));
  
  if(!updatedAd) throw new Error("Error al obtener el anuncio actualizado.");

  return { ...updatedAd, is_active: Boolean(updatedAd.is_active) };
}

export async function deleteAd(id: number, deleterId: number): Promise<void> {
  const existing = await announcementRepository.findById(id);
  await dbWithAudit(deleterId, () => announcementRepository.delete(id));
  if (existing?.image_url) await deleteLocalFile(existing.image_url);
  if (existing?.image_mobile_url) await deleteLocalFile(existing.image_mobile_url);
}
