import type { NextFunction, Request, Response } from 'express';
import { timingSafeEqual } from 'node:crypto';

/** Small in-memory fixed-window limiter, per IP and route. Good enough for a single instance. */
export function rateLimit(max: number, windowMs: number) {
  const hits = new Map<string, { n: number; reset: number }>();
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip}:${req.baseUrl}${req.route?.path ?? req.path}`;
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || entry.reset < now) {
      hits.set(key, { n: 1, reset: now + windowMs });
      return next();
    }
    if (++entry.n > max) {
      res.setHeader('Retry-After', Math.ceil((entry.reset - now) / 1000));
      return res.status(429).json({ error: 'Too many requests, please try again in a minute.' });
    }
    next();
  };
}

/** Bearer-token guard for the admin endpoints. Disabled entirely when ADMIN_TOKEN is unset. */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return res.status(503).json({ error: 'Admin is disabled. Set ADMIN_TOKEN in .env to enable it.' });
  const given = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return res.status(401).json({ error: 'Unauthorised' });
  next();
}
