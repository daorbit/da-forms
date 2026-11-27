import type { RequestHandler } from 'express';
import { readPlatformToken } from '../lib/platform-token.js';

export function requirePlatform(audience: string, ...scopes: string[]): RequestHandler {
  return (req, res, next) => {
    const result = readPlatformToken(req.get('authorization'), audience, scopes);
    if (!result.ok) return res.status(result.status).json({ error: result.error });
    res.locals.platformAdmin = result.admin;
    res.setHeader('Cache-Control', 'no-store');
    next();
  };
}