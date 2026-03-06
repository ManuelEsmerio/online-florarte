// src/app/api/admin/company-meta/route.ts
// Admin CRUD for chatbot company metadata (address, hours, phone, etc.)

import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession, isAdminRole } from '@/utils/auth';
import { companyService } from '@/services/chatbot/company.service';
import { z } from 'zod';

const upsertSchema = z.object({
  key:   z.string().min(1).max(100),
  value: z.string().min(1),
});

/** GET /api/admin/company-meta — returns all key-value pairs */
export async function GET(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId)          return errorHandler(new Error('Acceso denegado.'), 401);
    if (!isAdminRole(session.role)) return errorHandler(new Error('Acceso prohibido.'), 403);

    const all = await companyService.getAll();
    return successResponse(all);
  } catch (error) {
    console.error('[ADMIN_COMPANY_META_GET]', error);
    return errorHandler(error);
  }
}

/** PUT /api/admin/company-meta — upserts a single key-value pair */
export async function PUT(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId)          return errorHandler(new Error('Acceso denegado.'), 401);
    if (!isAdminRole(session.role)) return errorHandler(new Error('Acceso prohibido.'), 403);

    const body   = await req.json();
    const parsed = upsertSchema.safeParse(body);
    if (!parsed.success) return errorHandler(new Error('Datos inválidos.'), 400);

    await companyService.upsert(parsed.data.key, parsed.data.value);
    return successResponse({ message: 'Actualizado correctamente.' });
  } catch (error) {
    console.error('[ADMIN_COMPANY_META_PUT]', error);
    return errorHandler(error);
  }
}

/** DELETE /api/admin/company-meta?key=address — deletes a key */
export async function DELETE(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId)          return errorHandler(new Error('Acceso denegado.'), 401);
    if (!isAdminRole(session.role)) return errorHandler(new Error('Acceso prohibido.'), 403);

    const key = new URL(req.url).searchParams.get('key');
    if (!key) return errorHandler(new Error('Se requiere el parámetro key.'), 400);

    await companyService.delete(key);
    return successResponse({ message: 'Eliminado correctamente.' });
  } catch (error) {
    console.error('[ADMIN_COMPANY_META_DELETE]', error);
    return errorHandler(error);
  }
}
