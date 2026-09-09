import type { RequestHandler } from 'express';
import * as settingsService from '../services/workspaceSettings.service.js';
import { isEncryptionConfigured } from '../lib/crypto.js';
import { isPaymentProvider } from '../services/gateways/index.js';
import type { PaymentProvider } from '../models/workspaceSettings.model.js';

function readProvider(value: unknown): PaymentProvider {
  return isPaymentProvider(value) ? value : 'razorpay';
}

export const getPaymentSettings: RequestHandler = async (req, res) => {
  const settings = await settingsService.getPaymentSettings(req.params.workspaceId);
  res.json(settings);
};

export const savePaymentSettings: RequestHandler = async (req, res) => {
  // Refused rather than stored in the clear: a gateway secret sitting
  // unencrypted in the database is worse than the feature being unavailable.
  if (!isEncryptionConfigured()) {
    return res.status(503).json({
      error: 'encryption_unavailable',
      message: 'Payments cannot be configured until ENCRYPTION_KEY is set on the server.',
    });
  }

  const { enabled, mode, target, keyId, keySecret, webhookSecret, defaultProvider } = req.body;
  const provider = readProvider(req.body.provider);

  // Turning payments on with nothing to charge through would leave every
  // respondent hitting a 503 at submit time, so the credentials are checked
  // here instead.
  if (enabled) {
    const current = await settingsService.getPaymentSettings(req.params.workspaceId);
    const providerView = current.providers[provider];
    const activeMode = mode ?? providerView.mode;
    const pair = activeMode === 'live' ? providerView.live : providerView.test;
    const editing = (target ?? activeMode) === activeMode;
    const willHaveKeyId = editing ? (keyId ?? pair.hasKeyId) : pair.hasKeyId;
    const willHaveSecret = editing ? keySecret || pair.keySecretMask : pair.keySecretMask;
    if (!willHaveKeyId || !willHaveSecret) {
      return res.status(400).json({
        error: 'incomplete_credentials',
        message: `Add both credentials for ${providerView.label} ${activeMode} mode before turning payments on.`,
      });
    }
  }

  try {
    const settings = await settingsService.savePaymentSettings(req.params.workspaceId, {
      provider,
      defaultProvider: isPaymentProvider(defaultProvider) ? defaultProvider : undefined,
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

/** Asks the gateway whether the saved keys work, and records the answer. */
export const testPaymentConnection: RequestHandler = async (req, res) => {
  const mode = req.body?.mode === 'live' ? 'live' : 'test';
  const provider = readProvider(req.body?.provider);
  const result = await settingsService.verifyKeys(req.params.workspaceId, provider, mode);
  const settings = await settingsService.getPaymentSettings(req.params.workspaceId);
  res.json({ ...result, settings });
};

export const disconnectPayments: RequestHandler = async (req, res) => {
  const mode = req.query.mode === 'live' ? 'live' : 'test';
  const provider = readProvider(req.query.provider);
  const settings = await settingsService.disconnectProvider(
    req.params.workspaceId,
    provider,
    mode
  );
  res.json(settings);
};
