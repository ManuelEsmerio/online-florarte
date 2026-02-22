// src/app/api/auth/login/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/lib/http';
import * as authService from '@/features/auth/auth.service';
import { loginSchema } from '@/features/auth/auth.schema';
import { ZodError } from 'zod';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const credentials = loginSchema.parse(body);
    
    const user = authService.login(credentials);

    // No hay cookies que establecer en modo demo
    return successResponse(user);

  } catch (error) {
    if (error instanceof ZodError) {
      return errorHandler(new Error('Email y contraseña son requeridos.'), 400);
    }
    if (error instanceof Error) {
        return errorHandler(error, 401);
    }
    return errorHandler(error);
  }
}
