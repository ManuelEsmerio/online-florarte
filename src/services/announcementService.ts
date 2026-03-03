// src/services/announcementService.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { Announcement } from '@/lib/definitions';
import { z } from 'zod';
import { saveAnnouncementImage, deleteManagedFile } from './file.service';
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

function mapToAnnouncement(row: {
  id: number; title: string; description: string | null;
  buttonText: string | null; buttonLink: string | null;
  imageUrl: string; imageMobileUrl: string | null;
  isActive: boolean; startAt: Date | null; endAt: Date | null;
  sortOrder: number; createdAt: Date; updatedAt: Date;
}): Announcement {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    buttonText: row.buttonText,
    buttonLink: row.buttonLink,
    imageUrl: row.imageUrl,
    imageMobileUrl: row.imageMobileUrl,
    isActive: row.isActive,
    startAt: row.startAt,
    endAt: row.endAt,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getAllAnnouncements(): Promise<Announcement[]> {
  const rows = await prisma.announcement.findMany({ orderBy: { sortOrder: 'asc' } });
  return rows.map(row => ({
    ...mapToAnnouncement(row),
    imageUrl: getPublicUrlForPath(row.imageUrl),
    imageMobileUrl: row.imageMobileUrl ? getPublicUrlForPath(row.imageMobileUrl) : null,
  }));
}

export async function getActiveAnnouncements(): Promise<Omit<Announcement, 'isActive' | 'sortOrder' | 'createdAt' | 'updatedAt'>[]> {
  const now = new Date();
  const rows = await prisma.announcement.findMany({
    where: {
      isActive: true,
      OR: [{ startAt: null }, { startAt: { lte: now } }],
      AND: [{ OR: [{ endAt: null }, { endAt: { gte: now } }] }],
    },
    orderBy: { sortOrder: 'asc' },
  });

  return rows.map(row => ({
    id: row.id,
    title: row.title,
    description: row.description,
    buttonText: row.buttonText,
    buttonLink: row.buttonLink,
    imageUrl: getPublicUrlForPath(row.imageUrl),
    imageMobileUrl: row.imageMobileUrl ? getPublicUrlForPath(row.imageMobileUrl) : null,
  }));
}

export async function create(data: any, images: { desktop?: File; mobile?: File }, creatorId: number): Promise<Announcement> {
  const validatedData = announcementSchema.omit({ id: true, image_url: true, image_mobile_url: true }).parse(data);

  if (!images.desktop) throw new Error("La imagen de escritorio es requerida.");

  // Crear registro primero para obtener el ID real
  const newRow = await dbWithAudit(creatorId, () =>
    prisma.announcement.create({
      data: {
        title: validatedData.title,
        description: validatedData.description ?? null,
        buttonText: validatedData.button_text ?? null,
        buttonLink: validatedData.button_link ?? null,
        imageUrl: '',
        isActive: validatedData.is_active,
        startAt: validatedData.start_at ?? null,
        endAt: validatedData.end_at ?? null,
        sortOrder: validatedData.sort_order,
      },
    })
  );

  const desktopPath = await saveAnnouncementImage(images.desktop, newRow.id);
  let mobilePath: string | null = null;
  if (images.mobile) {
    mobilePath = await saveAnnouncementImage(images.mobile, newRow.id);
  }

  const updated = await prisma.announcement.update({
    where: { id: newRow.id },
    data: { imageUrl: desktopPath, imageMobileUrl: mobilePath },
  });

  return mapToAnnouncement(updated);
}

export async function update(id: number, data: any, images: { desktop?: File; mobile?: File }, editorId: number): Promise<Announcement> {
  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) throw new Error("Anuncio no encontrado.");

  const validatedData = announcementSchema.partial().parse(data);
  const updateData: any = {};

  if (validatedData.title !== undefined) updateData.title = validatedData.title;
  if (validatedData.description !== undefined) updateData.description = validatedData.description;
  if (validatedData.button_text !== undefined) updateData.buttonText = validatedData.button_text;
  if (validatedData.button_link !== undefined) updateData.buttonLink = validatedData.button_link;
  if (validatedData.is_active !== undefined) updateData.isActive = validatedData.is_active;
  if (validatedData.start_at !== undefined) updateData.startAt = validatedData.start_at;
  if (validatedData.end_at !== undefined) updateData.endAt = validatedData.end_at;
  if (validatedData.sort_order !== undefined) updateData.sortOrder = validatedData.sort_order;

  if (images.desktop) {
    if (existing.imageUrl) await deleteManagedFile(existing.imageUrl);
    updateData.imageUrl = await saveAnnouncementImage(images.desktop, id);
  }
  if (images.mobile) {
    if (existing.imageMobileUrl) await deleteManagedFile(existing.imageMobileUrl);
    updateData.imageMobileUrl = await saveAnnouncementImage(images.mobile, id);
  } else if (data.image_mobile_url === '') {
    if (existing.imageMobileUrl) await deleteManagedFile(existing.imageMobileUrl);
    updateData.imageMobileUrl = null;
  }

  const updated = await dbWithAudit(editorId, () =>
    prisma.announcement.update({ where: { id }, data: updateData })
  );

  return mapToAnnouncement(updated);
}

export async function deleteAd(id: number, deleterId: number): Promise<void> {
  const existing = await prisma.announcement.findUnique({ where: { id } });
  await dbWithAudit(deleterId, () => prisma.announcement.delete({ where: { id } }));
  if (existing?.imageUrl) await deleteManagedFile(existing.imageUrl);
  if (existing?.imageMobileUrl) await deleteManagedFile(existing.imageMobileUrl);
}
