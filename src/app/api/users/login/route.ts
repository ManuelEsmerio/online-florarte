
// src/app/api/users/login/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { allUsers } from '@/lib/data/user-data';

/**
 * POST /api/users/login
 * Endpoint de login simulado que valida contra user-data.ts.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    
    if (!email || !password) {
      return errorHandler(new Error('Email y contraseña son requeridos.'), 400);
    }

    // Buscar en la "base de datos" simulada
    const user = allUsers.find(u => 
      u.email.toLowerCase() === email.toLowerCase() && 
      u.password === password && 
      !u.is_deleted
    );
    
    if (!user) {
        return errorHandler(new Error('Credenciales inválidas.'), 401);
    }
    
    // Para propósitos de seguridad en la respuesta, removemos la contraseña
    const { password: _, ...userSafe } = user;
    
    return successResponse(userSafe);

  } catch (error) {
    console.error('[API_LOGIN_ERROR]', error);
    return errorHandler(error, 500);
  }
}
