// src/app/api/users/addresses/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession } from '@/utils/auth';
import { addressService } from '@/services/addressService';
import { ZodError } from 'zod';

/**
 * POST /api/users/addresses
 * Endpoint protegido para crear una nueva dirección para el usuario autenticado.
 */
export async function POST(req: NextRequest) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) {
      return errorHandler(new Error('Acceso denegado.'), 401);
    }
    const body = await req.json();

    // El servicio maneja la lógica de añadir la dirección
    const newAddress = await addressService.addOrUpdateAddress(session.dbId, body);
    
    return successResponse(newAddress, 201);

  } catch (error) {
    if (error instanceof ZodError) {
      return errorHandler(error, 400);
    }
    console.error('[API_ADDRESS_POST_ERROR]', error);
    return errorHandler(error);
  }
}
