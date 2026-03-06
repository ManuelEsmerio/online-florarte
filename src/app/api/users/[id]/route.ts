// src/app/api/users/[id]/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { userService } from '@/services/userService';
import { getDecodedToken, UserSession } from '@/utils/auth';

const ALLOWED_PROFILE_FIELDS = new Set([
  'name', 'email', 'phone', 'birthdate', 'acceptsMarketing', 'profilePic',
]);

const ALLOWED_ADDRESS_FIELDS = new Set([
  'id', 'alias', 'recipientName', 'recipientPhone', 'streetName', 'streetNumber',
  'interiorNumber', 'neighborhood', 'city', 'state', 'country', 'postalCode',
  'addressType', 'referenceNotes', 'isDefault', 'latitude', 'longitude', 'googlePlaceId',
]);

function sanitizeProfilePayload(body: any) {
  const sanitized: Record<string, any> = {};
  ALLOWED_PROFILE_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) sanitized[field] = body[field];
  });
  if (Array.isArray(body?.addresses)) {
    sanitized.addresses = body.addresses.map((addr: any) => {
      const s: Record<string, any> = {};
      ALLOWED_ADDRESS_FIELDS.forEach((f) => {
        if (Object.prototype.hasOwnProperty.call(addr, f)) s[f] = addr[f];
      });
      return s;
    });
  }
  return sanitized;
}

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
    const sanitizedBody = sanitizeProfilePayload(body);

    // El servicio se encarga de la lógica de actualización usando el ID de la sesión.
    const updatedUser = await userService.updateUser(session.dbId, sanitizedBody);

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
