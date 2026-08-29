import type { RequestHandler } from 'express';
import * as settingsService from '../services/workspaceSettings.service.js';
import { isEncryptionConfigured } from '../lib/crypto.js';

export const getPaymentSettings: RequestHandler = async (req, res) => {
  const settings = await settingsService.getRazorpaySettings(req.params.workspaceId);
  res.json(settings);
};

export const savePaymentSettings: RequestHandler = async (req, res) => {
  // Refused rather than stored in the clear: a Razorpay secret sitting
  // unencrypted in the database is worse than the feature being unavailable.
  if (!isEncryptionConfigured()) {
    return res.status(503).json({
      error: 'encryption_unavailable',
      message: 'Payments cannot be configured until ENCRYPTION_KEY is set on the server.',
    });
  }

  const { enabled, mode, target, keyId, keySecret, webhookSecret } = req.body;

  // Turning payments on with nothing to charge through would leave every
  // respondent hitting a 503 at submit time, so the credentials are checked
  // here instead.
  if (enabled) {
    const current = await settingsService.getRazorpaySettings(req.params.workspaceId);
    const activeMode = mode ?? current.mode;
    const pair = activeMode === 'live' ? current.live : current.test;
    const willHaveKeyId = (target ?? activeMode) === activeMode ? keyId ?? pair.hasKeyId : pair.hasKeyId;
    const willHaveSecret =
      (target ?? activeMode) === activeMode ? keySecret || pair.keySecretMask : pair.keySecretMask;
    if (!willHaveKeyId || !willHaveSecret) {
      return res.status(400).json({
        error: 'incomplete_credentials',
        message: `Add both a Key ID and a Key Secret for ${activeMode} mode before turning payments on.`,
      });
    }
  }

  try {
    const settings = await settingsService.saveRazorpaySettings(req.params.workspaceId, {
      enabled,
      mode,
      target,
      keyId,
      keySecret,
      webhookSecret,
    });
    res.json(settings);
  } catch (err) {
    if (err instanceof settingsService.KeyModeMismatchError) {
      return res.status(400).json({ error: 'key_mode_mismatch', message: err.message });
    }
    throw err;
  }
};

/** Asks Razorpay whether the saved keys work, and records the answer. */
export const testPaymentConnection: RequestHandler = async (req, res) => {
  const mode = req.body?.mode === 'live' ? 'live' : 'test';
  const result = await settingsService.verifyRazorpayKeys(req.params.workspaceId, mode);
  const settings = await settingsService.getRazorpaySettings(req.params.workspaceId);
  res.json({ ...result, settings });
};

export const disconnectPayments: RequestHandler = async (req, res) => {
  const mode = req.query.mode === 'live' ? 'live' : 'test';
  const settings = await settingsService.disconnectRazorpay(req.params.workspaceId, mode);
  res.json(settings);
};
