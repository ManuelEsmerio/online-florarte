// src/app/api/users/addresses/[id]/route.ts
import { NextRequest } from 'next/server';
import { successResponse, errorHandler } from '@/utils/api-utils';
import { getDecodedToken, UserSession } from '@/utils/auth';
import { addressService } from '@/services/addressService';
import { ZodError } from 'zod';

interface RouteParams {
  params: { id: string };
}

/**
 * PUT /api/users/addresses/[id]
 * Endpoint protegido para actualizar una dirección existente para el usuario autenticado.
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session: UserSession | null = await getDecodedToken(req);
    if (!session?.dbId) {
      return errorHandler(new Error('Acceso denegado.'), 401);
    }

    const addressId = parseInt(params.id, 10);
    const body = await req.json();
    
    // Asegurarse de que el ID de la dirección en el cuerpo coincida o se use el de la URL
    const addressData = { ...body, id: addressId };

    // El servicio maneja la lógica de actualizar la dirección
    const updatedAddress = await addressService.addOrUpdateAddress(session.dbId, addressData);
    
    return successResponse(updatedAddress);

  } catch (error) {
    if (error instanceof ZodError) {
      return errorHandler(error, 400);
    }
    console.error(`[API_ADDRESS_PUT_ERROR] ID: ${params.id}`, error);
    return errorHandler(error);
  }
}


/**
 * DELETE /api/users/addresses/[id]
 * Endpoint protegido para eliminar una dirección del usuario autenticado.
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        const session: UserSession | null = await getDecodedToken(req);
        if (!session?.dbId) {
            return errorHandler(new Error('Acceso denegado.'), 401);
        }
        
        const addressId = parseInt(params.id, 10);
        
        await addressService.deleteAddress(session.dbId, addressId);

        return successResponse({ message: 'Address deleted successfully' });

    } catch (error) {
        console.error(`[API_ADDRESS_DELETE_ERROR] ID: ${params.id}`, error);
        return errorHandler(error);
    }
}
