import { NextResponse } from 'next/server'

interface ErrorOptions {
  status?: number
  details?: any
}

export function errorHandler(error: unknown, options: ErrorOptions = {}) {
  const isDev = process.env.NODE_ENV !== 'production'

  // Normalizamos el error
  const err = error instanceof Error ? error : new Error(String(error))

  const statusCode = options.status || 500

  const responseBody: Record<string, any> = {
    success: false,
    message: err.message || 'Internal Server Error',
  }

  // Solo en desarrollo mostramos más detalles
  if (isDev) {
    responseBody.error = {
      name: err.name,
      stack: err.stack,
      details: options.details || null
    }
  }

  return NextResponse.json(responseBody, { status: statusCode })
}
