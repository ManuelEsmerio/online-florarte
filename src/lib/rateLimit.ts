/**
 * Rate limiter en memoria para Next.js (Vercel serverless).
 *
 * Funciona dentro de instancias Lambda calientes (warm invocations).
 * Protege contra ráfagas de peticiones a la misma función.
 *
 * NOTA: Para entornos con múltiples instancias concurrentes se recomienda
 * migrar a @upstash/ratelimit + Vercel KV (sin cambios en la API de uso).
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Singleton del módulo — persiste entre invocaciones calientes
const store = new Map<string, RateLimitEntry>();

// Limpiar entradas expiradas cada 5 minutos para evitar memory leak
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * @param key       Identificador único: p.ej. `login:${ip}` o `forgot:${email}`
 * @param max       Máximo de intentos permitidos en la ventana
 * @param windowMs  Duración de la ventana en milisegundos
 */
export function checkRateLimit(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1, resetAt: now + windowMs };
  }

  if (entry.count >= max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: max - entry.count, resetAt: entry.resetAt };
}

/** Extrae la IP real del cliente considerando proxies (Vercel, Cloudflare). */
export function getClientIp(req: Request): string {
  return (
    (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}
