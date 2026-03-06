// src/app/api/users/reset-password/route.ts
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { isPasswordStrong, PASSWORD_POLICY_MESSAGE } from '@/utils/passwordPolicy';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return errorHandler(new Error('Token y contraseña son requeridos.'), 400);
    }

    if (!isPasswordStrong(password)) {
      return errorHandler(new Error(PASSWORD_POLICY_MESSAGE), 400);
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: tokenHash,
        passwordResetExpiry: { gt: new Date() },
        isDeleted: false,
      },
    });

    if (!user) {
      return errorHandler(new Error('El enlace de recuperación no es válido o ha expirado.'), 400);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Incrementar tokenVersion invalida todos los JWTs activos — fuerza re-login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiry: null,
        tokenVersion: { increment: 1 },
      },
    });

    return successResponse({ message: 'Contraseña restablecida correctamente.' });

  } catch (error) {
    console.error('[RESET_PASSWORD_ERROR]', error);
    return errorHandler(error, 500);
  }
}
