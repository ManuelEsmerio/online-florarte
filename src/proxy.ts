// src/proxy.ts
import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE_NAME, verifyToken } from '@/lib/jwt';
import { isAdminRole } from '@/utils/auth';

const CART_SESSION_COOKIE = 'session_id';
const CART_SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 días
const isProduction = process.env.NODE_ENV === 'production';

function generateNonce(): string {
  // btoa + randomUUID es compatible con Edge Runtime (no requiere Buffer)
  return btoa(crypto.randomUUID());
}

function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === 'development';
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-eval'" : ''} https://www.googletagmanager.com https://www.google-analytics.com https://maps.googleapis.com https://maps.gstatic.com`,
    "child-src 'self' https://www.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' https://placehold.co https://picsum.photos https://i.pravatar.cc https://res.cloudinary.com https://maps.gstatic.com https://maps.googleapis.com data: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://www.googleapis.com https://www.google.com https://www.google-analytics.com https://api.mercadopago.com",
    "frame-src 'self' https://www.google.com",
    "object-src 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "upgrade-insecure-requests",
  ].join('; ');
}

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
  const nonce = generateNonce();
  const csp = buildCsp(nonce);

  const cartSession = request.cookies.get(CART_SESSION_COOKIE)?.value ?? null;
  const newCartSessionId = cartSession ? null : crypto.randomUUID();

  // Headers de request modificados para que los server components lean el nonce
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  // Crea un NextResponse.next() con los headers de request modificados y la CSP aplicada
  function nextWithNonce(): NextResponse {
    const res = NextResponse.next({ request: { headers: requestHeaders } });
    res.headers.set('Content-Security-Policy', csp);
    return res;
  }

  // Rutas públicas: solo asegurar cookie de carrito
  if (!pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) {
    return attachCartSession(nextWithNonce(), newCartSessionId);
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

    return attachCartSession(nextWithNonce(), newCartSessionId);
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

  return attachCartSession(nextWithNonce(), newCartSessionId);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)'],
};
