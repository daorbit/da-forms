import cors from 'cors';
import type { RequestHandler } from 'express';
import { env } from '../config/env.js';

const openCors = cors();

const dashboardCors = cors({
  origin: (origin, cb) => cb(null, !origin || env.dashboardOrigins.includes(origin)),
});

export const serviceCors: RequestHandler = (req, res, next) =>
  req.path.startsWith('/api/workspaces/') ? dashboardCors(req, res, next) : openCors(req, res, next);
