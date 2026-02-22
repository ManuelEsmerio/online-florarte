import { NextResponse } from 'next/server';

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
  let errorMessage = "Ocurrió un error inesperado.";
  if (error instanceof Error && error.message && error.message.trim() !== '' && error.message.toLowerCase() !== 'null') {
      errorMessage = error.message;
  }
  
  const errorCode = error.code || null; // Captura el código de error si existe

  console.error(`[API Error]: ${errorMessage}`, { status, code: errorCode, errorObj: error });

  return NextResponse.json({
    success: false,
    data: null,
    message: errorMessage,
    errorCode: errorCode,
  }, { status });
}
