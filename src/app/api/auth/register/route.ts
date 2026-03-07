import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { errorHandler } from '@/utils/api-utils';
import { sendVerificationEmail } from '@/lib/email';
import crypto from 'crypto';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { isPasswordStrong, PASSWORD_POLICY_MESSAGE } from '@/utils/passwordPolicy';
import { z, ZodError } from 'zod';

const registerSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.').max(200),
  email: z.string().email('El correo electrónico no es válido.').max(254),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.').max(1000),
});

export async function POST(req: NextRequest) {
  // 10 registros por IP cada hora
  const ip = getClientIp(req);
  const rl = await checkRateLimit(`register:${ip}`, 10, 60 * 60 * 1000);
  if (!rl.allowed) {
    return errorHandler(new Error('Demasiados registros desde esta dirección. Intenta más tarde.'), 429);
  }

  try {
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return errorHandler(new Error('Formato de solicitud inválido.'), 400);
    }

    let parsed: z.infer<typeof registerSchema>;
    try {
      parsed = registerSchema.parse(rawBody);
    } catch (err) {
      if (err instanceof ZodError) {
        return errorHandler(new Error(err.errors[0]?.message ?? 'Datos inválidos.'), 400);
      }
      throw err;
    }

    const { name, email, password } = parsed;

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
    const verificationTokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    const newUser = await prisma.user.create({
      data: {
        name,
        email: emailLower,
        passwordHash: hashedPassword,
        emailVerificationToken: verificationTokenHash,
        emailVerificationExpiry: verificationExpiry,
      },
    });

    // Enviar email en background — no bloquear la respuesta si falla
    sendVerificationEmail(emailLower, verificationToken).catch((err) => {
      console.error('[REGISTER] Error enviando email de verificación:', err);
    });

    // No auto-login: el usuario debe verificar su correo primero
    return NextResponse.json(
      { success: true, needsVerification: true, email: emailLower },
      { status: 201 }
    );

  } catch (error) {
    return errorHandler(error, 500);
  }
}
