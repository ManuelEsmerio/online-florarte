// src/app/api/admin/announcements/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession } from '@/utils/auth';
import { userService } from '@/services/userService';
import { getAllAnnouncements, create } from '@/services/announcementService';

export async function GET(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (session?.dbId === undefined) return errorHandler(new Error('Acceso denegado.'), 401);
    const user = await userService.getUserById(session.dbId);
    if (user?.role !== 'admin') return errorHandler(new Error('Acceso prohibido.'), 403);
    
    const announcements = await getAllAnnouncements();
    return successResponse(announcements);
  } catch (error) {
    return errorHandler(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (session?.dbId === undefined) return errorHandler(new Error('Acceso denegado.'), 401);
    const user = await userService.getUserById(session.dbId);
    if (user?.role !== 'admin') return errorHandler(new Error('Acceso prohibido.'), 403);

    const formData = await req.formData();
    const announcementData = JSON.parse(formData.get('announcementData') as string);
    const images = {
      desktop: formData.get('image_desktop') as File | undefined,
      mobile: formData.get('image_mobile') as File | undefined,
    };
    
    const newAnnouncement = await create(announcementData, images, session.dbId);
    return successResponse(newAnnouncement, 201);
  } catch (error) {
    return errorHandler(error);
  }
}
