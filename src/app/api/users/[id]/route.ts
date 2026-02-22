// src/app/api/users/[id]/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { userService } from '@/services/userService';
import { getDecodedToken, UserSession } from '@/utils/auth';

/**
 * GET /api/users/profile
 * Obtiene los datos del usuario autenticado.
 * El ID del usuario se obtiene del token, no de la URL.
 */
export async function GET(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);

    // Si no hay sesión o no se encontró el usuario en la BD, no está autorizado.
    if (!session?.dbId) {
      return errorHandler(new Error('No autorizado. Sesión inválida.'), 401);
    }
    
    // Usamos el ID de la base de datos (obtenido a través del UID de Firebase) para buscar al usuario.
    const user = await userService.getUserById(session.dbId);

    if (!user) {
        return errorHandler(new Error('Usuario no encontrado.'), 404);
    }

    return successResponse(user);

  } catch (error: any) {
    console.error('[API_GET_USER_PROFILE_ERROR]', error);
    return errorHandler(error);
  }
}

/**
 * PUT /api/users/profile
 * Actualiza los datos del usuario autenticado.
 */
export async function PUT(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) {
      return errorHandler(new Error('No autorizado. Sesión inválida.'), 401);
    }

    const body = await req.json();
    
    // El servicio se encarga de la lógica de actualización usando el ID de la sesión.
    const updatedUser = await userService.updateUser(session.dbId, body);

    return successResponse(updatedUser, 200);

  } catch (error: any) {
    if (error instanceof Error && error.message.includes('ya está en uso')) {
      return errorHandler(error, 409); // Conflict
    }
    return errorHandler(error);
  }
}

/**
 * DELETE /api/users/profile
 * Elimina la cuenta del usuario autenticado.
 */
export async function DELETE(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) {
       return errorHandler(new Error('No autorizado. Sesión inválida.'), 401);
    }

    await userService.deleteUser(session.dbId);

    return successResponse({ message: "Cuenta eliminada correctamente" }, 200);
    
  } catch (error: any) {
     return errorHandler(error);
  }
}
