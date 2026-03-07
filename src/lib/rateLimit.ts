import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Rate limiter híbrido (Upstash Redis + fallback en memoria).
 *
 * En producción Redis es OBLIGATORIO. Sin él, cada instancia serverless
 * mantiene su propio contador y el límite puede multiplicarse por el número
 * de instancias activas, haciendo el rate limiting inefectivo.
 *
 * En desarrollo local, el fallback en memoria es aceptable.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();
const limiterCache = new Map<string, Ratelimit>();

const redisRestUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisRestToken = process.env.UPSTASH_REDIS_REST_TOKEN;

// En producción, Redis es obligatorio para rate limiting distribuido efectivo.
if (process.env.NODE_ENV === 'production' && (!redisRestUrl || !redisRestToken)) {
  console.error(
    '[rateLimit] CRÍTICO: UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN son obligatorios en ' +
    'producción. El rate limiting en memoria es inefectivo en entornos multi-instancia (serverless). ' +
    'Configura Upstash Redis para protección real.',
  );
}

const redis = redisRestUrl && redisRestToken
  ? new Redis({ url: redisRestUrl, token: redisRestToken })
  : null;

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
const getDistributedLimiter = (max: number, windowMs: number): Ratelimit | null => {
  if (!redis) return null;
  const cacheKey = `${max}:${windowMs}`;
  if (!limiterCache.has(cacheKey)) {
    const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));
    limiterCache.set(cacheKey, new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(max, `${windowSeconds} s`),
    }));
  }
  return limiterCache.get(cacheKey)!;
};

export async function checkRateLimit(key: string, max: number, windowMs: number): Promise<RateLimitResult> {
  const distributedLimiter = getDistributedLimiter(max, windowMs);

  if (distributedLimiter) {
    const result = await distributedLimiter.limit(key);
    return {
      allowed: result.success,
      remaining: Math.max(0, result.remaining),
      resetAt: result.reset * 1000,
    };
  }

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

/**
 * Extrae la IP real del cliente de forma segura.
 *
 * Orden de prioridad (del más confiable al menos):
 * 1. CF-Connecting-IP  → Cloudflare lo inyecta y sobreescribe encabezados previos
 * 2. X-Real-IP        → Vercel / nginx lo inyectan en el edge
 * 3. X-Forwarded-For  → Último IP de la cadena (el que añadió el proxy conocido)
 *
 * NOTA IMPORTANTE: X-Forwarded-For puede ser falsificado por el cliente si la
 * infraestructura no elimina el encabezado entrante. Usa siempre el ÚLTIMO IP
 * de la cadena (añadido por tu proxy de confianza), no el primero. En Vercel/
 * Cloudflare, CF-Connecting-IP / X-Real-IP son más seguros.
 */
export function getClientIp(req: Request): string {
  // Cloudflare sobreescribe este header — es el más confiable en ese entorno
  const cfConnecting = req.headers.get('cf-connecting-ip')?.trim();
  if (cfConnecting) return cfConnecting;

  // Vercel / nginx edge
  const xRealIp = req.headers.get('x-real-ip')?.trim();
  if (xRealIp) return xRealIp;

  // X-Forwarded-For: usar el ÚLTIMO IP (añadido por el proxy de confianza),
  // no el primero (que puede ser falsificado por el cliente).
  const forwardedFor = req.headers.get('x-forwarded-for') ?? '';
  const ips = forwardedFor.split(',').map((ip) => ip.trim()).filter(Boolean);
  if (ips.length > 0) return ips[ips.length - 1];

  return 'unknown';
}
