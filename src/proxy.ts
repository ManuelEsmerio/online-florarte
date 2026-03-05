// src/proxy.ts
import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE_NAME, verifyToken } from '@/lib/jwt';
import { isAdminRole } from '@/utils/auth';

const CART_SESSION_COOKIE = 'session_id';
const CART_SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 días
const isProduction = process.env.NODE_ENV === 'production';

function attachCartSession(response: NextResponse, newSessionId: string | null): NextResponse {
  if (!newSessionId) return response;
  response.cookies.set({
    name: CART_SESSION_COOKIE,
    value: newSessionId,
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: CART_SESSION_MAX_AGE,
  });
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const cartSession = request.cookies.get(CART_SESSION_COOKIE)?.value ?? null;
  const newCartSessionId = cartSession ? null : crypto.randomUUID();

  // Rutas públicas: solo asegurar cookie de carrito
  if (!pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) {
    return attachCartSession(NextResponse.next(), newCartSessionId);
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;

  // Rutas de página /admin/* → redirigir al login
  if (pathname.startsWith('/admin')) {
    if (!token) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.search = `redirect=${encodeURIComponent(pathname)}`;
      return attachCartSession(NextResponse.redirect(loginUrl), newCartSessionId);
    }

    const payload = await verifyToken(token);
    if (!payload || !isAdminRole(payload.role)) {
      return attachCartSession(NextResponse.redirect(new URL('/', request.url)), newCartSessionId);
    }

    return attachCartSession(NextResponse.next(), newCartSessionId);
  }

  // Rutas de API /api/admin/* → responder 401/403
  if (!token) {
    return attachCartSession(
      NextResponse.json(
        { success: false, data: null, message: 'No autorizado', errorCode: 'AUTH_REQUIRED' },
        { status: 401 }
      ),
      newCartSessionId
    );
  }

  const payload = await verifyToken(token);
  if (!payload || !isAdminRole(payload.role)) {
    return attachCartSession(
      NextResponse.json(
        { success: false, data: null, message: 'Acceso prohibido', errorCode: 'ADMIN_REQUIRED' },
        { status: 403 }
      ),
      newCartSessionId
    );
  }

  return attachCartSession(NextResponse.next(), newCartSessionId);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)'],
};
