import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { errorHandler } from '@/utils/api-utils';
import { signToken, COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return errorHandler(new Error('Formato de solicitud inválido.'), 400);
    }

    const { email, password } = body;

    if (!email || !password) {
      return errorHandler(new Error('Email y contraseña son requeridos.'), 400);
    }

    const emailLower = email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: emailLower },
      include: {
        addresses: {
          where: { isDeleted: false },
          orderBy: { isDefault: 'desc' },
        },
      },
    });

    if (!user || !user.passwordHash) {
      return errorHandler(new Error('Credenciales inválidas.'), 401);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return errorHandler(new Error('Credenciales inválidas.'), 401);
    }

    const { passwordHash: _, ...userSafe } = user;

    const token = await signToken({
      sub: String(user.id),
      role: user.role,
    });

    const res = NextResponse.json({ success: true, data: userSafe });

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });

    return res;

  } catch (error) {
    console.error('Login error:', error);
    return errorHandler(error, 500);
  }
}
