
// src/utils/request-utils.ts
import { type NextRequest } from 'next/server';
import { getDecodedToken, type UserSession } from '@/utils/auth';

/**
 * Convierte un valor a un número entero o null.
 */
export function toIntOrNull(value: any): number | null {
  if (value === undefined || value === null || value === '') return null;
  const num = parseInt(value, 10);
  return isNaN(num) ? null : num;
}

/**
 * Convierte un valor a un número entero o lanza un error.
 */
export function toIntOrThrow(value: any, fieldName: string): number {
  const num = parseInt(value, 10);
  if (isNaN(num)) throw new Error(`El campo '${fieldName}' debe ser un número entero válido.`);
  return num;
}

interface Identity {
  userId: number | null;
  sessionId: string | null;
}

/**
 * Obtiene la identidad del usuario para una petición, incluyendo siempre el sessionId.
 * - Si el usuario está logueado, devuelve `userId` y `sessionId`.
 * - Si es un invitado, devuelve `userId: null` y `sessionId`.
 * @param req La petición entrante de Next.js.
 * @returns Una promesa que resuelve a un objeto con `userId` (si aplica) y `sessionId`.
 */
export async function getIdentity(req: NextRequest): Promise<Identity> {
  // 1. Intentar obtener el usuario autenticado a partir del token JWT.
  const user: UserSession | null = await getDecodedToken(req);
  
  // 2. Obtener siempre el sessionId de la cookie.
  const sessionId = req.cookies.get('session_id')?.value || null;

  return {
    userId: user?.dbId || null,
    sessionId: sessionId,
  };
}
