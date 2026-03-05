import { NextResponse } from 'next/server';
import { UserFacingError } from './errors';

/**
 * Genera una respuesta de éxito estandarizada.
 * @param data - Los datos a incluir en la respuesta.
 * @param status - El código de estado HTTP (por defecto 200).
 * @param res - Una instancia opcional de NextResponse para añadirle cookies.
 * @returns Un objeto NextResponse.
 */
export function successResponse(data: any, status: number = 200, res: NextResponse = new NextResponse()) {
  const body = JSON.stringify({
    success: true,
    data: data,
    message: null,
    errorCode: null,
  });

  // Clona la respuesta para poder modificar las cabeceras
  const response = new NextResponse(body, {
    status,
    headers: {
        ...res.headers,
        'Content-Type': 'application/json',
    },
  });

  // Copia las cookies de la respuesta original a la nueva respuesta
  res.cookies.getAll().forEach(cookie => {
    response.cookies.set(cookie);
  });

  return response;
}

/**
 * Genera una respuesta de error estandarizada y registra el error.
 * @param error - El objeto de error.
 * @param status - El código de estado HTTP (por defecto 500).
 * @returns Un objeto NextResponse.
 */
export function errorHandler(error: any, status: number = 500) {
  // UserFacingError carries a safe, user-readable message and its own status code
  const resolvedStatus = (error instanceof UserFacingError) ? error.statusCode : status;

  const defaultMessage = "Ocurrió un error inesperado.";
  const errorCode = error?.code || null;
  const internalMessage =
    error instanceof Error && error.message && error.message.trim() !== '' && error.message.toLowerCase() !== 'null'
      ? error.message
      : defaultMessage;

  const explicitPublicMessage =
    typeof error?.publicMessage === 'string' && error.publicMessage.trim() !== ''
      ? error.publicMessage
      : null;

  const isClientError = resolvedStatus >= 400 && resolvedStatus < 500;
  const clientMessage = explicitPublicMessage || (isClientError ? internalMessage : defaultMessage);

  console.error(`[API Error]: ${internalMessage}`, { status: resolvedStatus, code: errorCode, errorObj: error });

  return NextResponse.json({
    success: false,
    data: null,
    message: clientMessage,
    errorCode,
  }, { status: resolvedStatus });
}
