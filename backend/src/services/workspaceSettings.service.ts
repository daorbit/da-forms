import {
  WorkspaceSettingsModel,
  type PaymentMode,
  type PaymentProvider,
} from '../models/workspaceSettings.model.js';
import { encrypt, decrypt, maskTail, isEncryptionConfigured } from '../lib/crypto.js';
import { gatewayFor, PROVIDERS, PROVIDER_LABELS } from './gateways/index.js';

export interface KeyPairView {
  keyId?: string;
  hasKeyId?: boolean;
  keySecretMask?: string;
  webhookSecretMask?: string;
  merchantId?: string;
  businessName?: string;
  verifiedAt?: Date;
}

export interface ChecklistItem {
  id: 'keys' | 'verified' | 'webhook' | 'enabled' | 'charged';
  label: string;
  done: boolean;
  hint?: string;
}

export interface ProviderSettingsView {
  provider: PaymentProvider;
  label: string;
  enabled: boolean;
  mode: PaymentMode;
  test: KeyPairView;
  live: KeyPairView;
  lastChargeAt?: Date;
  checklist: ChecklistItem[];
}

export interface PaymentSettingsView {
  defaultProvider: PaymentProvider;
  configurable: boolean;
  providers: Record<PaymentProvider, ProviderSettingsView>;
  enabled: boolean;
  mode: PaymentMode;
  test: KeyPairView;
  live: KeyPairView;
  lastChargeAt?: Date;
  checklist: ChecklistItem[];
}

function decryptMask(value?: string): string | undefined {
  return value ? maskTail(decrypt(value)) : undefined;
}

const KEY_LABELS: Record<PaymentProvider, { id: string; secret: string; dashboard: string }> = {
  razorpay: {
    id: 'Key ID',
    secret: 'Key Secret',
    dashboard: 'Razorpay dashboard',
  },
  cashfree: {
    id: 'App ID',
    secret: 'Secret Key',
    dashboard: 'Cashfree merchant dashboard',
  },
};

const WEBHOOK_USES_API_SECRET: Record<PaymentProvider, boolean> = {
  razorpay: false,
  cashfree: true,
};

function buildChecklist(
  provider: PaymentProvider,
  pair: KeyPairView,
  enabled: boolean,
  lastChargeAt?: Date
): ChecklistItem[] {
  const labels = KEY_LABELS[provider];
  const name = PROVIDER_LABELS[provider];
  const hasKeys = Boolean(pair.hasKeyId && pair.keySecretMask);
  return [
    {
      id: 'keys',
      label: 'API keys saved',
      done: hasKeys,
      hint: `Paste the ${labels.id} and ${labels.secret} from your ${labels.dashboard}.`,
    },
    {
      id: 'verified',
      label: `Keys verified with ${name}`,
      done: Boolean(pair.verifiedAt),
      hint: 'Press "Test connection" to check the keys actually work.',
    },
    {
      id: 'webhook',
      label: WEBHOOK_USES_API_SECRET[provider] ? 'Webhook registered' : 'Webhook secret saved',
      // Cashfree signs webhooks with the API secret already saved above, so
      // there is no second secret to collect — having keys is having the
      // webhook credential. Razorpay mints a separate one per webhook.
      done: WEBHOOK_USES_API_SECRET[provider] ? hasKeys : Boolean(pair.webhookSecretMask),
      hint: WEBHOOK_USES_API_SECRET[provider]
        ? `Add the webhook URL in ${name}. It is signed with your Secret Key, so there is nothing else to paste here.`
        : `Create a webhook in ${name} and paste its secret here. Payments are not confirmed without it.`,
    },
    {
      id: 'enabled',
      label: 'Payments turned on',
      done: enabled,
      hint: 'Flip the switch above once the rest is in place.',
    },
    {
      id: 'charged',
      label: 'First payment received',
      done: Boolean(lastChargeAt),
      hint: 'Submit your own form to confirm the whole flow end to end.',
    },
  ];
}

function maskKeyId(provider: PaymentProvider, keyId?: string): string | undefined {
  if (!keyId) return undefined;
  return keyId.length > 12 ? `${keyId.slice(0, 8)}…${keyId.slice(-4)}` : `…${keyId.slice(-4)}`;
}

export async function getPaymentSettings(workspaceId: string): Promise<PaymentSettingsView> {
  const settings = await WorkspaceSettingsModel.findOne({ workspaceId });

  const buildProvider = (provider: PaymentProvider): ProviderSettingsView => {
    const stored = settings?.[provider];
    const mode = stored?.mode ?? 'test';

    const view = (which: PaymentMode): KeyPairView => {
      const pair = stored?.[which];
      const account = which === 'live' ? stored?.liveAccount : stored?.testAccount;
      return {
        keyId: maskKeyId(provider, pair?.keyId),
        hasKeyId: Boolean(pair?.keyId),
        keySecretMask: decryptMask(pair?.keySecretEnc),
        webhookSecretMask: decryptMask(pair?.webhookSecretEnc),
        merchantId: account?.merchantId,
        businessName: account?.businessName,
        verifiedAt: account?.verifiedAt,
      };
    };

    const test = view('test');
    const live = view('live');
    const enabled = Boolean(stored?.enabled);

    return {
      provider,
      label: PROVIDER_LABELS[provider],
      enabled,
      mode,
      test,
      live,
      lastChargeAt: stored?.lastChargeAt,
      checklist: buildChecklist(
        provider,
        mode === 'live' ? live : test,
        enabled,
        stored?.lastChargeAt
      ),
    };
  };

  const providers = PROVIDERS.reduce(
    (acc, provider) => {
      acc[provider] = buildProvider(provider);
      return acc;
    },
    {} as Record<PaymentProvider, ProviderSettingsView>
  );

  const defaultProvider = settings?.defaultProvider ?? 'razorpay';
  const primary = providers[defaultProvider];

  return {
    defaultProvider,
    configurable: isEncryptionConfigured(),
    providers,
    enabled: primary.enabled,
    mode: primary.mode,
    test: primary.test,
    live: primary.live,
    lastChargeAt: primary.lastChargeAt,
    checklist: primary.checklist,
  };
}


export interface PaymentSettingsInput {
  provider?: PaymentProvider;
  defaultProvider?: PaymentProvider;
  enabled?: boolean;
  mode?: PaymentMode;
  target?: PaymentMode;
  keyId?: string;
  keySecret?: string;
  webhookSecret?: string;
}

export class KeyModeMismatchError extends Error {}

export async function savePaymentSettings(workspaceId: string, input: PaymentSettingsInput) {
  const existing = await WorkspaceSettingsModel.findOne({ workspaceId });
  const provider = input.provider ?? existing?.defaultProvider ?? 'razorpay';
  const target = input.target ?? input.mode ?? existing?.[provider]?.mode ?? 'test';

  if (input.keyId && !gatewayFor(provider).keyMatchesMode(input.keyId.trim(), target)) {
    throw new KeyModeMismatchError(
      `That looks like a ${target === 'live' ? 'test' : 'live'} ${PROVIDER_LABELS[provider]} key. ${
        target === 'live' ? 'Live' : 'Test'
      } keys start with rzp_${target}_.`
    );
  }

  const update: Record<string, unknown> = {};
  if (input.defaultProvider !== undefined) update.defaultProvider = input.defaultProvider;
  if (input.enabled !== undefined) update[`${provider}.enabled`] = input.enabled;
  if (input.mode !== undefined) update[`${provider}.mode`] = input.mode;
  if (input.keyId !== undefined) update[`${provider}.${target}.keyId`] = input.keyId.trim();
  if (input.keySecret) {
    update[`${provider}.${target}.keySecretEnc`] = encrypt(input.keySecret.trim());
    update[`${provider}.${target}Account.verifiedAt`] = null;
  }
  if (input.webhookSecret) {
    update[`${provider}.${target}.webhookSecretEnc`] = encrypt(input.webhookSecret.trim());
  }

  await WorkspaceSettingsModel.findOneAndUpdate(
    { workspaceId },
    { $set: update, $setOnInsert: { workspaceId } },
    { upsert: true, new: true }
  );

  return getPaymentSettings(workspaceId);
}


export async function verifyKeys(
  workspaceId: string,
  provider: PaymentProvider,
  mode: PaymentMode
) {
  const settings = await WorkspaceSettingsModel.findOne({ workspaceId });
  const pair = settings?.[provider]?.[mode];
  if (!pair?.keyId || !pair.keySecretEnc) {
    return { ok: false, message: `No ${mode} keys are saved yet.` };
  }

  const result = await gatewayFor(provider).testConnection({
    keyId: pair.keyId,
    keySecret: decrypt(pair.keySecretEnc),
    mode,
  });

  if (result.ok) {
    await WorkspaceSettingsModel.updateOne(
      { workspaceId },
      {
        $set: {
          [`${provider}.${mode}Account.verifiedAt`]: new Date(),
          [`${provider}.${mode}Account.merchantId`]: result.merchantId,
          ...(result.businessName
            ? { [`${provider}.${mode}Account.businessName`]: result.businessName }
            : {}),
        },
      }
    );
  }

  return result;
}


export async function disconnectProvider(
  workspaceId: string,
  provider: PaymentProvider,
  mode: PaymentMode
) {
  await WorkspaceSettingsModel.findOneAndUpdate(
    { workspaceId },
    {
      $unset: { [`${provider}.${mode}`]: '', [`${provider}.${mode}Account`]: '' },
      $set: { [`${provider}.enabled`]: false },
    }
  );
  return getPaymentSettings(workspaceId);
}


export async function markCharged(workspaceId: string, provider: PaymentProvider = 'razorpay') {
  await WorkspaceSettingsModel.updateOne(
    { workspaceId },
    { $set: { [`${provider}.lastChargeAt`]: new Date() } }
  );
}
