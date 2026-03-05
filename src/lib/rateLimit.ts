import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Rate limiter híbrido (Upstash Redis + fallback en memoria).
 *
 * En producción se usará Redis (clave compartida entre lambdas). Si las
 * credenciales no están configuradas, se mantiene el modo en memoria para
 * entornos locales, aunque sin la misma protección.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();
const limiterCache = new Map<string, Ratelimit>();

const redisRestUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisRestToken = process.env.UPSTASH_REDIS_REST_TOKEN;
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

/** Extrae la IP real del cliente considerando proxies (Vercel, Cloudflare). */
export function getClientIp(req: Request): string {
  return (
    (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}
