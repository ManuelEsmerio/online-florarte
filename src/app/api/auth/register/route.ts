import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { errorHandler } from '@/utils/api-utils';
import { signToken, COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/jwt';
import { sendVerificationEmail } from '@/lib/email';
import crypto from 'crypto';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { isPasswordStrong, PASSWORD_POLICY_MESSAGE } from '@/utils/passwordPolicy';

export async function POST(req: NextRequest) {
  // 10 registros por IP cada hora
  const ip = getClientIp(req);
  const rl = checkRateLimit(`register:${ip}`, 10, 60 * 60 * 1000);
  if (!rl.allowed) {
    return errorHandler(new Error('Demasiados registros desde esta dirección. Intenta más tarde.'), 429);
  }

  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return errorHandler(new Error('Todos los campos son requeridos.'), 400);
    }

    if (!isPasswordStrong(password)) {
      return errorHandler(new Error(PASSWORD_POLICY_MESSAGE), 400);
    }

    const emailLower = email.toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (existingUser) {
      return errorHandler(
        new Error('El correo electrónico ya está registrado.'),
        409
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    const newUser = await prisma.user.create({
      data: {
        name,
        email: emailLower,
        passwordHash: hashedPassword,
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: verificationExpiry,
      },
    });

    const { passwordHash: _, ...userSafe } = newUser;

    const jwtToken = await signToken({
      sub: String(newUser.id),
      role: newUser.role,
    });

    const res = NextResponse.json({ success: true, data: userSafe }, { status: 201 });

    res.cookies.set(COOKIE_NAME, jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });

    // Enviar email en background — no bloquear la respuesta si falla
    sendVerificationEmail(emailLower, verificationToken).catch((err) => {
      console.error('[REGISTER] Error enviando email de verificación:', err);
    });

    return res;

  } catch (error) {
    return errorHandler(error, 500);
  }
}
