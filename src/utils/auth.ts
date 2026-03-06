// src/utils/auth.ts
import { NextRequest } from 'next/server';
import { verifyToken, COOKIE_NAME } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export interface UserSession {
  dbId: number;
  role: string;
}

export function isAdminRole(role: unknown): boolean {
  return typeof role === 'string' && role.trim().toUpperCase() === 'ADMIN';
}

/**
 * Verifica el JWT almacenado en la cookie httpOnly y retorna la sesión del usuario.
 * Valida el tokenVersion contra la BD para invalidar tokens tras cambio de contraseña/rol.
 */
export async function getDecodedToken(req: NextRequest): Promise<UserSession | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (!token) return null;

  const payload = await verifyToken(token);

  if (!payload?.sub) return null;

  const userId = parseInt(payload.sub, 10);
  if (isNaN(userId)) return null;

  // Verificar tokenVersion: si cambió contraseña o rol, el JWT queda revocado
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tokenVersion: true, isDeleted: true },
  });

  if (!user || user.isDeleted) return null;
  if ((user.tokenVersion ?? 1) !== (payload.tokenVersion ?? 1)) return null;

  return {
    dbId: userId,
    role: payload.role,
  };
}
