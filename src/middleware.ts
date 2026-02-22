// src/middleware.ts
import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // El middleware ya no es necesario para la gestión de sesión del carrito.
  // La lógica se ha movido a `CartSessionBootstrap.tsx` y se maneja en el cliente.
  return NextResponse.next();
}

export const config = {
  // Ya no es necesario que el matcher se ejecute globalmente para este propósito.
  // Se puede mantener el archivo para futuras necesidades de middleware.
  matcher: [],
};
