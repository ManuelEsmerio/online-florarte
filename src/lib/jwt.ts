// src/lib/jwt.ts
import { SignJWT, jwtVerify } from 'jose';

const rawSecret = process.env.JWT_SECRET;
if (!rawSecret || rawSecret.length < 32) {
  throw new Error(
    '[jwt] JWT_SECRET no configurado o demasiado corto (mínimo 32 chars). ' +
    "Genera uno con: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
  );
}
const secret = new TextEncoder().encode(rawSecret);

export const COOKIE_NAME = 'florarte_session';
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 días en segundos

export interface JwtPayload {
  sub: string;  // user ID como string
  role: string;
}

export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      sub: payload.sub as string,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
}
