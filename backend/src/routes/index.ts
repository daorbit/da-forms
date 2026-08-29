import { Router } from 'express';
import { healthRouter } from './health.route.js';
import { workspaceFormRouter, workspaceSettingsRouter, publicFormRouter } from './form.route.js';
import { cronRouter } from './cron.route.js';

export const routes = Router();

routes.use('/health', healthRouter);
routes.use('/cron', cronRouter);
routes.use('/workspaces/:workspaceId/forms', workspaceFormRouter);
routes.use('/workspaces/:workspaceId/settings', workspaceSettingsRouter);
routes.use('/public/forms', publicFormRouter);
