// src/app/api/users/change-password/route.ts
import { NextRequest } from 'next/server';
import { getDecodedToken, UserSession } from '@/utils/auth';
import { successResponse, errorHandler } from '@/utils/api-utils';
import * as z from 'zod';
import { userRepository } from '@/repositories/userRepository';

const passwordSchema = z.object({
  newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres.'),
});

export async function POST(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) {
      return errorHandler(new Error('No autorizado.'), 401);
    }
    
    const body = await req.json();
    const validation = passwordSchema.safeParse(body);
    if (!validation.success) {
      return errorHandler(new Error('Contraseña inválida.'), 400);
    }
    
    const { newPassword } = validation.data;

    // Actualizamos la contraseña en nuestra "base de datos" local en memoria
    await userRepository.update(session.dbId, { password: newPassword });
    
    return successResponse({ message: 'Contraseña actualizada correctamente (Modo Demo).' });

  } catch (error: any) {
    return errorHandler(new Error('No se pudo cambiar la contraseña.'));
  }
}
