// src/app/api/admin/users/[id]/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession } from '@/utils/auth';
import { userService } from '@/services/userService';
import { prisma } from '@/lib/prisma';
import { ZodError } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/admin/users/[id]
 * Endpoint protegido para actualizar un usuario por su ID.
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  let routeUserId = '';

  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) {
      return errorHandler(new Error('Acceso denegado.'), 401);
    }

    const { id } = await params;
    routeUserId = id;
    
    const userIdToUpdate = parseInt(id, 10);
    const body = await req.json();
    
    const userToUpdate = await prisma.user.findFirst({ where: { id: userIdToUpdate, isDeleted: false } });
    if (!userToUpdate) return errorHandler(new Error("Usuario no encontrado."), 404);

    if (body.email && body.email !== userToUpdate.email) {
        const existing = await prisma.user.findFirst({ where: { email: body.email, isDeleted: false } });
        if (existing && existing.id !== userIdToUpdate) {
            return errorHandler(new Error("El correo electrónico ya está en uso por otra cuenta."), 409);
        }
        // En modo demo no hay actualización real en Firebase Auth
    }

    const updatedUser = await userService.updateUserByAdmin(userIdToUpdate, body, session.dbId);
    
    return successResponse(updatedUser);

  } catch (error) {
    if (error instanceof ZodError) {
      return errorHandler(error, 400);
    }
    if (error instanceof Error && error.message.includes('ya está en uso')) {
      return errorHandler(error, 409); // Conflict
    }
    console.error(`[API_ADMIN_USER_UPDATE_ERROR] ID: ${routeUserId}`, error);
    return errorHandler(error);
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Endpoint protegido para realizar un borrado lógico de un usuario.
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  let routeUserId = '';

  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) {
      return errorHandler(new Error('Acceso denegado.'), 401);
    }

    const { id } = await params;
    routeUserId = id;
    
    const userIdToDelete = parseInt(id, 10);
    if (userIdToDelete === session.dbId) {
      return errorHandler(new Error('No puedes eliminar tu propia cuenta.'), 400);
    }
    
    const userToDelete = await prisma.user.findFirst({ where: { id: userIdToDelete, isDeleted: false } });
    if (!userToDelete) return errorHandler(new Error("Usuario no encontrado."), 404);

    // En modo demo el borrado es solo lógico en nuestro array local
    await userService.deleteUser(userIdToDelete, session.dbId);

    console.info('[AUDIT] user_deleted', {
      action: 'user_deleted',
      targetUserId: userIdToDelete,
      targetEmail: userToDelete.email,
      performedBy: session.dbId,
      timestamp: new Date().toISOString(),
    });

    return successResponse({ message: 'Usuario eliminado correctamente (borrado lógico).' });
  } catch (error) {
    console.error(`[API_ADMIN_USER_DELETE_ERROR] ID: ${routeUserId}`, error);
    return errorHandler(error);
  }
}
