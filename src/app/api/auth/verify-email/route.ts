// src/app/api/auth/verify-email/route.ts
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorHandler } from '@/utils/api-utils';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');

    if (!token) {
      return errorHandler(new Error('Token de verificación requerido.'), 400);
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: tokenHash,
        emailVerificationExpiry: { gt: new Date() },
        isDeleted: false,
      },
    });

    if (!user) {
      return errorHandler(new Error('El enlace de verificación no es válido o ha expirado.'), 400);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      },
    });

    return successResponse({ message: '¡Correo verificado correctamente!' });

  } catch (error) {
    console.error('[VERIFY_EMAIL_ERROR]', error);
    return errorHandler(error, 500);
  }
}
