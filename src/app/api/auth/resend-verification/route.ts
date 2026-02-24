// src/app/api/auth/resend-verification/route.ts
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { sendVerificationEmail } from '@/lib/email';
import { getDecodedToken } from '@/utils/auth';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const session = await getDecodedToken(req);

    if (!session?.dbId) {
      return errorHandler(new Error('No autorizado.'), 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: session.dbId },
    });

    if (!user || user.isDeleted) {
      return errorHandler(new Error('Usuario no encontrado.'), 404);
    }

    if (user.emailVerifiedAt) {
      return errorHandler(new Error('El correo ya está verificado.'), 400);
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: token,
        emailVerificationExpiry: expiry,
      },
    });

    await sendVerificationEmail(user.email, token);

    return successResponse({ message: 'Correo de verificación reenviado.' });

  } catch (error) {
    console.error('[RESEND_VERIFICATION_ERROR]', error);
    return errorHandler(error, 500);
  }
}
