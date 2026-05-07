import { Request, Response, NextFunction } from 'express';

interface Bucket {
  count: number;
  resetAt: number;
}

const stores = new Map<string, Map<string, Bucket>>();

interface Options {
  windowMs: number;
  max: number;
  keyName: string;
  message?: string;
}

export function rateLimit({ windowMs, max, keyName, message }: Options) {
  if (!stores.has(keyName)) stores.set(keyName, new Map());
  const bucket = stores.get(keyName)!;

  return (req: Request, res: Response, next: NextFunction) => {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      req.socket.remoteAddress ||
      'unknown';
    const now = Date.now();

    let entry = bucket.get(ip);
    if (!entry || entry.resetAt < now) {
      entry = { count: 0, resetAt: now + windowMs };
      bucket.set(ip, entry);
    }

    entry.count++;

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({
        success: false,
        error: message || 'Demasiadas solicitudes. Intenta de nuevo en unos minutos.',
      });
    }

    next();
  };
}

// Best-effort cleanup every 10 minutes to avoid unbounded memory growth
setInterval(() => {
  const now = Date.now();
  for (const bucket of stores.values()) {
    for (const [ip, entry] of bucket.entries()) {
      if (entry.resetAt < now) bucket.delete(ip);
    }
  }
}, 10 * 60 * 1000).unref();
