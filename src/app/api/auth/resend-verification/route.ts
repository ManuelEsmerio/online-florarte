// src/app/api/auth/resend-verification/route.ts
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { sendVerificationEmail } from '@/lib/email';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  // 3 reenvíos por email cada 15 minutos
  const ip = getClientIp(req);
  const ipRl = checkRateLimit(`resend_verify_ip:${ip}`, 5, 15 * 60 * 1000);
  if (!ipRl.allowed) {
    return errorHandler(new Error('Demasiadas solicitudes. Intenta de nuevo en 15 minutos.'), 429);
  }

  try {
    let body: { email?: string } = {};
    try {
      body = await req.json();
    } catch {
      return errorHandler(new Error('Formato de solicitud inválido.'), 400);
    }

    const email = String(body.email ?? '').toLowerCase().trim();
    if (!email || !email.includes('@')) {
      return errorHandler(new Error('Correo electrónico requerido.'), 400);
    }

    // Rate limit per email address as well
    const emailRl = checkRateLimit(`resend_verify_email:${email}`, 3, 15 * 60 * 1000);
    if (!emailRl.allowed) {
      return errorHandler(new Error('Demasiadas solicitudes para este correo. Intenta de nuevo en 15 minutos.'), 429);
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always respond with success to avoid user enumeration
    if (!user || user.isDeleted || user.emailVerifiedAt) {
      return successResponse({ message: 'Si el correo existe y no está verificado, recibirás un nuevo enlace.' });
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

    return successResponse({ message: 'Si el correo existe y no está verificado, recibirás un nuevo enlace.' });

  } catch (error) {
    console.error('[RESEND_VERIFICATION_ERROR]', error);
    return errorHandler(error, 500);
  }
}
