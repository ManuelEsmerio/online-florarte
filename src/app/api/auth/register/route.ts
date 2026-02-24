import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { errorHandler } from '@/utils/api-utils';
import { signToken, COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return errorHandler(new Error('Todos los campos son requeridos.'), 400);
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

    const newUser = await prisma.user.create({
      data: {
        name,
        email: emailLower,
        passwordHash: hashedPassword,
      },
    });

    const { passwordHash: _, ...userSafe } = newUser;

    const token = await signToken({
      sub: String(newUser.id),
      role: newUser.role,
    });

    const res = NextResponse.json({ success: true, data: userSafe }, { status: 201 });

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });

    return res;

  } catch (error) {
    return errorHandler(error, 500);
  }
}
