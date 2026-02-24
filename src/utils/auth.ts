// src/utils/auth.ts
import { NextRequest } from 'next/server';
import { userRepository } from '@/repositories/userRepository';

/**
 * Representa la sesión simulada del usuario.
 */
export interface UserSession {
  dbId: number; // ID numérico de tu base de datos
}

/**
 * Obtiene la sesión simulada del usuario desde un encabezado personalizado.
 * En modo demo, reemplaza la verificación de token de Firebase.
 * 
 * @param req La petición entrante de Next.js.
 * @returns Un objeto UserSession o null si no se proporciona el encabezado.
 */
export async function getDecodedToken(req: NextRequest): Promise<UserSession | null> {
  const userIdHeader = req.headers.get("X-User-Id");
  if (!userIdHeader) {
    return null;
  }

  const userId = parseInt(userIdHeader, 10);
  if (isNaN(userId)) {
    return null;
  }

  // Opcional: Podrías verificar si el usuario realmente existe en la BD
  // const userExists = await userRepository.findById(userId);
  // if (!userExists) return null;

  return {
    dbId: userId,
  };
}
