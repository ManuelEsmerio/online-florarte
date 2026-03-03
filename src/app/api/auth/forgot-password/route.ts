// src/app/api/auth/forgot-password/route.ts
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { sendPasswordResetEmail } from '@/lib/email';
import crypto from 'crypto';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  // 3 solicitudes por IP cada hora (protege abuso del servicio de email)
  const ip = getClientIp(req);
  const rl = checkRateLimit(`forgot-password:${ip}`, 3, 60 * 60 * 1000);
  if (!rl.allowed) {
    return errorHandler(new Error('Demasiadas solicitudes de restablecimiento. Intenta más tarde.'), 429);
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return errorHandler(new Error('El correo es requerido.'), 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Respuesta genérica siempre — no revelar si el email existe o no
    if (!user || user.isDeleted) {
      return successResponse({ message: 'Si la cuenta existe, recibirás un correo en breve.' });
    }

    // Token seguro: 32 bytes = 64 chars hex
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetExpiry: expiry,
      },
    });

    await sendPasswordResetEmail(user.email, token);

    return successResponse({ message: 'Si la cuenta existe, recibirás un correo en breve.' });

  } catch (error) {
    console.error('[FORGOT_PASSWORD_ERROR]', error);
    return errorHandler(error, 500);
  }
}
