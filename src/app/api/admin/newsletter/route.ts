import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession, isAdminRole } from '@/utils/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/newsletter
 * Lista de suscriptores newsletter para panel admin.
 */
export async function GET(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) {
      return errorHandler(new Error('Acceso denegado.'), 401);
    }

    if (!isAdminRole(session.role)) {
      return errorHandler(new Error('Acceso prohibido.'), 403);
    }

    const { searchParams } = new URL(req.url);
    const source = searchParams.get('source')?.trim().toLowerCase() || 'all';
    const search = searchParams.get('search')?.trim() || '';
    const status = searchParams.get('status')?.trim().toLowerCase() || 'active';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (source !== 'all') {
      where.source = source;
    }

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    if (search) {
      where.email = { contains: search };
    }

    const [subscribers, total] = await prisma.$transaction([
      prisma.newsletterSubscriber.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          source: true,
          isActive: true,
          confirmed: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.newsletterSubscriber.count({ where }),
    ]);

    return successResponse({ subscribers, total, page, limit });
  } catch (error) {
    console.error('[API_ADMIN_NEWSLETTER_GET_ERROR]', error);
    return errorHandler(error);
  }
}
