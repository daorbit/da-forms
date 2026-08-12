import type { RequestHandler } from 'express';
import type { HealthResponse } from '../types/index.js';

export const getHealth: RequestHandler = (_req, res) => {
  const body: HealthResponse = { status: 'ok', uptime: process.uptime() };
  res.json(body);
};
