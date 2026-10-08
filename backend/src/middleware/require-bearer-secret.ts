import type { RequestHandler } from 'express';
import { timingSafeEqual } from 'node:crypto';

export function requireBearerSecret(readSecret: () => string, settingName: string): RequestHandler {
  return (req, res, next) => {
    const expected = readSecret();
    if (!expected) {
      return res.status(503).json({ error: 'not_configured', message: `${settingName} is not configured` });
    }

    const header = req.get('authorization') ?? '';
    const provided = header.startsWith('Bearer ') ? header.slice(7) : '';

    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return res.status(401).json({ error: 'unauthorized', message: 'Bad secret' });
    }

    next();
  };
}
