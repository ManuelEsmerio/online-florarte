import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { successResponse, errorHandler } from '@/utils/api-utils';

export async function POST(req: NextRequest) {
  try {
    // Manejar caso donde el cuerpo puede estar vacío o mal formado
    let body;
    try {
      body = await req.json();
    } catch (e) {
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
          where: {
            isDeleted: false,
          },
          orderBy: {
            isDefault: "desc",
          },
        },
      },
    });

    if (!user || !user.passwordHash) {
      // Usar mensaje genérico por seguridad
      return errorHandler(new Error('Credenciales inválidas.'), 401);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return errorHandler(new Error('Credenciales inválidas.'), 401);
    }

    // Eliminar password de la respuesta
    // Usamos una variable intermedia para estructurar mejor el retorno si es necesario
    const { passwordHash: _, ...userSafe } = user;

    return successResponse(userSafe);

  } catch (error) {
    console.error('Login error:', error);
    return errorHandler(error, 500);
  }
}
