// src/utils/auth.ts
import { NextRequest } from 'next/server';
import { verifyToken, COOKIE_NAME } from '@/lib/jwt';

export interface UserSession {
  dbId: number;
  role: string;
}

export function isAdminRole(role: unknown): boolean {
  return typeof role === 'string' && role.trim().toUpperCase() === 'ADMIN';
}

/**
 * Verifica el JWT almacenado en la cookie httpOnly y retorna la sesión del usuario.
 */
export async function getDecodedToken(req: NextRequest): Promise<UserSession | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (!token) return null;

  const payload = await verifyToken(token);

  if (!payload?.sub) return null;

  const userId = parseInt(payload.sub, 10);
  if (isNaN(userId)) return null;

  return {
    dbId: userId,
    role: payload.role,
  };
}
