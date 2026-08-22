import { Router } from 'express';
import { healthRouter } from './health.route.js';
import { formRouter } from './form.route.js';

export const routes = Router();

routes.use('/health', healthRouter);
routes.use('/forms', formRouter);
