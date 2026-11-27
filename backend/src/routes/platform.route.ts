import { Router } from 'express';
import { asyncHandler } from '../middleware/async-handler.js';
import { requirePlatform } from '../middleware/require-platform.js';
import { readRange } from '../lib/platform-range.js';
import { databaseHealth } from '../services/platform-health.service.js';
import { platformMetrics } from '../services/platform-metrics.service.js';

const PRODUCT = 'da-forms';

export const platformRouter = Router();

platformRouter.get('/capabilities', requirePlatform(PRODUCT, 'products:read'), (_req, res) => {
  res.json({ product: PRODUCT, connectorVersion: 'v1', capabilities: ['metrics', 'health'] });
});

platformRouter.get(
  '/health',
  requirePlatform(PRODUCT, 'products:read'),
  asyncHandler(async (_req, res) => {
    const checks = [await databaseHealth()];
    res.json({ ok: checks.every((check) => check.ok), product: PRODUCT, time: new Date().toISOString(), checks });
  })
);

platformRouter.get(
  '/metrics/summary',
  requirePlatform(PRODUCT, 'overview:read'),
  asyncHandler(async (req, res) => {
    const { from, to } = readRange(req.query.from, req.query.to);
    res.json(await platformMetrics(from, to));
  })
);