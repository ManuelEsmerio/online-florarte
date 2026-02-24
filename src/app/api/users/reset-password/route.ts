// src/app/api/users/reset-password/route.ts
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { successResponse, errorHandler } from '@/utils/api-utils';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return errorHandler(new Error('Token y contraseña son requeridos.'), 400);
    }

    if (password.length < 6) {
      return errorHandler(new Error('La contraseña debe tener al menos 6 caracteres.'), 400);
    }

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiry: { gt: new Date() },
        isDeleted: false,
      },
    });

    if (!user) {
      return errorHandler(new Error('El enlace de recuperación no es válido o ha expirado.'), 400);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiry: null,
      },
    });

    return successResponse({ message: 'Contraseña restablecida correctamente.' });

  } catch (error) {
    console.error('[RESET_PASSWORD_ERROR]', error);
    return errorHandler(error, 500);
  }
}
