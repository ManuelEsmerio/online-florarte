// src/middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE_NAME, verifyToken } from '@/lib/jwt';
import { isAdminRole } from '@/utils/auth';

const unauthorizedResponse = () =>
  NextResponse.json(
    { success: false, data: null, message: 'No autorizado', errorCode: 'AUTH_REQUIRED' },
    { status: 401 }
  );

const forbiddenResponse = () =>
  NextResponse.json(
    { success: false, data: null, message: 'Acceso prohibido', errorCode: 'ADMIN_REQUIRED' },
    { status: 403 }
  );

export async function proxy(request: NextRequest) {
  const isAdminApi = request.nextUrl.pathname.startsWith('/api/admin');

  if (!isAdminApi) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return unauthorizedResponse();
  }

  const payload = await verifyToken(token);
  if (!payload || !isAdminRole(payload.role)) {
    return forbiddenResponse();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/admin/:path*'],
};
