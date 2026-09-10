import type { RequestHandler } from 'express';
import * as apps from '../services/appConnection.service.js';

 

export const listApps: RequestHandler = async (req, res) => {
  res.json(await apps.listApps(req.params.workspaceId));
};

export const getApp: RequestHandler = async (req, res) => {
  try {
    res.json(await apps.getApp(req.params.workspaceId, req.params.appId));
  } catch (err) {
    if (err instanceof apps.UnknownAppError) {
      return res.status(404).json({ error: 'unknown_app', message: err.message });
    }
    throw err;
  }
};

export const saveApp: RequestHandler = async (req, res) => {
  if (!apps.isEncryptionConfigured()) {
    return res.status(503).json({
      error: 'encryption_unavailable',
      message: 'Apps cannot be connected until ENCRYPTION_KEY is set on the server.',
    });
  }

  try {
    const view = await apps.saveApp(req.params.workspaceId, req.params.appId, {
      values: req.body?.values ?? req.body,
      enabled: typeof req.body?.enabled === 'boolean' ? req.body.enabled : undefined,
    });
    res.json(view);
  } catch (err) {
    if (err instanceof apps.UnknownAppError) {
      return res.status(404).json({ error: 'unknown_app', message: err.message });
    }
    if (err instanceof apps.ConfigInvalidError) {
      return res.status(400).json({ error: 'config_invalid', message: err.message });
    }
    throw err;
  }
};

export const testApp: RequestHandler = async (req, res) => {
  try {
    const to = String(req.body?.to ?? '').trim() || undefined;
    const result = await apps.testApp(req.params.workspaceId, req.params.appId, to);
    const view = await apps.getApp(req.params.workspaceId, req.params.appId);
    res.json({ ...result, app: view });
  } catch (err) {
    if (err instanceof apps.UnknownAppError) {
      return res.status(404).json({ error: 'unknown_app', message: err.message });
    }
    throw err;
  }
};

export const disconnectApp: RequestHandler = async (req, res) => {
  try {
    res.json(await apps.disconnectApp(req.params.workspaceId, req.params.appId));
  } catch (err) {
    if (err instanceof apps.UnknownAppError) {
      return res.status(404).json({ error: 'unknown_app', message: err.message });
    }
    throw err;
  }
};
