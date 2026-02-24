import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { successResponse, errorHandler } from '@/utils/api-utils';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return errorHandler(new Error('Todos los campos son requeridos.'), 400);
    }

    const emailLower = email.toLowerCase();

    // Verificar duplicado real en BD
    const existingUser = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (existingUser) {
      return errorHandler(
        new Error('El correo electrónico ya está registrado.'),
        409
      );
    }

    // Hash seguro
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear usuario real en MySQL
    const newUser = await prisma.user.create({
      data: {
        name,
        email: emailLower,
        password: hashedPassword,
      },
    });

    // Quitar password de la respuesta
    const { password: _, ...userSafe } = newUser;

    return successResponse(userSafe, 201);

  } catch (error) {
    return errorHandler(error, 500);
  }
}