import {
  WorkspaceSettingsModel,
  type RazorpayMode,
} from '../models/workspaceSettings.model.js';
import { encrypt, decrypt, maskTail, isEncryptionConfigured } from '../lib/crypto.js';
import { testConnection, keyMatchesMode } from './payment.service.js';

/** One mode's credentials as the settings screen is allowed to see them. */
export interface KeyPairView {
  keyId?: string;
  keySecretMask?: string;
  webhookSecretMask?: string;
  merchantId?: string;
  businessName?: string;
  verifiedAt?: Date;
}

/**
 * What the settings screen is allowed to see.
 *
 * The secrets are reduced to "something is saved, ending in these four
 * characters". Enough for someone to recognise which key they pasted; not
 * enough to use it, and not enough to leak one through the management API.
 */
export interface RazorpaySettingsView {
  enabled: boolean;
  mode: RazorpayMode;
  test: KeyPairView;
  live: KeyPairView;
  lastChargeAt?: Date;
  /** False when ENCRYPTION_KEY is missing — the UI explains rather than failing on save. */
  configurable: boolean;
  /** What is still outstanding before this workspace can take a payment. */
  checklist: ChecklistItem[];
}

export interface ChecklistItem {
  id: 'keys' | 'verified' | 'webhook' | 'enabled' | 'charged';
  label: string;
  done: boolean;
  /** Shown when not done — what to actually do about it. */
  hint?: string;
}

function decryptMask(value?: string): string | undefined {
  // Decrypting only to mask looks wasteful, but the tail has to come from the
  // real value, and storing it separately would mean a second place that can
  // drift out of step with the secret it describes.
  return value ? maskTail(decrypt(value)) : undefined;
}

/**
 * The steps between an empty settings screen and a working payment.
 *
 * Spelled out because every one of them fails silently otherwise: keys that
 * were never verified look identical to working keys, and a missing webhook
 * shows up only as responses that never leave 'pending'.
 */
function buildChecklist(
  pair: KeyPairView,
  enabled: boolean,
  lastChargeAt?: Date
): ChecklistItem[] {
  const hasKeys = Boolean(pair.keyId && pair.keySecretMask);
  return [
    {
      id: 'keys',
      label: 'API keys saved',
      done: hasKeys,
      hint: 'Paste the Key ID and Key Secret from your Razorpay dashboard.',
    },
    {
      id: 'verified',
      label: 'Keys verified with Razorpay',
      done: Boolean(pair.verifiedAt),
      hint: 'Press "Test connection" to check the keys actually work.',
    },
    {
      id: 'webhook',
      label: 'Webhook secret saved',
      done: Boolean(pair.webhookSecretMask),
      // Not optional despite sounding like it: the webhook is the only thing
      // that marks a payment complete, so without it every response stays
      // pending forever and no confirmation email is ever sent.
      hint: 'Create a webhook in Razorpay and paste its secret here. Payments are not confirmed without it.',
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

export async function getRazorpaySettings(workspaceId: string): Promise<RazorpaySettingsView> {
  const settings = await WorkspaceSettingsModel.findOne({ workspaceId });
  const razorpay = settings?.razorpay;
  const mode = razorpay?.mode ?? 'test';

  const view = (which: 'test' | 'live'): KeyPairView => {
    const pair = razorpay?.[which];
    const account = which === 'live' ? razorpay?.liveAccount : razorpay?.testAccount;
    return {
      keyId: pair?.keyId,
      keySecretMask: decryptMask(pair?.keySecretEnc),
      webhookSecretMask: decryptMask(pair?.webhookSecretEnc),
      merchantId: account?.merchantId,
      businessName: account?.businessName,
      verifiedAt: account?.verifiedAt,
    };
  };

  const test = view('test');
  const live = view('live');
  const enabled = Boolean(razorpay?.enabled);

  return {
    enabled,
    mode,
    test,
    live,
    lastChargeAt: razorpay?.lastChargeAt,
    configurable: isEncryptionConfigured(),
    // Only the active mode's readiness matters — live keys sitting unverified
    // are not a problem while the workspace is charging in test.
    checklist: buildChecklist(mode === 'live' ? live : test, enabled, razorpay?.lastChargeAt),
  };
}

export interface RazorpaySettingsInput {
  enabled?: boolean;
  mode?: RazorpayMode;
  /** Which key set this save is editing. Defaults to the active mode. */
  target?: RazorpayMode;
  keyId?: string;
  /** Omitted leaves the stored secret alone — the UI sends it only when replacing it. */
  keySecret?: string;
  webhookSecret?: string;
}

export class KeyModeMismatchError extends Error {}

/**
 * Save credentials, encrypting anything new.
 *
 * An absent secret means "keep what is there", not "clear it": the settings
 * form shows a mask rather than the real value, so submitting it unchanged must
 * not wipe the key.
 */
export async function saveRazorpaySettings(workspaceId: string, input: RazorpaySettingsInput) {
  const existing = await WorkspaceSettingsModel.findOne({ workspaceId });
  const target = input.target ?? input.mode ?? existing?.razorpay?.mode ?? 'test';

  // A live key in the test slot would mean the first "test" payment takes real
  // money off a real card. Refused rather than warned about.
  if (input.keyId && !keyMatchesMode(input.keyId.trim(), target)) {
    throw new KeyModeMismatchError(
      `That looks like a ${target === 'live' ? 'test' : 'live'} key. ${
        target === 'live' ? 'Live' : 'Test'
      } keys start with rzp_${target}_.`
    );
  }

  const update: Record<string, unknown> = {};
  if (input.enabled !== undefined) update['razorpay.enabled'] = input.enabled;
  if (input.mode !== undefined) update['razorpay.mode'] = input.mode;
  if (input.keyId !== undefined) update[`razorpay.${target}.keyId`] = input.keyId.trim();
  if (input.keySecret) {
    update[`razorpay.${target}.keySecretEnc`] = encrypt(input.keySecret.trim());
    // The stored verification described the old key. Cleared so the checklist
    // stops claiming a key nobody has tested is verified.
    update[`razorpay.${target}Account.verifiedAt`] = null;
  }
  if (input.webhookSecret) {
    update[`razorpay.${target}.webhookSecretEnc`] = encrypt(input.webhookSecret.trim());
  }

  await WorkspaceSettingsModel.findOneAndUpdate(
    { workspaceId },
    { $set: update, $setOnInsert: { workspaceId } },
    { upsert: true, new: true }
  );

  return getRazorpaySettings(workspaceId);
}

/**
 * Check a mode's saved keys against Razorpay, and remember the result.
 *
 * Run on demand from the settings screen, so a wrong key is caught by the
 * owner rather than by the first respondent who tries to pay.
 */
export async function verifyRazorpayKeys(workspaceId: string, mode: RazorpayMode) {
  const settings = await WorkspaceSettingsModel.findOne({ workspaceId });
  const pair = settings?.razorpay?.[mode];
  if (!pair?.keyId || !pair.keySecretEnc) {
    return { ok: false, message: `No ${mode} keys are saved yet.` };
  }

  const result = await testConnection({
    keyId: pair.keyId,
    keySecret: decrypt(pair.keySecretEnc),
  });

  if (result.ok) {
    await WorkspaceSettingsModel.updateOne(
      { workspaceId },
      {
        $set: {
          [`razorpay.${mode}Account.verifiedAt`]: new Date(),
          [`razorpay.${mode}Account.merchantId`]: result.merchantId,
          ...(result.businessName
            ? { [`razorpay.${mode}Account.businessName`]: result.businessName }
            : {}),
        },
      }
    );
  }

  return result;
}

/** Forget one mode's credentials, leaving the other alone. */
export async function disconnectRazorpay(workspaceId: string, mode: RazorpayMode) {
  await WorkspaceSettingsModel.findOneAndUpdate(
    { workspaceId },
    {
      $unset: { [`razorpay.${mode}`]: '', [`razorpay.${mode}Account`]: '' },
      // Disconnecting the mode being charged through must also stop the
      // charging, or every submission would hit a configuration error.
      $set: { 'razorpay.enabled': false },
    }
  );
  return getRazorpaySettings(workspaceId);
}

/** Stamped when a charge settles, so the checklist's last step can complete. */
export async function markCharged(workspaceId: string) {
  await WorkspaceSettingsModel.updateOne(
    { workspaceId },
    { $set: { 'razorpay.lastChargeAt': new Date() } }
  );
}
