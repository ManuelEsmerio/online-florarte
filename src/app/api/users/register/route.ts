// src/app/api/users/register/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { allUsers } from '@/lib/data/user-data';
import { v4 as uuidv4 } from 'uuid';
import type { User } from '@/lib/definitions';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();
    if (!name || !email || !password) {
        return errorHandler(new Error('Todos los campos son requeridos.'), 400);
    }

    const emailLower = email.toLowerCase();
    if (allUsers.find(u => u.email.toLowerCase() === emailLower)) {
        return errorHandler(new Error('El correo electrónico ya está registrado.'), 409);
    }

    const newUser: any = {
        id: allUsers.length + 1,
        uid: uuidv4(),
        name,
        email: emailLower,
        password,
        role: 'customer',
        loyalty_points: 0,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        addresses: [],
    };

    allUsers.push(newUser);
    
    // Rematamos la contraseña antes de devolver al cliente
    const { password: _, ...userSafe } = newUser;
    
    return successResponse(userSafe, 201);
    
  } catch (error) {
    return errorHandler(error, 500);
  }
}
