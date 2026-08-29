import { Schema, model } from 'mongoose';

/**
 * Which set of keys a workspace charges through.
 *
 * Kept as two separate credential sets rather than one that gets overwritten:
 * an owner testing a form should not have to re-paste their live keys
 * afterwards, and the mode switch should be instant rather than a re-entry.
 */
export type RazorpayMode = 'test' | 'live';

export interface RazorpayKeyPair {
  keyId?: string;
  /**
   * Encrypted at rest, never returned by the API. See `crypto.ts` — the
   * plaintext exists only inside a request that is about to call Razorpay.
   */
  keySecretEnc?: string;
  /** Encrypted. Verifies that a webhook really came from Razorpay. */
  webhookSecretEnc?: string;
}

/**
 * What Razorpay reports about the connected account.
 *
 * Stored so the settings screen can name the account rather than showing a key
 * prefix — an owner with several Razorpay accounts otherwise has no way to
 * tell which one they pasted.
 */
export interface RazorpayAccountInfo {
  merchantId?: string;
  businessName?: string;
  /** When the credentials were last proven to work. */
  verifiedAt?: Date;
}

export interface RazorpaySettings {
  enabled?: boolean;
  mode?: RazorpayMode;
  test?: RazorpayKeyPair;
  live?: RazorpayKeyPair;
  /** Keyed by mode — a test account and a live account are different accounts. */
  testAccount?: RazorpayAccountInfo;
  liveAccount?: RazorpayAccountInfo;
  /** Set the first time a real charge settles, whichever mode it was in. */
  lastChargeAt?: Date;
}

export interface WorkspaceSettingsDocument {
  workspaceId: string;
  razorpay?: RazorpaySettings;
  createdAt: Date;
  updatedAt: Date;
}

const keyPairSchema = new Schema<RazorpayKeyPair>(
  {
    keyId: { type: String },
    keySecretEnc: { type: String },
    webhookSecretEnc: { type: String },
  },
  { _id: false }
);

const accountInfoSchema = new Schema<RazorpayAccountInfo>(
  {
    merchantId: { type: String },
    businessName: { type: String },
    verifiedAt: { type: Date },
  },
  { _id: false }
);

const workspaceSettingsSchema = new Schema<WorkspaceSettingsDocument>(
  {
    workspaceId: { type: String, required: true, unique: true, index: true },
    razorpay: {
      type: new Schema<RazorpaySettings>(
        {
          enabled: { type: Boolean },
          // Test by default: an owner who enables payments before thinking
          // about modes should be charging nobody, not charging for real.
          mode: { type: String, enum: ['test', 'live'], default: 'test' },
          test: { type: keyPairSchema },
          live: { type: keyPairSchema },
          testAccount: { type: accountInfoSchema },
          liveAccount: { type: accountInfoSchema },
          lastChargeAt: { type: Date },
        },
        { _id: false }
      ),
    },
  },
  { timestamps: true }
);

export const WorkspaceSettingsModel = model<WorkspaceSettingsDocument>(
  'WorkspaceSettings',
  workspaceSettingsSchema
);
