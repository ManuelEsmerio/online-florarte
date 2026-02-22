// src/utils/session.ts
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

const CART_SESSION_COOKIE = 'session_id';

/**
 * Obtiene el ID de sesión de las cookies de la petición. Si no existe,
 * crea uno nuevo y prepara una respuesta para establecer la nueva cookie.
 * 
 * @param request La petición entrante de Next.js.
 * @returns Un objeto con el `sessionId` y opcionalmente una `NextResponse`
 *          si se tuvo que crear una nueva sesión.
 */
export function getOrCreateSessionId(request: NextRequest) {
  let sessionId = request.cookies.get(CART_SESSION_COOKIE)?.value;
  let response: NextResponse | undefined;

  if (!sessionId) {
    sessionId = uuidv4();
    
    // Preparamos una respuesta para establecer la cookie, pero aún no la enviamos.
    // La ruta de la API que llame a esta función será responsable de usar esta respuesta.
    response = new NextResponse();
    response.cookies.set({
      name: CART_SESSION_COOKIE,
      value: sessionId,
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 días
      path: '/',
    });
  }

  return { sessionId, response };
}


/**
 * Lee el ID de sesión de la petición, sin crearlo si no existe.
 * @param req La petición de Next.js.
 * @returns El `sessionId` o `null` si no se encuentra.
 */
export function getSessionId(req: NextRequest): string | null {
  return req.cookies.get(CART_SESSION_COOKIE)?.value || null;
}
