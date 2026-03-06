// src/app/api/admin/users/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession, isAdminRole } from '@/utils/auth';
import { userService } from '@/services/userService';
import { prisma } from '@/lib/prisma';
import { z, ZodError } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Roles que un administrador puede asignar (SUPERADMIN no existe en este sistema)
const ALLOWED_ROLES = ['CUSTOMER', 'ADMIN'] as const;

const createUserSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(200),
  email: z.string().email('El correo electrónico no es válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  phone: z.string().max(20).optional().nullable(),
  role: z.enum(ALLOWED_ROLES).default('CUSTOMER'),
});

/**
 * GET /api/admin/users
 * Endpoint protegido para obtener la lista de usuarios.
 * Acepta parámetros de búsqueda y estado.
 */
export async function GET(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) {
      return errorHandler(new Error('Acceso prohibido. Sesión no válida.'), 403);
    }
    const user = await prisma.user.findFirst({ where: { id: session.dbId, isDeleted: false }, select: { role: true } });
    if (!isAdminRole(user?.role)) {
      return errorHandler(new Error('Acceso prohibido. Permisos insuficientes.'), 403);
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'active';
    const searchTerm = searchParams.get('search') || '';
    const roles = searchParams.get('roles')?.split(',').filter(Boolean) || [];
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));

    const result = await userService.getAllUsersForAdmin({
      status: status as 'active' | 'deleted' | 'all',
      searchTerm,
      roles,
      page,
      limit,
    });

    return successResponse(result);

  } catch (error) {
    console.error('[API_ADMIN_USERS_GET_ERROR]', error);
    return errorHandler(error);
  }
}

/**
 * POST /api/admin/users
 * Endpoint protegido para crear un nuevo usuario.
 */
export async function POST(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session || !session.dbId) {
      return errorHandler(new Error('Acceso denegado.'), 401);
    }
    const adminUser = await prisma.user.findFirst({ where: { id: session.dbId, isDeleted: false }, select: { role: true } });
    if (!isAdminRole(adminUser?.role)) {
      return errorHandler(new Error('Acceso prohibido.'), 403);
    }

    const rawBody = await req.json();
    const body = createUserSchema.parse(rawBody);

    const localUid = `user_${uuidv4()}`;

    const newUser = await userService.createUserByAdmin({ ...body, uid: localUid }, session.dbId);
    
    return successResponse(newUser, 201);

  } catch (error) {
    if (error instanceof ZodError) {
      return errorHandler(error, 400);
    }
    console.error('[API_ADMIN_USERS_POST_ERROR]', error);
    return errorHandler(error);
  }
}

/**
 * DELETE /api/admin/users
 * Endpoint protegido para realizar un borrado lógico masivo de usuarios.
 */
export async function DELETE(req: NextRequest) {
    try {
        const session: UserSession | null = await getDecodedToken(req);
        if (!session?.dbId) {
            return errorHandler(new Error('Acceso denegado.'), 401);
        }
        const adminUser = await prisma.user.findFirst({ where: { id: session.dbId, isDeleted: false }, select: { role: true } });
        if (!isAdminRole(adminUser?.role)) {
            return errorHandler(new Error('Acceso prohibido.'), 403);
        }

        const { userIds } = await req.json();

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return errorHandler(new Error('Se requiere un array de IDs de usuario.'), 400);
        }

        // Evitar que el admin se elimine a sí mismo
        const filteredUserIds = userIds.filter(id => id !== session.dbId);

        const result = await userService.bulkDeleteUsers(filteredUserIds, session.dbId);

        return successResponse({
            message: `Se eliminaron ${result.deletedCount} de ${userIds.length} usuarios seleccionados.`,
            details: result.errors
        });

    } catch (error) {
        console.error('[API_ADMIN_USERS_BULK_DELETE_ERROR]', error);
        return errorHandler(error);
    }
}
