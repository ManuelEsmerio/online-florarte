// src/app/api/admin/announcements/[id]/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession, isAdminRole } from '@/utils/auth';
import { update, deleteAd } from '@/services/announcementService';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Para actualizar, usamos POST porque FormData con PUT no es directamente compatible en Next.js App Router
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (session?.dbId === undefined) return errorHandler(new Error('Acceso denegado.'), 401);
        if (!isAdminRole(session.role)) return errorHandler(new Error('Acceso prohibido.'), 403);

    const { id: routeAnnouncementId } = await params;
    const id = parseInt(routeAnnouncementId, 10);
    const formData = await req.formData();
    const announcementData = JSON.parse(formData.get('announcementData') as string);
    const images = {
      desktop: formData.get('image_desktop') as File | undefined,
      mobile: formData.get('image_mobile') as File | undefined,
    };

    const updatedAnnouncement = await update(id, announcementData, images, session.dbId);
    return successResponse(updatedAnnouncement);
  } catch (error) {
    return errorHandler(error);
  }
}


export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (session?.dbId === undefined) return errorHandler(new Error('Acceso denegado.'), 401);
        if (!isAdminRole(session.role)) return errorHandler(new Error('Acceso prohibido.'), 403);

    const { id: routeAnnouncementId } = await params;
    const id = parseInt(routeAnnouncementId, 10);
    await deleteAd(id, session.dbId);
    return successResponse({ message: 'Anuncio eliminado correctamente.' });
  } catch (error) {
    return errorHandler(error);
  }
}
